import React, { useState } from 'react';
import { Lock, Download, Copy, Key, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from '../components/UI/FileUpload';
import { SteganographyAPI } from '../services/api';
import { downloadBlob, copyToClipboard, generateFilename } from '../utils/helpers';

const Encode = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError('');
    setResult(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setError('');
    setResult(null);
  };

  const handleEncode = async () => {
    if (!selectedFile || !message.trim()) {
      setError('Please select an image and enter a message');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await SteganographyAPI.encodeMessage(selectedFile, message.trim());
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.file_id) return;
    
    try {
      const blob = await SteganographyAPI.downloadEncodedImage(result.file_id);
      const filename = generateFilename('hideout_encoded', 'png');
      downloadBlob(blob, filename);
    } catch (err) {
      setError('Failed to download image: ' + err.message);
    }
  };

  const handleCopyKey = async () => {
    if (!result?.key) return;
    
    try {
      await copyToClipboard(result.key);
      // You could add a toast notification here
    } catch (err) {
      setError('Failed to copy key to clipboard');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setMessage('');
    setResult(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Encode Message</h1>
        <p className="text-xl text-gray-300">
          Hide your secret message inside an image with military-grade encryption
        </p>
      </div>

      {!result ? (
        /* Encoding Form */
        <div className="grid lg:grid-cols-2 gap-8">
          {/* File Upload */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                Choose Cover Image
              </h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                selectedFile={selectedFile}
                disabled={isLoading}
              />
            </div>
            
            {selectedFile && (
              <div className="card bg-green-500/5 border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Image selected successfully</span>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                Enter Secret Message
              </h2>
              <div className="space-y-4">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your secret message here..."
                  className="input-field w-full h-32 resize-none"
                  disabled={isLoading}
                  maxLength={1000}
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{message.length}/1000 characters</span>
                  {selectedFile && (
                    <span>Image can hold approximately 500+ characters</span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="card bg-red-500/5 border-red-500/20">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Encode Button */}
            <button
              onClick={handleEncode}
              disabled={!selectedFile || !message.trim() || isLoading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Encoding...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Encode Message
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Success Result */
        <div className="card bg-green-500/5 border-green-500/20">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Message Encoded Successfully!</h2>
              <p className="text-gray-300">Your secret message has been hidden in the image.</p>
            </div>

            {/* Key Display */}
            <div className="card bg-dark-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Key className="w-5 h-5" />
                  <span className="font-semibold">Decryption Key</span>
                </div>
                <p className="text-xs text-gray-400">
                  Save this key securely. You'll need it to decode the message.
                </p>
                <div className="flex items-center gap-2 bg-dark-800 p-3 rounded-lg">
                  <code className="flex-1 text-sm font-mono text-gray-200 break-all">
                    {result.key}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Encoded Image
              </button>
              <button
                onClick={resetForm}
                className="btn-secondary"
              >
                Encode Another Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-500/5 border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-3">💡 Pro Tips</h3>
        <ul className="space-y-2 text-sm text-blue-100/80">
          <li>• Larger images can hold longer messages</li>
          <li>• The encoded image will look identical to the original</li>
          <li>• Keep your decryption key safe - it's impossible to recover without it</li>
          <li>• Share the encoded image and key through different channels for maximum security</li>
        </ul>
      </div>
    </div>
  );
};

export default Encode;