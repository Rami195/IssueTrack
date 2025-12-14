from fastapi import APIRouter

router = APIRouter(tags=["Core"])

@router.get("/")
def read_root():
    return {"message": "Bienvenido a IssueHub API"}

@router.get("/health")
def health_check():
    return {"status": "ok"}
