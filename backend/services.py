from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session, joinedload, selectinload
import models

# --- Candidate Services ---

def get_candidates(db: Session):
    return db.query(models.Candidate).all()

def get_candidate_by_id(db: Session, candidate_id: int):
    return db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()

def create_candidate(db: Session, candidate_data: dict):
    db_candidate = models.Candidate(**candidate_data)
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate

# --- Interview Detail Services ---

def get_interview_details(db: Session):
    return db.query(models.InterviewDetail).all()

def create_interview_detail(db: Session, interview_detail_data: dict):
    db_interview_detail = models.InterviewDetail(**interview_detail_data)
    db.add(db_interview_detail)
    db.commit()
    db.refresh(db_interview_detail)
    return db_interview_detail

# --- Interviewer Services ---

def get_interviewers(db: Session):
    return db.query(models.Interviewer).all()

def create_interviewer(db: Session, interviewer_data: dict):
    db_interviewer = models.Interviewer(**interviewer_data)
    db.add(db_interviewer)
    db.commit()
    db.refresh(db_interviewer)
    return db_interviewer

# --- Evaluation Services ---

def get_evaluations(
    db: Session,
    department: Optional[str] = None,
    decision: Optional[str] = None,
    submitted_from: Optional[datetime] = None,
    submitted_to: Optional[datetime] = None,
):
    query = db.query(models.Evaluation).options(
        joinedload(models.Evaluation.interviewer),
        selectinload(models.Evaluation.competences),
    )
    if department:
        query = query.join(models.Interviewer).filter(models.Interviewer.department == department)
    if decision:
        query = query.filter(models.Evaluation.decision == decision)
    if submitted_from:
        query = query.filter(models.Evaluation.created_at >= submitted_from)
    if submitted_to:
        query = query.filter(models.Evaluation.created_at <= submitted_to)
    return query.order_by(models.Evaluation.created_at.desc()).all()

def create_evaluation(db: Session, eval_data: dict):
    competence_data = eval_data.pop("competences", [])
    db_eval = models.Evaluation(
        **eval_data,
        competences=[models.Competence(**competence) for competence in competence_data],
    )
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    return db_eval