from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

from src.database import ping_db
from src.inference import compute_scores, get_model
from src.train import train as train_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 GNN service starting...")
    db_ok = await ping_db()
    if db_ok:
        print("✅ Database connected")
    else:
        print("⚠️  Database not reachable — scores will use untrained model")
    get_model()   # load model into memory on startup
    yield
    print("GNN service shutting down")


app = FastAPI(
    title="Paddy Warehouse GNN Service",
    description="Graph Neural Network anomaly detection for warehouse reliability scoring",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    db_ok = await ping_db()
    return {
        "status": "ok",
        "database": "connected" if db_ok else "unreachable",
        "model": "loaded",
    }


@app.get("/score")
async def get_scores():
    """
    Runs GNN inference on the live warehouse network graph.
    Returns reliability scores for all active warehouses.
    Called by Node.js backend after stock events or on demand.
    """
    try:
        scores = await compute_scores()
        return {
            "success": True,
            "count":   len(scores),
            "scores":  scores,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrain")
async def retrain():
    """
    Re-trains the GNN on synthetic data.
    In production this would use real historical PMB data.
    """
    try:
        train_model()
        # Reload model
        global _model
        from src.inference import _model, load_model
        _model = load_model()
        return {"success": True, "message": "Model retrained and reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))