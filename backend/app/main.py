# app/main.py
from typing import List
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI, Depends, HTTPException, status,Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.responses import JSONResponse
from typing import Optional


from . import models, schemas
from .database import Base, engine, get_db
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    decode_refresh_token
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IssueHub API", version="0.4.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


# --------- Helpers de user/auth ---------


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


def authenticate_user(db: Session, username: str, password: str) -> models.User | None:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    username = decode_access_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ---------- AUTH / USERS ----------


@app.post("/users", response_model=schemas.UserRead)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User)
        .filter(
            (models.User.username == user_in.username)
            | (models.User.email == user_in.email)
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de usuario o correo ya registrados.",
        )

    hashed_password = get_password_hash(user_in.password)
    db_user = models.User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/token", response_model=schemas.Token)
@limiter.limit("3/minute")
def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.username})
    refresh_token = create_refresh_token({"sub": user.username})

    response.set_cookie(
        key="ih_refresh",
        value=refresh_token,
        httponly=True,
        secure=False,       # ✅ LOCAL: False | PROD (HTTPS): True
        samesite="lax",     # "lax" suele ser lo mejor para empezar
        path="/",           # o "/token/refresh" si querés más restrictivo
        max_age=60 * 60 * 24 * 7,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/token/refresh", response_model=schemas.Token)
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    refresh_token = request.cookies.get("ih_refresh")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No hay refresh token.")

    username = decode_refresh_token(refresh_token) 
    if username is None:
        raise HTTPException(status_code=401, detail="Refresh token inválido.")

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado.")

    new_access = create_access_token({"sub": user.username})
    new_refresh = create_refresh_token({"sub": user.username})  

    response.set_cookie(
        key="ih_refresh",
        value=new_refresh,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )

    return {"access_token": new_access, "token_type": "bearer"}

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("ih_refresh", path="/")
    return {"message": "ok"}

@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Superaste el número de intentos permitidos. Esperá un minuto y volvé a intentar."
        },
        headers={"Retry-After": "60"},
    )

@app.get("/users/me", response_model=schemas.UserRead)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.put("/users/update")
def update_user(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Cambiar username
    if data.username:
        user_with_same_username = (
            db.query(models.User)
            .filter(models.User.username == data.username)
            .first()
        )
        if user_with_same_username and user_with_same_username.id != current_user.id:
            raise HTTPException(
                status_code=400, detail="El nombre de usuario ya está en uso."
            )
        current_user.username = data.username

    # Cambiar email
    if data.email:
        user_with_same_email = (
            db.query(models.User)
            .filter(models.User.email == data.email)
            .first()
        )
        if user_with_same_email and user_with_same_email.id != current_user.id:
            raise HTTPException(
                status_code=400, detail="El correo electrónico ya está en uso."
            )
        current_user.email = data.email

    # Cambiar contraseña
    if data.password:
        hashed = get_password_hash(data.password)
        current_user.hashed_password = hashed

    db.commit()
    db.refresh(current_user)

    return {"message": "Usuario actualizado correctamente."}


# ---------- RUTAS BÁSICAS ----------


@app.get("/")
def read_root():
    return {"message": "Bienvenido a IssueHub API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ---------- PROJECTS ----------


@app.post("/projects", response_model=schemas.ProjectRead)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_project = models.Project(
        **project.dict(),
        owner_id=current_user.id,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/projects", response_model=schemas.ProjectListResponse)
def list_projects(
    page: int = Query(0, ge=0, le=10000) ,
    limit: int = Query(5, ge=1, le=100),
    sort_field: str = Query("id"),
    sort_direction: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Project).filter(
        models.Project.owner_id == current_user.id
    )

    # orden
    if sort_field == "name":
        order_col = models.Project.name
    else:
        order_col = models.Project.id

    if sort_direction == "desc":
        order_col = order_col.desc()

    total = query.with_entities(func.count(models.Project.id)).scalar()

    projects = (
        query.order_by(order_col)
        .offset(page * limit)
        .limit(limit)
        .all()
    )

    return {"items": projects, "total": total}

@app.get("/projects/{project_id}", response_model=schemas.ProjectWithTickets)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    return project


@app.put("/projects/{project_id}", response_model=schemas.ProjectRead)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project


@app.delete("/projects/{project_id}", response_model=schemas.ProjectRead)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")

    # 👇 NO permitir eliminar si tiene tickets asociados
    tickets_count = (
        db.query(models.Ticket)
        .filter(models.Ticket.project_id == project_id)
        .count()
    )
    if tickets_count > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el proyecto porque tiene tickets asociados.",
        )

    db.delete(project)
    db.commit()
    return project


# ---------- TICKETS ----------


@app.post("/tickets", response_model=schemas.TicketRead)
def create_ticket(
    ticket: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # verificar que el proyecto exista y sea del usuario
    project = (
        db.query(models.Project)
        .filter(
            models.Project.id == ticket.project_id,
            models.Project.owner_id == current_user.id,
        )
        .first()
    )
    if not project:
        raise HTTPException(
            status_code=400,
            detail="El proyecto no existe o no pertenece al usuario actual.",
        )

    db_ticket = models.Ticket(
        **ticket.dict(),
        owner_id=current_user.id,
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@app.get("/tickets", response_model=schemas.PaginatedTicketResponse)
def list_tickets(
    page: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    sort_field: str = Query("id"),
    sort_direction: str = Query("desc"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # 1) Query base: SIEMPRE limitada al usuario actual (seguridad)
    base_query = db.query(models.Ticket).filter(
        models.Ticket.owner_id == current_user.id
    )

    # 2) Filtro por proyecto (si viene) + validación (seguridad)
    if project_id is not None:
        project = (
            db.query(models.Project)
            .filter(
                models.Project.id == project_id,
                models.Project.owner_id == current_user.id,
            )
            .first()
        )
        if not project:
            raise HTTPException(status_code=400, detail="Proyecto inválido.")

        base_query = base_query.filter(models.Ticket.project_id == project_id)

    # 3) Search (si viene)
    if search:
        s = f"%{search}%"
        base_query = base_query.filter(
            (models.Ticket.title.ilike(s)) |
            (models.Ticket.description.ilike(s))
        )

    # 4) Total SIN order_by (para que Postgres no tire error)
    total = base_query.with_entities(func.count(models.Ticket.id)).scalar()

    # 5) Ordenamiento seguro (whitelist)
    sort_map = {
        "id": models.Ticket.id,
        "title": models.Ticket.title,
        "status": models.Ticket.status,
        "priority": models.Ticket.priority,
        "created_at": models.Ticket.created_at,
        "updated_at": models.Ticket.updated_at,
    }
    sort_col = sort_map.get(sort_field, models.Ticket.id)

    # 6) Validación direction
    direction = sort_direction.lower()
    if direction not in ("asc", "desc"):
        raise HTTPException(status_code=400, detail="sort_direction inválido (asc/desc).")

    if direction == "desc":
        sort_col = sort_col.desc()

    # 7) Paginación
    skip = page * limit

    # 8) Traer items ya ordenados y paginados
    tickets = (
        base_query
        .order_by(sort_col)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {"items": tickets, "total": total}


@app.get("/tickets/{ticket_id}", response_model=schemas.TicketRead)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.id == ticket_id,
            models.Ticket.owner_id == current_user.id,
        )
        .first()
    )

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    return ticket


@app.put("/tickets/{ticket_id}", response_model=schemas.TicketRead)
def update_ticket(
    ticket_id: int,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.id == ticket_id,
            models.Ticket.owner_id == current_user.id,
        )
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")

    data = ticket_update.dict(exclude_unset=True)

    if "project_id" in data:
        project = (
            db.query(models.Project)
            .filter(
                models.Project.id == data["project_id"],
                models.Project.owner_id == current_user.id,
            )
            .first()
        )
        if not project:
            raise HTTPException(
                status_code=400,
                detail="El proyecto no existe o no pertenece al usuario actual.",
            )

    for key, value in data.items():
        setattr(ticket, key, value)

    db.commit()
    db.refresh(ticket)
    return ticket


@app.delete("/tickets/{ticket_id}", response_model=schemas.TicketRead)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = (
        db.query(models.Ticket)
        .filter(
            models.Ticket.id == ticket_id,
            models.Ticket.owner_id == current_user.id,
        )
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")

    db.delete(ticket)
    db.commit()
    return ticket
