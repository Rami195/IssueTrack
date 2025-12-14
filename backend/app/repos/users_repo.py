# app/repos/users_repo.py
from sqlalchemy.orm import Session
from app import models


def get_by_username(db: Session, username: str) -> models.User | None:
    return db.query(models.User).filter(models.User.username == username).first()


def get_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def get_by_id(db: Session, user_id: int) -> models.User | None:
    return db.query(models.User).filter(models.User.id == user_id).first()


def exists_username(db: Session, username: str, exclude_user_id: int | None = None) -> bool:
    q = db.query(models.User).filter(models.User.username == username)
    if exclude_user_id is not None:
        q = q.filter(models.User.id != exclude_user_id)
    return db.query(q.exists()).scalar()


def exists_email(db: Session, email: str, exclude_user_id: int | None = None) -> bool:
    q = db.query(models.User).filter(models.User.email == email)
    if exclude_user_id is not None:
        q = q.filter(models.User.id != exclude_user_id)
    return db.query(q.exists()).scalar()


def create(
    db: Session,
    username: str,
    full_name: str | None,
    email: str | None,
    hashed_password: str,
) -> models.User:
    user = models.User(
        username=username,
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def save(db: Session) -> None:
    """Commit genérico para updates hechos sobre un modelo ya cargado."""
    db.commit()
