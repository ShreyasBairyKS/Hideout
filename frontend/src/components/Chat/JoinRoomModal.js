import React, { useState } from 'react';
import { Lock, X, Key, Info } from 'lucide-react';
import Modal from '../UI/Modal';
import PasswordField from '../UI/PasswordField';

const JoinRoomModal = ({ roomName, onSubmit, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter the room password');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await onSubmit(password.trim());
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800">
              Protected Room
            </h2>
            <p className="text-sm text-gray-400">{roomName}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Enter Room Password
          </label>
          <PasswordField
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter password to join"
            autoFocus
            disabled={isVerifying}
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
          <p className="text-xs text-primary-300 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              The room password will also be used as the decryption key for all
              hidden messages in images. You'll automatically be able to decode
              secret messages!
            </span>
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isVerifying}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Join Room
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default JoinRoomModal;
