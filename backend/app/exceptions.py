class AppError(Exception):
    def __init__(self, detail: str, code: str = "APP_ERROR", status_code: int = 400, extra=None):
        self.detail = detail
        self.code = code
        self.status_code = status_code
        self.extra = extra

class NotFoundError(AppError):
    def __init__(self, detail="Recurso no encontrado.", extra=None):
        super().__init__(detail=detail, code="NOT_FOUND", status_code=404, extra=extra)

class ForbiddenError(AppError):
    def __init__(self, detail="No autorizado.", extra=None):
        super().__init__(detail=detail, code="FORBIDDEN", status_code=403, extra=extra)

class BadRequestError(AppError):
    def __init__(self, detail="Solicitud inválida.", extra=None):
        super().__init__(detail=detail, code="BAD_REQUEST", status_code=400, extra=extra)

class UnauthorizedError(AppError):
    def __init__(self, detail="Credenciales inválidas.", extra=None):
        super().__init__(detail=detail, code="UNAUTHORIZED", status_code=401, extra=extra)
