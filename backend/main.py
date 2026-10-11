from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
from database import engine
import models

# Automatically create database tables if they don't exist yet
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Interview Evaluation API", version="1.0")

# Configure CORS to allow requests from your Vite/React frontend
origins = [
    "http://localhost:5173",  # Default Vite dev server port
    "http://localhost:3000",  # Alternative React dev server port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Interview Evaluation API!"}