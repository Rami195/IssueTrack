from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.repos import projects_repo


def create_project(db: Session, owner_id: int, project_in: schemas.ProjectCreate) -> models.Project:
    return projects_repo.create(
        db=db,
        owner_id=owner_id,
        name=project_in.name,
        description=project_in.description,
    )


def list_projects(
    db: Session,
    owner_id: int,
    page: int,
    limit: int,
    sort_field: str,
    sort_direction: str,
):
    # sort whitelist (mantenemos tu criterio)
    if sort_field == "name":
        order_col = models.Project.name
    else:
        order_col = models.Project.id

    if sort_direction == "desc":
        order_col = order_col.desc()

    total = projects_repo.count_by_owner(db, owner_id)
    items = projects_repo.list_by_owner(
        db=db,
        owner_id=owner_id,
        offset=page * limit,
        limit=limit,
        order_col=order_col,
    )
    return items, total


def get_project(db: Session, owner_id: int, project_id: int) -> models.Project:
    project = projects_repo.get_by_id_and_owner(db, project_id, owner_id)
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    return project


def update_project(
    db: Session,
    owner_id: int,
    project_id: int,
    project_update: schemas.ProjectUpdate,
) -> models.Project:
    project = get_project(db, owner_id, project_id)

    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(project, key, value)

    projects_repo.save(db)
    db.refresh(project)
    return project


def delete_project(db: Session, owner_id: int, project_id: int) -> models.Project:
    project = get_project(db, owner_id, project_id)

    tickets_count = projects_repo.count_tickets_in_project(db, project_id)
    if tickets_count > 0:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el proyecto porque tiene tickets asociados.",
        )

    projects_repo.delete(db, project)
    return project
