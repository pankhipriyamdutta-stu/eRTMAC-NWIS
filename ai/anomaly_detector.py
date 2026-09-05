import math

class AnomalyDetector:
    def __init__(self):
        # We will keep a very simple rolling history to compute z-scores
        self.history = {}

    def analyze(self, parameter: str, value: float):
        if parameter not in self.history:
            self.history[parameter] = []
        
        self.history[parameter].append(value)
        # Keep last 100 values
        if len(self.history[parameter]) > 100:
            self.history[parameter].pop(0)

        # Basic statistical analysis
        data = self.history[parameter]
        
        if len(data) < 5:
            return self._build_result(parameter, 10, "LOW", "Gathering baseline data", "None", 0.5)
        
        mean = sum(data) / len(data)
        variance = sum((x - mean) ** 2 for x in data) / len(data)
        std = math.sqrt(variance)

        if std == 0:
            z_score = 0
        else:
            z_score = abs((value - mean) / std)

        anomaly_score = min(100, z_score * 20) # scale to 0-100 roughly
        
        risk_level = "LOW"
        explanation = "Parameter operating normally."
        recommendation = "Continue monitoring."
        
        # In our scenario, pressure > 3200 is an anomaly
        if parameter == 'pressure' and value > 3200:
            anomaly_score = max(80, anomaly_score)
            risk_level = "CRITICAL" if value > 3300 else "HIGH"
            explanation = f"Sudden pressure spike detected: {value} psi."
            recommendation = "Check pump valves. R001 rule will likely trigger PUMP_OFF."

        elif anomaly_score > 80:
            risk_level = "HIGH"
            explanation = f"High variance from historical baseline (z-score: {z_score:.2f})."
            recommendation = "Investigate parameter trend."
        elif anomaly_score > 60:
            risk_level = "MEDIUM"
            explanation = "Moderate variance detected."

        return self._build_result(parameter, float(anomaly_score), risk_level, explanation, recommendation, 0.90)

    def _build_result(self, param, score, risk, expl, rec, conf):
        return {
            "anomalyScore": round(score, 2),
            "riskLevel": risk,
            "parameter": param,
            "explanation": expl,
            "recommendation": rec,
            "confidence": conf
        }
