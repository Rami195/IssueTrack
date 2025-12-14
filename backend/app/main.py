# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine
from app.limiter import limiter
from app.errors import register_error_handlers
from app.api.router import api_router

Base.metadata.create_all(bind=engine)

def create_app() -> FastAPI:
    app = FastAPI(title="IssueHub API", version="0.4.0")

    # ---- SlowAPI / Rate limit ----
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ---- Error handlers (429 custom + 500 generic) ----
    register_error_handlers(app)

    # ---- CORS ----
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Routers ----
    app.include_router(api_router)

    return app

app = create_app()
