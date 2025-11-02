# backend/app/schemas.py
from pydantic import BaseModel

class SymptomTextRequest(BaseModel):
    text: str
