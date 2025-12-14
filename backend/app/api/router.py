# app/api/router.py
from fastapi import APIRouter
from app.api.routes import core, auth, users, projects, tickets

api_router = APIRouter()

api_router.include_router(core.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(tickets.router)
