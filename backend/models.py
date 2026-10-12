from sqlalchemy import CheckConstraint, Column, Integer, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

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
    position = Column(String(100), nullable=False)
    interviewer_id = Column(Integer, ForeignKey('interviewers.id'))
    technical_score = Column(Integer)
    communication_score = Column(Integer)
    feedback = Column(Text)
    decision = Column(String(50))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    interviewer = relationship("Interviewer", back_populates="evaluations")
    competences = relationship(
        "Competence",
        back_populates="evaluation",
        cascade="all, delete-orphan",
    )

    @property
    def department(self):
        return self.interviewer.department if self.interviewer else None


class Competence(Base):
    __tablename__ = "competences"
    __table_args__ = (
        CheckConstraint("required_level BETWEEN 1 AND 4", name="ck_competences_required_level"),
        CheckConstraint("assessed_level BETWEEN 1 AND 4", name="ck_competences_assessed_level"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False)
    competence_area = Column(String(150), nullable=False)
    required_level = Column(Integer, nullable=False)
    assessed_level = Column(Integer, nullable=False)
    evidence = Column(Text)
    observation = Column(Text)

    evaluation = relationship("Evaluation", back_populates="competences")


class Candidate(Base):
    __tablename__ = 'candidates'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)


class InterviewDetail(Base):
    __tablename__ = "interview_details"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    position = Column(String(100), nullable=False)
    interview_round = Column(String(50), nullable=False)
    interview_mode = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())


# --- Pydantic v2 Schemas ---

class InterviewerCreate(BaseModel):
    name: str
    email: str
    department: Optional[str] = None

class InterviewerResponse(InterviewerCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CompetenceCreate(BaseModel):
    competence_area: str = Field(min_length=1, max_length=150)
    required_level: int = Field(ge=1, le=4)
    assessed_level: int = Field(ge=1, le=4)
    evidence: Optional[str] = None
    observation: Optional[str] = None


class CompetenceResponse(CompetenceCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class EvaluationCreate(BaseModel):
    candidate_name: str
    position: str
    interviewer_id: int
    technical_score: int
    communication_score: int
    feedback: Optional[str] = None
    decision: str
    competences: List[CompetenceCreate] = Field(default_factory=list)

class EvaluationResponse(EvaluationCreate):
    id: int
    created_at: datetime
    department: Optional[str] = None
    competences: List[CompetenceResponse]

    model_config = ConfigDict(from_attributes=True)


class CandidateCreate(BaseModel):
    name: str


class CandidateResponse(CandidateCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class InterviewDetailCreate(BaseModel):
    position: str
    interview_round: str
    interview_mode: str


class InterviewDetailResponse(InterviewDetailCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)