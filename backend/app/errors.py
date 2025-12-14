from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from slowapi.errors import RateLimitExceeded

from app.exceptions import AppError

def register_error_handlers(app: FastAPI) -> None:
    # 429 - slowapi
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Superaste el número de intentos permitidos. Esperá un minuto y volvé a intentar.",
                "code": "RATE_LIMIT",
                "path": str(request.url.path),
            },
            headers={"Retry-After": "60"},
        )

    # Errores “de negocio” (services)
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "code": exc.code,
                "path": str(request.url.path),
                "extra": exc.extra,
            },
        )

    # HTTPException normal (routes)
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # exc.detail puede ser str o dict; lo normalizamos a str
        detail = exc.detail if isinstance(exc.detail, str) else "Error"
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": detail,
                "code": "HTTP_ERROR",
                "path": str(request.url.path),
            },
        )

    # 422 - Validación (Pydantic / FastAPI)
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "code": "VALIDATION_ERROR",
                "path": str(request.url.path),
                "extra": exc.errors(),  # acá tenés el detalle de campos
            },
        )

    # 500 - genérico
    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Unexpected server error",
                "code": "INTERNAL_SERVER_ERROR",
                "path": str(request.url.path),
            },
        )
