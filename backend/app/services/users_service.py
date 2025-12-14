from sqlalchemy.orm import Session

from app import schemas, models
from app.auth import get_password_hash
from app.exceptions import BadRequestError
from app.repos import users_repo


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    # Validación de duplicados
    if user_in.username and users_repo.exists_username(db, user_in.username):
        raise BadRequestError("Nombre de usuario o correo ya registrados.")

    if user_in.email and users_repo.exists_email(db, user_in.email):
        raise BadRequestError("Nombre de usuario o correo ya registrados.")

    hashed = get_password_hash(user_in.password)
    return users_repo.create(
        db=db,
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed,
    )


def update_user(db: Session, current_user: models.User, data: schemas.UserUpdate) -> None:
    # username
    if data.username:
        if users_repo.exists_username(db, data.username, exclude_user_id=current_user.id):
            raise BadRequestError("El nombre de usuario ya está en uso.")
        current_user.username = data.username

    # email
    if data.email:
        if users_repo.exists_email(db, data.email, exclude_user_id=current_user.id):
            raise BadRequestError("El correo electrónico ya está en uso.")
        current_user.email = data.email

    # password
    if data.password:
        current_user.hashed_password = get_password_hash(data.password)

    users_repo.save(db)
    db.refresh(current_user)
