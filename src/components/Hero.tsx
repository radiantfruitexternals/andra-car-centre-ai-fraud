import React from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';
import { motion } from 'framer-motion';

export const Hero = () => (
  <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,209,255,0.08)_0%,transparent_70%)]" />
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10"
    >
      <Badge variant="outline" className="mb-6 border-accent/30 text-accent bg-accent/5 py-1 px-4">
        v2.4 Hybrid Fraud Engine
      </Badge>
      <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text leading-tight">
        Precision Fraud Detection <br /> for Auto Finance
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
        Empower your credit team with AI that combines Logistic Regression and Isolation Forest to catch both known patterns and emerging anomalies.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90" asChild>
          <a href="#analyze">Analyze Application <ArrowRight className="ml-2 w-5 h-5" /></a>
        </Button>
        <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white/10 hover:bg-white/5" asChild>
          <Link to="/dashboard">View Analytics</Link>
        </Button>
      </div>
    </motion.div>
  </section>
);
