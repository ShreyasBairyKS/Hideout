import React from 'react';
import { Heart, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-800 border-t border-dark-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-5 h-5 text-primary-500" />
            <span className="text-gray-400">
              Built with steganography and encryption
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-400">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>for secure communication</span>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-dark-700 text-center text-sm text-gray-500">
          <p>
            ⚠️ This is a demo application. Do not use for sensitive information. 
            Always verify security in production environments.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;