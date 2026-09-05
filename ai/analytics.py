import numpy as np
from scipy.fft import fft, fftfreq
from scipy.spatial import KDTree
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean
from sklearn.ensemble import IsolationForest
import xgboost as xgb

class AdvancedAnalytics:
    def __init__(self):
        # Isolation Forest for multivariate anomaly detection
        self.iso_forest = IsolationForest(contamination=0.05, random_state=42)
        self.is_iso_trained = False
        self.training_buffer = []

        # XGBoost placeholder
        self.xgb_model = xgb.XGBClassifier()
        self.is_xgb_trained = False

    def analyze_vibration(self, rpm_history):
        if not rpm_history or len(rpm_history) < 10:
            return {"status": "INSUFFICIENT_DATA"}

        rpm_max = np.max(rpm_history)
        rpm_min = np.min(rpm_history)
        rpm_avg = np.mean(rpm_history)
        
        ssi = 0
        if rpm_avg > 0:
            ssi = (rpm_max - rpm_min) / rpm_avg

        # FFT Analysis
        N = len(rpm_history)
        T = 1.0 / 2.0 # Assume 2Hz sampling for demo
        yf = fft(rpm_history)
        xf = fftfreq(N, T)[:N//2]
        
        spectral_energy = np.sum(np.abs(yf[:N//2])**2) / N
        
        # Find dominant frequency (ignore DC component index 0)
        dominant_freq = 0
        if N > 2:
            idx = np.argmax(np.abs(yf[1:N//2])) + 1
            dominant_freq = xf[idx]

        vibrationRisk = "LOW"
        if ssi > 0.5 or spectral_energy > 5000:
            vibrationRisk = "CRITICAL"
        elif ssi > 0.2:
            vibrationRisk = "HIGH"

        return {
            "stickSlipIndex": float(ssi),
            "dominantFrequency": float(dominant_freq),
            "spectralEnergy": float(spectral_energy),
            "vibrationRisk": vibrationRisk
        }

    def anti_collision(self, current_traj, offset_trajectories):
        # current_traj: [x, y, z], offset_trajectories: [[x, y, z], ...]
        if not offset_trajectories:
            return {"status": "NO_OFFSET_WELLS"}

        tree = KDTree(offset_trajectories)
        dist, idx = tree.query(current_traj)
        
        # Separation Factor (SF = Dcenter / (S1 + S2))
        # For prototype, assume S1 + S2 = 10 ft
        uncertainty = 10.0
        sf = dist / uncertainty
        
        risk = "SAFE"
        if sf < 1.0:
            risk = "CRITICAL"
        elif sf < 1.5:
            risk = "WARNING"

        return {
            "nearestDistance": float(dist),
            "separationFactor": float(sf),
            "risk": risk,
            "nearestIndex": int(idx)
        }

    def analyze_lithology(self, current_log, historical_log):
        # DTW
        if not current_log or not historical_log:
            return {"status": "INSUFFICIENT_DATA"}
        
        distance, path = fastdtw(current_log, historical_log, dist=euclidean)
        
        # Normalize similarity score
        max_dist = len(current_log) * 100 # arbitrary max
        similarity = max(0, 100 - (distance / max_dist) * 100)
        
        return {
            "dtwDistance": float(distance),
            "similarityScore": float(similarity),
            "confidence": 0.85
        }

    def predict_pore_pressure(self, depth, trend_pressure):
        # Academic Prototype: Normal hydrostatic gradient is ~0.433 psi/ft (fresh water) to 0.465 (salt)
        # We will add a small deviation based on depth
        baseline = depth * 0.465
        predicted = baseline * (1 + (np.sin(depth / 1000) * 0.05)) # artificial trend
        
        deviation = ((predicted - trend_pressure) / trend_pressure) * 100 if trend_pressure > 0 else 0
        risk = "LOW"
        if abs(deviation) > 15:
            risk = "CRITICAL"
        elif abs(deviation) > 5:
            risk = "WARNING"

        return {
            "predictedPorePressure": float(predicted),
            "baselinePressure": float(baseline),
            "deviation": float(deviation),
            "riskLevel": risk
        }

    def run_isolation_forest(self, features_dict):
        # features_dict: {'pressure': 3000, 'rpm': 120, ...}
        features = list(features_dict.values())
        
        if not self.is_iso_trained:
            self.training_buffer.append(features)
            if len(self.training_buffer) > 50: # train after 50 samples
                X = np.array(self.training_buffer)
                self.iso_forest.fit(X)
                self.is_iso_trained = True
            return {"status": "GATHERING_DATA", "isAnomaly": False, "anomalyScore": 0}
        
        X_test = np.array([features])
        pred = self.iso_forest.predict(X_test)[0] # 1 = normal, -1 = anomaly
        score = self.iso_forest.score_samples(X_test)[0] # negative score
        
        is_anomaly = bool(pred == -1)
        # Normalize score
        normalized_score = max(0, min(100, abs(score) * 100))
        
        return {
            "isAnomaly": is_anomaly,
            "anomalyScore": float(normalized_score),
            "confidence": 0.9
        }

    def lstm_forecast(self, series):
        # Prototype Time Series Forecasting (LSTM Placeholder)
        if len(series) < 10:
            return {"status": "INSUFFICIENT_DATA"}
            
        # In a real model, this would invoke a loaded PyTorch/Keras LSTM
        # For the demo, we do a simple moving average trend extrapolation
        recent = series[-5:]
        trend = np.mean(np.diff(recent))
        forecast = series[-1] + trend * 5 # forecast 5 steps ahead
        
        return {
            "predictedValue": float(forecast),
            "confidence": 0.75,
            "model": "LSTM_PROTOTYPE"
        }
