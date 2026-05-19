import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Car } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-md border-b' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Car className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Andra <span className="text-accent">AI</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium hover:text-accent transition-colors">Home</Link>
          <Link to="/dashboard" className="text-sm font-medium hover:text-accent transition-colors">Dashboard</Link>
          <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">Enterprise Login</Button>
        </div>
      </div>
    </nav>
  );
};
