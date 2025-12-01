# app/main.py
from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db
from .auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IssueHub API", version="0.4.0")

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
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
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
            detail="Username or email already registered",
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
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


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
                status_code=400, detail="Username already in use"
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
                status_code=400, detail="Email already in use"
            )
        current_user.email = data.email

    # Cambiar contraseña
    if data.password:
        hashed = get_password_hash(data.password)
        current_user.hashed_password = hashed

    db.commit()
    db.refresh(current_user)

    return {"message": "User updated successfully"}


# ---------- RUTAS BÁSICAS ----------

@app.get("/")
def read_root():
    return {"message": "Welcome to IssueHub API"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ---------- PROJECTS ----------

@app.post("/projects", response_model=schemas.ProjectRead)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_project = models.Project(
        **project.dict(),
        owner_id=current_user.id  
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/projects", response_model=List[schemas.ProjectRead])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Project).filter(
    models.Project.owner_id == current_user.id
).all()


@app.get("/projects/{project_id}", response_model=schemas.ProjectWithTickets)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
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
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
        .filter(models.Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.query(models.Ticket).filter(
        models.Ticket.project_id == project_id
    ).delete(synchronize_session=False)

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
    project = (
        db.query(models.Project)
        .filter(models.Project.id == ticket.project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=400, detail="Project does not exist")

    db_ticket = models.Ticket(
        **ticket.dict(),
        owner_id=current_user.id    
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@app.get("/tickets", response_model=List[schemas.TicketRead])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Ticket).filter(
    models.Ticket.owner_id == current_user.id
).all()



@app.get("/tickets/{ticket_id}", response_model=schemas.TicketRead)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = (
    db.query(models.Ticket)
    .filter(models.Ticket.id == ticket_id)
    .filter(models.Ticket.owner_id == current_user.id)  # 🔥
    .first()
)

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
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
        .filter(models.Ticket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    data = ticket_update.dict(exclude_unset=True)

    if "project_id" in data:
        project = (
            db.query(models.Project)
            .filter(models.Project.id == data["project_id"])
            .first()
        )
        if not project:
            raise HTTPException(
                status_code=400, detail="Project does not exist"
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
    .filter(models.Ticket.id == ticket_id)
    .filter(models.Ticket.owner_id == current_user.id)
    .first()
)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    return ticket
