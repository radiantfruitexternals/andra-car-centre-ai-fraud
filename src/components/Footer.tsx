import React from 'react';
import { Car } from 'lucide-react';

export const Footer = () => (
  <footer className="py-20 px-6 border-t border-white/5 bg-background">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
      <div className="text-center md:text-left">
        <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
          <Car className="text-accent w-6 h-6" />
          <span className="text-xl font-bold">Andra <span className="text-accent">AI</span></span>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Securing the future of automotive financing through hybrid artificial intelligence.
        </p>
      </div>
      <div className="flex gap-10 text-sm font-medium">
        <div className="space-y-4">
          <p className="text-accent uppercase text-xs tracking-widest font-bold">Platform</p>
          <a href="#" className="block hover:text-accent transition-colors">Fraud Engine</a>
          <a href="#" className="block hover:text-accent transition-colors">API Docs</a>
        </div>
        <div className="space-y-4">
          <p className="text-accent uppercase text-xs tracking-widest font-bold">Company</p>
          <a href="#" className="block hover:text-accent transition-colors">Privacy</a>
          <a href="#" className="block hover:text-accent transition-colors">Terms</a>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground">
      &copy; {new Date().getFullYear()} Andra Car Centre AI Fraud Prevention System. All rights reserved.
    </div>
  </footer>
);
