import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Eye, EyeOff } from 'lucide-react';

const ImageComparison = ({ originalImage, encodedImageUrl, isVisible }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  if (!isVisible || !originalImage || !encodedImageUrl) {
    return null;
  }

  // Create object URL for original file
  const originalUrl = URL.createObjectURL(originalImage);

  return (
    <div className="card bg-dark-700/50 dark:bg-dark-700/50 light:bg-gray-100/50 border-dark-600 dark:border-dark-600 light:border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary-400" />
          Before & After Comparison
        </h3>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="text-gray-400 hover:text-primary-400 transition-colors p-1"
          title={showLabels ? 'Hide labels' : 'Show labels'}
        >
          {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="text-center text-sm text-gray-400 dark:text-gray-400 light:text-gray-500 mb-3">
        Drag the slider to compare – the images look identical! 🔒
      </div>
      
      {/* Comparison Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Encoded Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={encodedImageUrl}
            alt="Encoded"
            className="w-full h-full object-contain bg-dark-800 dark:bg-dark-800 light:bg-gray-200"
          />
          {showLabels && (
            <div className="absolute bottom-3 right-3 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
              Encoded ✓
            </div>
          )}
        </div>

        {/* Original Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={originalUrl}
            alt="Original"
            className="w-full h-full object-contain bg-dark-800 dark:bg-dark-800 light:bg-gray-200"
          />
          {showLabels && (
            <div className="absolute bottom-3 left-3 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
              Original
            </div>
          )}
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Handle Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary-500">
            <ArrowLeftRight className="w-5 h-5 text-primary-600" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-400 text-center mt-3">
        The encoded image is visually identical to the original – your message is completely hidden!
      </p>
    </div>
  );
};

export default ImageComparison;
