import React, { useState } from 'react';
import { User, ArrowRight, Shield } from 'lucide-react';
import Modal from '../UI/Modal';

const UsernameModal = ({ onSubmit, onCancel }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    onSubmit(trimmedUsername);
  };

  return (
    <Modal>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800">
          Enter Chat
        </h2>
        <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2">
          Choose a username for this session
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter your username..."
              className="input-field w-full pl-10"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        Your username is temporary and only used for this chat session.
      </p>
    </Modal>
  );
};

export default UsernameModal;
