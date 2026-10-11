from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

Base = declarative_base()


class Interviewer(Base):
    __tablename__ = 'interviewers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    department = Column(String(50))

    evaluations = relationship("Evaluation", back_populates="interviewer")


class Evaluation(Base):
    __tablename__ = 'evaluations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_name = Column(String(100), nullable=False)
    candidate_email = Column(String(100), nullable=False)
    position = Column(String(100), nullable=False)
    interviewer_id = Column(Integer, ForeignKey('interviewers.id'))
    technical_score = Column(Integer)
    communication_score = Column(Integer)
    feedback = Column(Text)
    decision = Column(String(50))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    interviewer = relationship("Interviewer", back_populates="evaluations")


# --- Pydantic v2 Schemas ---

class InterviewerCreate(BaseModel):
    name: str
    email: str
    department: Optional[str] = None

class InterviewerResponse(InterviewerCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)

class EvaluationCreate(BaseModel):
    candidate_name: str
    candidate_email: str
    position: str
    interviewer_id: int
    technical_score: int
    communication_score: int
    feedback: Optional[str] = None
    decision: str

class EvaluationResponse(EvaluationCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)