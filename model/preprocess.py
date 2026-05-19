import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

def preprocess_data(df):
    # Handling missing values
    df = df.fillna(df.median(numeric_only=True))
    
    # Label Encoding for Region
    le = LabelEncoder()
    df['Region'] = le.fit_transform(df['Region'])
    
    # Feature Selection (Exclude names/IDs)
    features = ['Age', 'Income', 'CreditScore', 'LoanAmount', 'ExistingDebt', 
                'EmploymentYears', 'PreviousDefaults', 'CarPrice', 
                'LoanDuration', 'DownPayment', 'Region']
    
    X = df[features]
    if 'Fraud' in df.columns:
        y = df['Fraud']
        return X, y
    return X
