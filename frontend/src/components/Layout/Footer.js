import React from 'react';
import { Heart, Code, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-800 border-t border-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Secure • Encrypted • Anonymous</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-400 text-sm mt-4 md:mt-0">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>using</span>
            <Code className="w-4 h-4" />
            <span>React & FastAPI</span>
          </div>
        </div>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          © 2025 Hideout. Educational purposes only. Use responsibly.
        </div>
      </div>
    </footer>
  );
};

export default Footer;