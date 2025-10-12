import React, { useState } from 'react';
import { Unlock, Key, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from '../components/UI/FileUpload';
import { SteganographyAPI } from '../services/api';

const Decode = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [decodedMessage, setDecodedMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError('');
    setDecodedMessage('');
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setError('');
    setDecodedMessage('');
  };

  const handleDecode = async () => {
    if (!selectedFile || !decryptionKey.trim()) {
      setError('Please select an encoded image and enter the decryption key');
      return;
    }

    setIsLoading(true);
    setError('');
    setDecodedMessage('');
    
    try {
      const response = await SteganographyAPI.decodeMessage(selectedFile, decryptionKey.trim());
      setDecodedMessage(response.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDecryptionKey('');
    setDecodedMessage('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Decode Message</h1>
        <p className="text-xl text-gray-300">
          Reveal the hidden message from an encoded image
        </p>
      </div>

      {!decodedMessage ? (
        /* Decoding Form */
        <div className="grid lg:grid-cols-2 gap-8">
          {/* File Upload */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</span>
                Upload Encoded Image
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
                  <span className="font-medium">Image uploaded successfully</span>
                </div>
              </div>
            )}
          </div>

          {/* Key Input */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</span>
                Enter Decryption Key
              </h2>
              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    placeholder="Paste your decryption key here..."
                    className="input-field w-full pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-sm text-gray-400">
                  This is the key that was generated when the message was encoded.
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="card bg-red-500/5 border-red-500/20">
                <div className="flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Decoding Failed</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Decode Button */}
            <button
              onClick={handleDecode}
              disabled={!selectedFile || !decryptionKey.trim() || isLoading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Decoding...
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  Decode Message
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
              <MessageSquare className="w-8 h-8 text-green-400" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Message Decoded Successfully!</h2>
              <p className="text-gray-300">Here's the hidden message that was extracted from the image:</p>
            </div>

            {/* Decoded Message Display */}
            <div className="card bg-dark-700">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">Hidden Message</span>
                </div>
                <div className="bg-dark-800 p-4 rounded-lg">
                  <p className="text-gray-200 whitespace-pre-wrap break-words">
                    {decodedMessage}
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Message length: {decodedMessage.length} characters
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center">
              <button
                onClick={resetForm}
                className="btn-secondary"
              >
                Decode Another Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-500/5 border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-3">🔍 Decoding Help</h3>
        <ul className="space-y-2 text-sm text-blue-100/80">
          <li>• Make sure you have the correct decryption key from the sender</li>
          <li>• The image must be an encoded image created by Hideout</li>
          <li>• If decoding fails, verify that the image hasn't been modified or compressed</li>
          <li>• Keys are case-sensitive and must be entered exactly as provided</li>
        </ul>
      </div>
    </div>
  );
};

export default Decode;