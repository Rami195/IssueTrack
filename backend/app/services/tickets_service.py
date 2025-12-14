from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app import models, schemas
from app.repos import tickets_repo, projects_repo


def _ensure_project_belongs_to_user(db: Session, owner_id: int, project_id: int) -> None:
    if not projects_repo.get_by_id_and_owner(db, project_id, owner_id):
        raise HTTPException(
            status_code=400,
            detail="El proyecto no existe o no pertenece al usuario actual.",
        )


def create_ticket(db: Session, owner_id: int, ticket_in: schemas.TicketCreate) -> models.Ticket:
    _ensure_project_belongs_to_user(db, owner_id, ticket_in.project_id)
    return tickets_repo.create(db, owner_id, ticket_in.dict())


def list_tickets(
    db: Session,
    owner_id: int,
    page: int,
    limit: int,
    search: str,
    sort_field: str,
    sort_direction: str,
    project_id: Optional[int],
):
    q = tickets_repo.base_query_by_owner(db, owner_id)

    # filtro por proyecto + validación de ownership
    if project_id is not None:
        _ensure_project_belongs_to_user(db, owner_id, project_id)
        q = tickets_repo.apply_project_filter(q, project_id)

    # search
    if search:
        q = tickets_repo.apply_search_filter(q, search)

    total = tickets_repo.count(q)

    # sort whitelist (igual que en tu endpoint)
    sort_map = {
        "id": models.Ticket.id,
        "title": models.Ticket.title,
        "status": models.Ticket.status,
        "priority": models.Ticket.priority,
        "created_at": models.Ticket.created_at,
        "updated_at": models.Ticket.updated_at,
    }
    sort_col = sort_map.get(sort_field, models.Ticket.id)

    direction = sort_direction.lower()
    if direction not in ("asc", "desc"):
        raise HTTPException(status_code=400, detail="sort_direction inválido (asc/desc).")
    if direction == "desc":
        sort_col = sort_col.desc()

    items = tickets_repo.list_paginated(
        q,
        offset=page * limit,
        limit=limit,
        order_col=sort_col,
    )

    return items, total


def get_ticket(db: Session, owner_id: int, ticket_id: int) -> models.Ticket:
    ticket = tickets_repo.get_by_id_and_owner(db, ticket_id, owner_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    return ticket


def update_ticket(
    db: Session,
    owner_id: int,
    ticket_id: int,
    ticket_update: schemas.TicketUpdate,
) -> models.Ticket:
    ticket = get_ticket(db, owner_id, ticket_id)

    data = ticket_update.dict(exclude_unset=True)

    if "project_id" in data and data["project_id"] is not None:
        _ensure_project_belongs_to_user(db, owner_id, data["project_id"])

    for key, value in data.items():
        setattr(ticket, key, value)

    tickets_repo.save(db)
    db.refresh(ticket)
    return ticket


def delete_ticket(db: Session, owner_id: int, ticket_id: int) -> models.Ticket:
    ticket = get_ticket(db, owner_id, ticket_id)
    tickets_repo.delete(db, ticket)
    return ticket
