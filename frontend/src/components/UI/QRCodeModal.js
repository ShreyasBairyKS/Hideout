import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Key } from 'lucide-react';
import { copyToClipboard } from '../../utils/helpers';
import { showCopyToast, showDownloadToast } from './Toast';

const QRCodeModal = ({ isOpen, onClose, encryptionKey }) => {
  if (!isOpen) return null;

  const handleCopyKey = async () => {
    try {
      await copyToClipboard(encryptionKey);
      showCopyToast('Key copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = 'hideout-key-qr.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      showDownloadToast('QR Code downloaded!');
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-dark-800 dark:bg-dark-800 light:bg-white border border-dark-600 dark:border-dark-600 light:border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6 text-primary-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-100 dark:text-gray-100 light:text-gray-800">
            QR Code for Key
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mt-1">
            Scan this QR code to quickly share the decryption key
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl shadow-inner">
            <QRCodeSVG
              id="qr-code-svg"
              value={encryptionKey}
              size={180}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#1a1a2e"
            />
          </div>
        </div>

        {/* Key Display */}
        <div className="bg-dark-700 dark:bg-dark-700 light:bg-gray-100 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-500 mb-1">Encryption Key:</p>
          <code className="text-sm text-gray-200 dark:text-gray-200 light:text-gray-800 font-mono break-all">
            {encryptionKey}
          </code>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyKey}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy Key
          </button>
          <button
            onClick={handleDownloadQR}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Save QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
