from flask import Flask, render_template, request, jsonify, redirect, url_for
import pandas as pd
import numpy as np
import pickle
import os
import sqlite3
from datetime import datetime

app = Flask(__name__)

# Model Loading Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, '..')

def load_model(filename):
    path = os.path.join(MODEL_DIR, filename)
    with open(path, 'rb') as f:
        return pickle.load(f)

# Load Models Safely
try:
    fraud_model = load_model('fraud_model.pkl')
    iso_model = load_model('iso_model.pkl')
    scaler = load_model('scaler.pkl')
except Exception as e:
    print(f"Model Loading Error: {e}")

# Database Helper
DB_PATH = os.path.join(BASE_DIR, '..', 'database', 'fraud_logs.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS fraud_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        fraud_probability REAL,
        isolation_result INTEGER,
        risk_score INTEGER,
        risk_level TEXT,
        reason TEXT,
        loan_amount REAL,
        created_at TIMESTAMP
    )''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.form.to_dict()
        
        # Preprocessing for prediction
        features = [
            float(data['age']),
            float(data['income']),
            float(data['credit_score']),
            float(data['loan_amount']),
            float(data['existing_debt']),
            float(data['employment_years']),
            float(data['previous_defaults']),
            float(data['car_price']),
            float(data['loan_duration']),
            float(data['down_payment']),
            1 if data['region'] == 'Urban' else 0 # Simple encoding
        ]
        
        X = np.array([features])
        X_scaled = scaler.transform(X)
        
        # Hybrid Scoring Logic
        fraud_prob = fraud_model.predict_proba(X_scaled)[0][1]
        anomaly = iso_model.predict(X_scaled)[0]
        
        # Risk Categorization
        risk_score = int(fraud_prob * 100)
        risk_level = "Safe"
        if risk_score > 75:
            risk_level = "High Risk Fraud"
        elif anomaly == -1 or risk_score > 40:
            risk_level = "Suspicious Application"
            
        # Explainability
        reasons = []
        if float(data['credit_score']) < 500:
            reasons.append("Low Credit Score detected")
        if float(data['existing_debt']) > float(data['income']) * 0.5:
            reasons.append("Debt-to-Income ratio exceeds safety limits")
        if float(data['previous_defaults']) > 0:
            reasons.append("History of financial defaults")
        if anomaly == -1:
            reasons.append("Unusual application pattern (Anomaly)")
            
        if not reasons:
            reasons.append("Application patterns appear typical for credit profile")

        # Save to DB
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO fraud_logs (customer_name, fraud_probability, isolation_result, risk_score, risk_level, reason, loan_amount, created_at) VALUES (?,?,?,?,?,?,?,?)",
                  (data['customer_name'], fraud_prob, int(anomaly), risk_score, risk_level, ", ".join(reasons), float(data['loan_amount']), datetime.now()))
        conn.commit()
        conn.close()

        return render_template('result.html', 
                             name=data['customer_name'],
                             prob=risk_score,
                             anomaly="Detected" if anomaly == -1 else "Normal",
                             risk_score=risk_score,
                             risk_level=risk_level,
                             reasons=reasons)
    except Exception as e:
        return render_template('error.html', error=str(e))

@app.route('/dashboard')
def dashboard():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM fraud_logs ORDER BY created_at DESC", conn)
    conn.close()
    
    stats = {
        'total': len(df),
        'fraud': len(df[df['risk_level'] == 'High Risk Fraud']),
        'suspicious': len(df[df['risk_level'] == 'Suspicious Application']),
        'safe': len(df[df['risk_level'] == 'Safe']),
        'history': df.to_dict('records')
    }
    return render_template('dashboard.html', stats=stats)

# Vercel entry point doesn't need app.run()
