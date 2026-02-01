import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-dark-700 dark:bg-dark-700 light:bg-gray-200 
                 border border-dark-600 dark:border-dark-600 light:border-gray-300
                 transition-all duration-300 hover:border-primary-500/50
                 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Toggle Ball */}
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center
                    ${isDark 
                      ? 'left-0.5 bg-dark-500' 
                      : 'left-7 bg-yellow-400'
                    }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-primary-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-yellow-800" />
        )}
      </div>
      
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Sun className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-30 text-gray-500' : 'opacity-0'}`} />
        <Moon className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-0' : 'opacity-30 text-gray-400'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
