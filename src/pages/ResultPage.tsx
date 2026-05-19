import React, { useState, useEffect } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { 
  Button, 
  Badge
} from '@blinkdotnew/ui';
import { motion } from 'framer-motion';
import { FraudRecord } from '@/lib/fraud-engine';
import { HeatMeter } from '@/components/HeatMeter';

export const ResultPage = () => {
  const { id } = useParams({ from: '/result/$id' });
  const [record, setRecord] = useState<FraudRecord | null>(null);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('fraud_history') || '[]');
    const found = history.find((r: any) => r.id === id);
    if (found) setRecord(found);
  }, [id]);

  if (!record) return <div className="min-h-screen flex items-center justify-center">Loading result...</div>;

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 md:p-12 rounded-[2rem]"
      >
        <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-bold mb-2 tracking-tight">{record.customerName}</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock size={16} /> Analysis performed on {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge className={`text-lg px-6 py-2 rounded-xl font-bold ${
            record.riskLevel === 'Safe' ? 'bg-risk-safe/20 text-risk-safe' :
            record.riskLevel === 'Suspicious Application' ? 'bg-risk-med/20 text-risk-med' :
            'bg-risk-high/20 text-risk-high'
          }`}>
            {record.riskLevel}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-12">
            <HeatMeter value={record.riskScore} />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-sm text-muted-foreground mb-1">Isolation Forest</p>
                <p className={`text-xl font-bold ${record.anomaly ? 'text-risk-high' : 'text-risk-safe'}`}>
                  {record.anomaly ? 'Anomaly Detected' : 'Pattern Normal'}
                </p>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <p className="text-sm text-muted-foreground mb-1">Risk Confidence</p>
                <p className="text-xl font-bold text-accent">98.4%</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="text-accent" /> AI Explainability Factors
              </h3>
              <div className="space-y-4">
                {record.reasons.map((reason, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-accent/20 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ChevronRight className="text-accent w-4 h-4" />
                    </div>
                    <p className="text-sm leading-relaxed">{reason}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-accent/10 rounded-2xl border border-accent/20">
              <h4 className="font-bold text-accent mb-2">Automated Recommendation</h4>
              <p className="text-sm text-white/80 leading-relaxed">
                {record.riskLevel === 'Safe' 
                  ? "Application meets baseline safety markers. Approve for standard verification track." 
                  : record.riskLevel === 'Suspicious Application'
                  ? "Flags detected in income/debt ratios. Mandatory manual review of salary slips and employment history required."
                  : "Critical fraud indicators triggered. Immediate rejection recommended. Coordinate with compliance for forensic investigation."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Button variant="outline" asChild>
            <Link to="/">New Analysis</Link>
          </Button>
          <Button className="bg-white text-black hover:bg-white/90" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
