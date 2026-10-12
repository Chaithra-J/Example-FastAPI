from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import services
from models import (
    CandidateCreate,
    CandidateResponse,
    EvaluationCreate,
    EvaluationResponse,
    InterviewDetailCreate,
    InterviewDetailResponse,
    InterviewerCreate,
    InterviewerResponse,
)

router = APIRouter()

@router.get("/candidates", response_model=List[CandidateResponse])
def read_candidates(db: Session = Depends(get_db)):
    return services.get_candidates(db)

@router.post("/candidates", response_model=CandidateResponse)
def create_candidate(candidate: CandidateCreate, db: Session = Depends(get_db)):
    return services.create_candidate(db, candidate.dict())

@router.get("/interview-details", response_model=List[InterviewDetailResponse])
def read_interview_details(db: Session = Depends(get_db)):
    return services.get_interview_details(db)

@router.post("/interview-details", response_model=InterviewDetailResponse)
def create_interview_detail(interview_detail: InterviewDetailCreate, db: Session = Depends(get_db)):
    return services.create_interview_detail(db, interview_detail.dict())

@router.get("/interviewers", response_model=List[InterviewerResponse])
def read_interviewers(db: Session = Depends(get_db)):
    return services.get_interviewers(db)

@router.post("/interviewers", response_model=InterviewerResponse)
def create_interviewer(interviewer: InterviewerCreate, db: Session = Depends(get_db)):
    return services.create_interviewer(db, interviewer.dict())

@router.get("/evaluations", response_model=List[EvaluationResponse])
def read_evaluations(
    department: Optional[str] = None,
    decision: Optional[str] = None,
    submitted_from: Optional[datetime] = None,
    submitted_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    if submitted_from and submitted_from.tzinfo:
        submitted_from = submitted_from.astimezone(timezone.utc).replace(tzinfo=None)
    if submitted_to and submitted_to.tzinfo:
        submitted_to = submitted_to.astimezone(timezone.utc).replace(tzinfo=None)
    if submitted_from and submitted_to and submitted_from > submitted_to:
        raise HTTPException(status_code=400, detail="Submission start must be before submission end.")
    return services.get_evaluations(db, department, decision, submitted_from, submitted_to)

@router.post("/evaluations", response_model=EvaluationResponse)
def create_evaluation(evaluation: EvaluationCreate, db: Session = Depends(get_db)):
    if not (1 <= evaluation.technical_score <= 10) or not (1 <= evaluation.communication_score <= 10):
        raise HTTPException(status_code=400, detail="Scores must be between 1 and 10.")
    return services.create_evaluation(db, evaluation.dict())