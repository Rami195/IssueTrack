from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext

# Clave y algoritmo para JWT
SECRET_KEY = os.getenv("SECRET_KEY","dev-insecure-key")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está seteada")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Usamos pbkdf2_sha256 
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica que el password plano coincida con el hash almacenado."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera el hash seguro del password."""
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



def decode_access_token(token: str) -> Optional[str]:
 
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None

        return payload.get("sub")
    except JWTError:
        return None

def decode_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # ✅ validar que sea refresh
        if payload.get("type") != "refresh":
            return None

        return payload.get("sub")
    except JWTError:
        return None
