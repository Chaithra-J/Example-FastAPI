from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import services
from models import Interviewer, Evaluation, InterviewerCreate, InterviewerResponse, EvaluationCreate, EvaluationResponse

router = APIRouter()

@router.get("/interviewers", response_model=List[InterviewerResponse])
def read_interviewers(db: Session = Depends(get_db)):
    return services.get_interviewers(db)

@router.post("/interviewers", response_model=InterviewerResponse)
def create_interviewer(interviewer: InterviewerCreate, db: Session = Depends(get_db)):
    return services.create_interviewer(db, interviewer.dict())

@router.get("/evaluations", response_model=List[EvaluationResponse])
def read_evaluations(db: Session = Depends(get_db)):
    return services.get_evaluations(db)

@router.post("/evaluations", response_model=EvaluationResponse)
def create_evaluation(evaluation: EvaluationCreate, db: Session = Depends(get_db)):
    if not (1 <= evaluation.technical_score <= 10) or not (1 <= evaluation.communication_score <= 10):
        raise HTTPException(status_code=400, detail="Scores must be between 1 and 10.")
    return services.create_evaluation(db, evaluation.dict())