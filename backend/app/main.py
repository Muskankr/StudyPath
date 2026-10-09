from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine

from .routes.students import router as students_router
from .routes.quiz import router as quiz_router
from .routes.progress import router as progress_router
from .routes.assessment import router as assessment_router
from .routes.learning_state import router as learning_state_router
from .routes.planner import router as planner_router
from .routes.tutor import router as tutor_router

# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="StudyPath AI",
    description="Adaptive AI-powered learning platform",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://study-path-lemon.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(students_router)
app.include_router(quiz_router)
app.include_router(progress_router)
app.include_router(assessment_router)
app.include_router(learning_state_router)
app.include_router(planner_router)
app.include_router(tutor_router)

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "StudyPath AI API is running 🚀"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
