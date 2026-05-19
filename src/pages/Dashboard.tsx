import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { 
  ShieldAlert, 
  TrendingUp,
  Activity,
  AlertCircle,
  History,
  ChevronRight
} from 'lucide-react';
import { 
  Button, 
  Card, 
  Badge, 
  StatGroup, 
  Stat, 
  DataTable, 
  AreaChart
} from '@blinkdotnew/ui';
import { FraudRecord } from '@/lib/fraud-engine';
import { HeatMeter } from '@/components/HeatMeter';

export const Dashboard = () => {
  const [history, setHistory] = useState<FraudRecord[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('fraud_history') || '[]');
    setHistory(data);
  }, []);

  const stats = {
    total: history.length,
    high: history.filter(h => h.riskLevel === 'High Risk Fraud').length,
    med: history.filter(h => h.riskLevel === 'Suspicious Application').length,
    safe: history.filter(h => h.riskLevel === 'Safe').length,
    avgRisk: Math.round(history.reduce((acc, h) => acc + h.riskScore, 0) / (history.length || 1))
  };

  const chartData = history.slice(0, 7).reverse().map(h => ({
    name: h.customerName.split(' ')[0],
    score: h.riskScore
  }));

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Fraud Control Center</h1>
          <p className="text-muted-foreground">Monitoring enterprise credit risk patterns in real-time.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <TrendingUp className="mr-2 w-4 h-4" /> Export Report
        </Button>
      </div>

      <StatGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Stat label="Total Volume" value={stats.total.toString()} icon={<Activity className="text-accent" />} />
        <Stat label="High Risk Detection" value={stats.high.toString()} trend={15} trendLabel="vs last week" icon={<ShieldAlert className="text-risk-high" />} />
        <Stat label="Alert Queue" value={stats.med.toString()} icon={<AlertCircle className="text-risk-med" />} />
        <Stat label="Avg. Fraud Probability" value={`${stats.avgRisk}%`} icon={<TrendingUp className="text-risk-safe" />} />
      </StatGroup>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <Card className="lg:col-span-2 p-8 glass-panel border-0 rounded-3xl">
          <h3 className="text-xl font-bold mb-8">Risk Score Trends (Last 7 Apps)</h3>
          <div className="h-[300px] w-full">
            <AreaChart 
              data={chartData} 
              dataKey="score" 
              xAxisKey="name"
              height={300}
            />
          </div>
        </Card>
        <Card className="p-8 glass-panel border-0 rounded-3xl flex flex-col justify-center items-center">
          <HeatMeter value={stats.avgRisk} />
          <p className="mt-4 text-center text-sm text-muted-foreground">Portfolio Aggregate Risk Index</p>
        </Card>
      </div>

      <Card className="glass-panel border-0 rounded-3xl p-8">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <History size={20} className="text-accent" /> Investigation History
        </h3>
        <DataTable 
          data={history}
          columns={[
            { 
              accessorKey: 'customerName', 
              header: 'Applicant',
              cell: ({ row }) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">
                    {row.original.customerName[0]}
                  </div>
                  <div>
                    <p className="font-bold">{row.original.customerName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )
            },
            { 
              accessorKey: 'loanAmount', 
              header: 'Loan Value',
              cell: ({ row }) => <span className="font-mono text-accent">${row.original.loanAmount.toLocaleString()}</span>
            },
            { 
              accessorKey: 'riskScore', 
              header: 'AI Score',
              cell: ({ row }) => (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    row.original.riskScore < 40 ? 'bg-risk-safe' :
                    row.original.riskScore < 75 ? 'bg-risk-med' : 'bg-risk-high'
                  }`} />
                  {row.original.riskScore}%
                </div>
              )
            },
            { 
              accessorKey: 'riskLevel', 
              header: 'Category',
              cell: ({ row }) => (
                <Badge className={`rounded-lg ${
                  row.original.riskLevel === 'Safe' ? 'bg-risk-safe/10 text-risk-safe' :
                  row.original.riskLevel === 'Suspicious Application' ? 'bg-risk-med/10 text-risk-med' :
                  'bg-risk-high/10 text-risk-high'
                }`}>
                  {row.original.riskLevel}
                </Badge>
              )
            },
            {
              id: 'actions',
              header: '',
              cell: ({ row }) => (
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/result/$id" params={{ id: row.original.id }}>Details <ChevronRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};
