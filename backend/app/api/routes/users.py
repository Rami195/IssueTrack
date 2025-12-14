from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
import app.services.users_service as users_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=schemas.UserRead)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    return users_service.create_user(db, user_in)

@router.get("/me", response_model=schemas.UserRead)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/update")
def update_user(
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    users_service.update_user(db, current_user, data)
    return {"message": "Usuario actualizado correctamente."}
