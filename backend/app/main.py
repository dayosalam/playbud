import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import get_settings
from .routers import auth, reference_data, games, organizers, bookings, feedback, admin
from .services.supabase_client import SupabaseUnavailableError


settings = get_settings()

app = FastAPI(title=settings.api_title, version=settings.api_version)


@app.exception_handler(SupabaseUnavailableError)
async def supabase_unavailable_handler(request: Request, exc: SupabaseUnavailableError):
    return JSONResponse(status_code=503, content={"detail": "Database service is unavailable. Please try again later."})


@app.exception_handler(httpx.ConnectError)
async def httpx_connect_error_handler(request: Request, exc: httpx.ConnectError):
    return JSONResponse(status_code=503, content={"detail": "Database service is unreachable. Please try again later."})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,          # if you use cookies/auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(reference_data.router, prefix="/api/reference-data", tags=["reference-data"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(organizers.router, prefix="/api/organizers", tags=["organizers"])
app.include_router(bookings.router, prefix="/api", tags=["bookings"])
app.include_router(feedback.router, prefix="/api", tags=["feedback"])
app.include_router(admin.router, prefix="/api", tags=["admin"])


@app.get("/health")
async def health_check():
    return {"status": "ok"}
