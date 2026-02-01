import React from 'react';
import { Shield, Github } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../UI/ThemeToggle';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-dark-800 dark:bg-dark-800 light:bg-white border-b border-dark-700 dark:border-dark-700 light:border-gray-200 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">Hideout</h1>
              <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-500">Steganography Messaging</p>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/encode" 
              className={`transition-colors ${
                isActive('/encode') 
                  ? 'text-primary-400 font-semibold' 
                  : 'text-gray-300 dark:text-gray-300 light:text-gray-600 hover:text-primary-400'
              }`}
            >
              Encode
            </Link>
            <Link 
              to="/decode" 
              className={`transition-colors ${
                isActive('/decode') 
                  ? 'text-primary-400 font-semibold' 
                  : 'text-gray-300 dark:text-gray-300 light:text-gray-600 hover:text-primary-400'
              }`}
            >
              Decode
            </Link>
            <Link 
              to="/chat" 
              className={`transition-colors ${
                isActive('/chat') 
                  ? 'text-primary-400 font-semibold' 
                  : 'text-gray-300 dark:text-gray-300 light:text-gray-600 hover:text-primary-400'
              }`}
            >
              Chat
            </Link>
            
            <div className="flex items-center space-x-4 pl-4 border-l border-dark-600 dark:border-dark-600 light:border-gray-300">
              <ThemeToggle />
              <a
                href="https://github.com/ShreyasBairyKS/Hideout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;