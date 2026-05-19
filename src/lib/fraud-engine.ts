export interface FraudRecord {
  id: string;
  customerName: string;
  age: number;
  income: number;
  creditScore: number;
  loanAmount: number;
  existingDebt: number;
  employmentYears: number;
  previousDefaults: number;
  carPrice: number;
  loanDuration: number;
  downPayment: number;
  region: string;
  fraudProb: number;
  anomaly: boolean;
  riskScore: number;
  riskLevel: 'Safe' | 'Suspicious Application' | 'High Risk Fraud';
  reasons: string[];
  createdAt: string;
}

export const analyzeFraud = (data: Partial<FraudRecord>): Omit<FraudRecord, 'id' | 'createdAt'> => {
  const { creditScore = 0, income = 0, existingDebt = 0, previousDefaults = 0, loanAmount = 0 } = data;
  
  // Simulated Logistic Regression Scoring
  let score = 0;
  if (creditScore < 500) score += 40;
  if (creditScore < 400) score += 30;
  if (existingDebt > income * 0.6) score += 25;
  if (previousDefaults > 0) score += 15 * previousDefaults;
  if (loanAmount > income * 2) score += 20;
  
  const fraudProb = Math.min(score / 100, 1);
  const anomaly = (loanAmount > 80000 && income < 40000) || (previousDefaults > 2);
  
  const riskScore = Math.round(fraudProb * 100);
  let riskLevel: FraudRecord['riskLevel'] = 'Safe';
  if (riskScore > 75) riskLevel = 'High Risk Fraud';
  else if (anomaly || riskScore > 40) riskLevel = 'Suspicious Application';

  const reasons: string[] = [];
  if (creditScore < 500) reasons.push("Low Credit Score detected");
  if (existingDebt > income * 0.5) reasons.push("High Debt-to-Income ratio");
  if (previousDefaults > 0) reasons.push(`History of ${previousDefaults} financial default(s)`);
  if (anomaly) reasons.push("Abnormal loan-to-income correlation (Anomaly detected)");
  if (!reasons.length) reasons.push("Normal application patterns observed");

  return {
    customerName: data.customerName || 'Anonymous',
    age: data.age || 0,
    income: data.income || 0,
    creditScore: data.creditScore || 0,
    loanAmount: data.loanAmount || 0,
    existingDebt: data.existingDebt || 0,
    employmentYears: data.employmentYears || 0,
    previousDefaults: data.previousDefaults || 0,
    carPrice: data.carPrice || 0,
    loanDuration: data.loanDuration || 0,
    downPayment: data.downPayment || 0,
    region: data.region || 'Urban',
    fraudProb,
    anomaly,
    riskScore,
    riskLevel,
    reasons
  };
};
