# app/repos/tickets_repo.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app import models


def create(db: Session, owner_id: int, data: dict) -> models.Ticket:
    ticket = models.Ticket(**data, owner_id=owner_id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_by_id_and_owner(db: Session, ticket_id: int, owner_id: int) -> models.Ticket | None:
    return (
        db.query(models.Ticket)
        .filter(models.Ticket.id == ticket_id, models.Ticket.owner_id == owner_id)
        .first()
    )


def base_query_by_owner(db: Session, owner_id: int):
    return db.query(models.Ticket).filter(models.Ticket.owner_id == owner_id)


def apply_project_filter(query, project_id: int):
    return query.filter(models.Ticket.project_id == project_id)


def apply_search_filter(query, search: str):
    s = f"%{search}%"
    return query.filter(
        (models.Ticket.title.ilike(s)) |
        (models.Ticket.description.ilike(s))
    )


def count(query) -> int:
    return query.with_entities(func.count(models.Ticket.id)).scalar()


def list_paginated(query, offset: int, limit: int, order_col):
    return (
        query.order_by(order_col)
        .offset(offset)
        .limit(limit)
        .all()
    )


def save(db: Session) -> None:
    db.commit()


def delete(db: Session, ticket: models.Ticket) -> None:
    db.delete(ticket)
    db.commit()
