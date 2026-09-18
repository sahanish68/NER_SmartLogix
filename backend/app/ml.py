import numpy as np
from sklearn.ensemble import RandomForestClassifier

# Demonstration model. Replace this training set with validated historical NER data.
X = np.array([
    [10, 20, 5, 100, 1, 1, 1, 0],
    [30, 40, 10, 300, 2, 2, 2, 1],
    [80, 100, 25, 800, 3, 4, 4, 3],
    [140, 180, 35, 1500, 4, 5, 5, 7],
    [200, 250, 40, 1800, 5, 5, 5, 10],
    [50, 70, 15, 500, 2, 3, 2, 2],
    [120, 160, 30, 1200, 4, 4, 3, 6],
    [5, 10, 2, 50, 1, 1, 1, 0],
])
y = np.array([0, 0, 1, 1, 1, 0, 1, 0])

MODEL = RandomForestClassifier(n_estimators=120, random_state=42)
MODEL.fit(X, y)

def predict_risk(features: list[float]) -> dict:
    p = float(MODEL.predict_proba([features])[0][1])
    pct = round(p * 100, 1)
    level = "LOW" if pct < 35 else "MEDIUM" if pct < 65 else "HIGH"
    return {"risk_probability": pct, "risk_level": level}
