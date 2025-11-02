from fastapi import APIRouter
from app.nlp import extract_symptoms
from app.ml_model import predict, get_description_precautions, compute_risk_score
from app.schemas import SymptomTextRequest

router = APIRouter()


@router.post("/submit")
def submit_symptoms(request: SymptomTextRequest):
    text = request.text
    extracted = extract_symptoms(text)
    symptoms = extracted["symptoms"]

    preds = predict(symptoms)
    top_disease = preds[0][0] if preds else None
    details = get_description_precautions(top_disease) if top_disease else {
        "description": "No description available.",
        "precautions": []
    }
    risk_score = compute_risk_score(symptoms)

    return {
        "input_text": text,
        "extracted": extracted,
        "predictions": preds,
        "details": details,
        "risk_score": risk_score,
        "recommendations": details.get("description", "Consult a certified doctor for further advice.")
    }

