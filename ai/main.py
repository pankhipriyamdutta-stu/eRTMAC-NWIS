from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from anomaly_detector import AnomalyDetector
from analytics import AdvancedAnalytics

app = FastAPI(title="eRTMAC-NWIS AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = AnomalyDetector()
analytics = AdvancedAnalytics()

class TelemetryPoint(BaseModel):
    parameter: str
    value: float

class VibrationPayload(BaseModel):
    rpm_history: list[float]

class CollisionPayload(BaseModel):
    current_traj: list[float]
    offset_trajectories: list[list[float]]

class LithologyPayload(BaseModel):
    current_log: list[float]
    historical_log: list[float]

class PorePressurePayload(BaseModel):
    depth: float
    trend_pressure: float

class IsoForestPayload(BaseModel):
    features: dict

class LstmPayload(BaseModel):
    series: list[float]

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Anomaly Detection"}

@app.post("/api/ai/analyze")
def analyze(data: TelemetryPoint):
    return detector.analyze(data.parameter, data.value)

@app.post("/api/ai/vibration")
def analyze_vibration(data: VibrationPayload):
    return analytics.analyze_vibration(data.rpm_history)

@app.post("/api/ai/anti-collision")
def anti_collision(data: CollisionPayload):
    return analytics.anti_collision(data.current_traj, data.offset_trajectories)

@app.post("/api/ai/lithology")
def analyze_lithology(data: LithologyPayload):
    return analytics.analyze_lithology(data.current_log, data.historical_log)

@app.post("/api/ai/pore-pressure")
def pore_pressure(data: PorePressurePayload):
    return analytics.predict_pore_pressure(data.depth, data.trend_pressure)

@app.post("/api/ai/iso-forest")
def iso_forest(data: IsoForestPayload):
    return analytics.run_isolation_forest(data.features)

@app.post("/api/ai/lstm-forecast")
def lstm_forecast(data: LstmPayload):
    return analytics.lstm_forecast(data.series)

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
