# backend/app/main.py
from fastapi import FastAPI
from app.api import auth, symptoms, prescriptions
from app.db import Base, engine
from app import models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Health Assistant")

# ✅ Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Create tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

# Register routers (we'll implement later)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(symptoms.router, prefix="/symptoms", tags=["symptoms"])
app.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])


@app.get("/")
def root():
    return {"status": "ok"}
