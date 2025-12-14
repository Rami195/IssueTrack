from fastapi import APIRouter, Depends
from starlette.requests import Request
from starlette.responses import Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
import app.services.auth_service as auth_service
from app.limiter import limiter

router = APIRouter(tags=["Auth"])

@router.post("/token", response_model=schemas.Token)
@limiter.limit("3/minute")
def login_for_access_token(
    request: Request,  # slowapi necesita Request en la firma
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    access_token, refresh_token = auth_service.issue_tokens(user)

    response.set_cookie(
        key="ih_refresh",
        value=refresh_token,
        httponly=True,
        secure=False,   # LOCAL False | PROD True (HTTPS)
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7,
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token/refresh", response_model=schemas.Token)
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    refresh_token = request.cookies.get("ih_refresh")
    new_access, new_refresh = auth_service.refresh_tokens(db, refresh_token)

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

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("ih_refresh", path="/")
    return {"message": "ok"}
