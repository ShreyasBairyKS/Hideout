import React from 'react';
import { Shield, Github } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">Hideout</h1>
              <p className="text-sm text-gray-400">Steganography Messaging</p>
            </div>
          </div>
          
          <nav className="flex items-center space-x-6">
            <a 
              href="/encode" 
              className="text-gray-300 hover:text-primary-400 transition-colors"
            >
              Encode
            </a>
            <a 
              href="/decode" 
              className="text-gray-300 hover:text-primary-400 transition-colors"
            >
              Decode
            </a>
            <a 
              href="/chat" 
              className="text-gray-300 hover:text-primary-400 transition-colors"
            >
              Chat
            </a>
            <a
              href="https://github.com/ShreyasBairyKS/Hideout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;