import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';
import { 
  Button, 
  Input, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
  toast 
} from '@blinkdotnew/ui';
import { analyzeFraud } from '@/lib/fraud-engine';

export const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    age: 25,
    income: 50000,
    creditScore: 700,
    loanAmount: 20000,
    existingDebt: 5000,
    employmentYears: 5,
    previousDefaults: 0,
    carPrice: 25000,
    loanDuration: 60,
    downPayment: 5000,
    region: 'Urban'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      const result = analyzeFraud(formData);
      const newRecord = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      
      const history = JSON.parse(localStorage.getItem('fraud_history') || '[]');
      localStorage.setItem('fraud_history', JSON.stringify([newRecord, ...history]));
      
      setLoading(false);
      navigate({ to: '/result/$id', params: { id: newRecord.id } });
      toast.success('Analysis Complete');
    }, 1500);
  };

  return (
    <section id="analyze" className="py-24 px-6 max-w-5xl mx-auto">
      <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={120} />
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Credit Application Data</h2>
        <p className="text-muted-foreground mb-10">Enter customer details for instant AI risk grading.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">Customer Full Name</label>
            <Input 
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              placeholder="e.g. Johnathan Smith"
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Age</label>
            <Input 
              type="number"
              value={formData.age}
              onChange={e => setFormData({...formData, age: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Annual Income ($)</label>
            <Input 
              type="number"
              value={formData.income}
              onChange={e => setFormData({...formData, income: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Credit Score</label>
            <Input 
              type="number"
              value={formData.creditScore}
              onChange={e => setFormData({...formData, creditScore: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Loan Amount Request ($)</label>
            <Input 
              type="number"
              value={formData.loanAmount}
              onChange={e => setFormData({...formData, loanAmount: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Existing Total Debt ($)</label>
            <Input 
              type="number"
              value={formData.existingDebt}
              onChange={e => setFormData({...formData, existingDebt: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Years in Employment</label>
            <Input 
              type="number"
              value={formData.employmentYears}
              onChange={e => setFormData({...formData, employmentYears: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Previous Defaults</label>
            <Input 
              type="number"
              value={formData.previousDefaults}
              onChange={e => setFormData({...formData, previousDefaults: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Vehicle Price ($)</label>
            <Input 
              type="number"
              value={formData.carPrice}
              onChange={e => setFormData({...formData, carPrice: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Loan Duration</label>
            <Select value={formData.loanDuration.toString()} onValueChange={v => setFormData({...formData, loanDuration: Number(v)})}>
              <SelectTrigger className="bg-background/50 border-white/10 h-12">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
                <SelectItem value="48">48 Months</SelectItem>
                <SelectItem value="60">60 Months</SelectItem>
                <SelectItem value="72">72 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Down Payment ($)</label>
            <Input 
              type="number"
              value={formData.downPayment}
              onChange={e => setFormData({...formData, downPayment: Number(e.target.value)})}
              required 
              className="bg-background/50 border-white/10 h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Region</label>
            <Select value={formData.region} onValueChange={v => setFormData({...formData, region: v})}>
              <SelectTrigger className="bg-background/50 border-white/10 h-12">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urban">Urban</SelectItem>
                <SelectItem value="Rural">Rural</SelectItem>
                <SelectItem value="Semi-Urban">Semi-Urban</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 mt-8">
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-accent text-black hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Running AI Models...
                </span>
              ) : (
                "Execute Fraud Risk Analysis"
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};
