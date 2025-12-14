from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
import app.services.tickets_service as tickets_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("", response_model=schemas.TicketRead)
def create_ticket(
    ticket: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return tickets_service.create_ticket(db, current_user.id, ticket)

@router.get("", response_model=schemas.PaginatedTicketResponse)
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
    items, total = tickets_service.list_tickets(
        db=db,
        owner_id=current_user.id,
        page=page,
        limit=limit,
        search=search,
        sort_field=sort_field,
        sort_direction=sort_direction,
        project_id=project_id,
    )
    return {"items": items, "total": total}

@router.get("/{ticket_id}", response_model=schemas.TicketRead)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return tickets_service.get_ticket(db, current_user.id, ticket_id)

@router.put("/{ticket_id}", response_model=schemas.TicketRead)
def update_ticket(
    ticket_id: int,
    ticket_update: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return tickets_service.update_ticket(db, current_user.id, ticket_id, ticket_update)

@router.delete("/{ticket_id}", response_model=schemas.TicketRead)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return tickets_service.delete_ticket(db, current_user.id, ticket_id)
