from sqlalchemy.orm import Session

from app import models
from app.auth import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.exceptions import UnauthorizedError
from app.repos import users_repo


def authenticate_user(db: Session, username: str, password: str) -> models.User:
    user = users_repo.get_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Usuario o contraseña incorrectos.")
    return user


def issue_tokens(user: models.User) -> tuple[str, str]:
    access_token = create_access_token({"sub": user.username})
    refresh_token = create_refresh_token({"sub": user.username})
    return access_token, refresh_token


def refresh_tokens(db: Session, refresh_token: str | None) -> tuple[str, str]:
    if not refresh_token:
        raise UnauthorizedError("No hay refresh token.")

    username = decode_refresh_token(refresh_token)
    if username is None:
        raise UnauthorizedError("Refresh token inválido.")

    user = users_repo.get_by_username(db, username)
    if user is None:
        raise UnauthorizedError("Usuario no encontrado.")

    new_access = create_access_token({"sub": user.username})
    new_refresh = create_refresh_token({"sub": user.username})
    return new_access, new_refresh
