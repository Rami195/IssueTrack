from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
import app.services.projects_service as projects_service

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=schemas.ProjectRead)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return projects_service.create_project(db, current_user.id, project)

@router.get("", response_model=schemas.ProjectListResponse)
def list_projects(
    page: int = Query(0, ge=0, le=10000),
    limit: int = Query(5, ge=1, le=100),
    sort_field: str = Query("id"),
    sort_direction: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    items, total = projects_service.list_projects(
        db=db,
        owner_id=current_user.id,
        page=page,
        limit=limit,
        sort_field=sort_field,
        sort_direction=sort_direction,
    )
    return {"items": items, "total": total}

@router.get("/{project_id}", response_model=schemas.ProjectWithTickets)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return projects_service.get_project(db, current_user.id, project_id)

@router.put("/{project_id}", response_model=schemas.ProjectRead)
def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return projects_service.update_project(db, current_user.id, project_id, project_update)

@router.delete("/{project_id}", response_model=schemas.ProjectRead)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return projects_service.delete_project(db, current_user.id, project_id)
