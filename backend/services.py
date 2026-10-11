from sqlalchemy.orm import Session
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

def get_evaluations(db: Session):
    return db.query(models.Evaluation).all()

def create_evaluation(db: Session, eval_data: dict):
    db_eval = models.Evaluation(**eval_data)
    db.add(db_eval)
    db.commit()
    db.refresh(db_eval)
    return db_eval