from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .routers import auth, reference_data, games, organizers, bookings, feedback, admin


settings = get_settings()

app = FastAPI(title=settings.api_title, version=settings.api_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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
