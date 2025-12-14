# app/repos/projects_repo.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models


def create(db: Session, owner_id: int, name: str, description: str | None) -> models.Project:
    project = models.Project(owner_id=owner_id, name=name, description=description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def get_by_id_and_owner(db: Session, project_id: int, owner_id: int) -> models.Project | None:
    return (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.owner_id == owner_id)
        .first()
    )


def list_by_owner(db: Session, owner_id: int, offset: int, limit: int, order_col):
    return (
        db.query(models.Project)
        .filter(models.Project.owner_id == owner_id)
        .order_by(order_col)
        .offset(offset)
        .limit(limit)
        .all()
    )


def count_by_owner(db: Session, owner_id: int) -> int:
    return (
        db.query(func.count(models.Project.id))
        .filter(models.Project.owner_id == owner_id)
        .scalar()
    )


def count_tickets_in_project(db: Session, project_id: int) -> int:
    return db.query(models.Ticket).filter(models.Ticket.project_id == project_id).count()


def delete(db: Session, project: models.Project) -> None:
    db.delete(project)
    db.commit()


def save(db: Session) -> None:
    db.commit()
