# backend/create_sample_record.py
from app.db import SessionLocal
from app.models import SymptomRecord

db = SessionLocal()

record = SymptomRecord(
    user_id=None,
    input_text="I have a skin rash and itching",
    extracted_symptoms='["skin rash", "itching"]',
    predicted_disease="Fungal infection",
    risk_score=0.6
)
db.add(record)
db.commit()
db.refresh(record)

print(f"✅ Sample symptom record created with ID: {record.id}")
