# Andra Car Centre AI Fraud Detection

Enterprise-grade AI system for detecting car credit fraud using a hybrid engine of Logistic Regression and Isolation Forest.

## Tech Stack
- **Backend:** Flask (Python)
- **ML Models:** Logistic Regression, Isolation Forest
- **Frontend:** Vanilla JS, HTML5, CSS3 (Glassmorphism)
- **Database:** SQLite

## Architecture
1. **Supervised Learning (Logistic Regression):** Trained on historical labels to detect known fraud patterns.
2. **Unsupervised Learning (Isolation Forest):** Detects anomalies and unknown fraud attempts based on feature deviations.
3. **Hybrid Logic:** Combines scores to grade applications as Safe, Suspicious, or High Risk.

## Local Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Train models:
   ```bash
   python model/train.py
   ```
3. Run app:
   ```bash
   flask run
   ```

## Vercel Deployment
This project is pre-configured for Vercel Serverless Functions.
- `api/index.py` is the entry point.
- `vercel.json` handles routing.

## AI Explainability
The system provides clear reason codes (e.g., Low Credit Score, Income Mismatch) to explain the AI's risk assessment, ensuring transparency in credit decisions.
