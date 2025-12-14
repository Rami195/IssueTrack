from pydantic import BaseModel
from typing import Optional, Any

class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None
    path: Optional[str] = None
    extra: Optional[Any] = None