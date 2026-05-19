import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from preprocess import preprocess_data
import os

def train_models():
    # Load dataset
    df = pd.read_csv('../dataset/car_credit.csv')
    
    # Preprocess
    X, y = preprocess_data(df)
    
    # Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
    
    # Model 1: Logistic Regression (Supervised)
    lr_model = LogisticRegression()
    lr_model.fit(X_train, y_train)
    
    # Model 2: Isolation Forest (Unsupervised / Anomaly)
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(X_train)
    
    # Save models and scaler
    joblib.dump(lr_model, '../fraud_model.pkl')
    joblib.dump(iso_forest, '../iso_model.pkl')
    joblib.dump(scaler, '../scaler.pkl')
    
    print("Models and Scaler trained and saved successfully.")

if __name__ == "__main__":
    train_models()
