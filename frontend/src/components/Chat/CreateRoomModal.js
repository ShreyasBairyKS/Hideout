import React, { useState } from 'react';
import { Hash, X, Lock, Info } from 'lucide-react';
import Modal from '../UI/Modal';
import PasswordField from '../UI/PasswordField';

const CreateRoomModal = ({ onSubmit, onCancel }) => {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = roomName.trim();

    if (!trimmedName) {
      setError('Please enter a room name');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Room name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Room name must be 30 characters or less');
      return;
    }

    // Password is optional - pass it to parent
    onSubmit(trimmedName, description.trim(), password.trim() || null);
  };

  return (
    <Modal>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800">
            Create Room
          </h2>
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
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">
            Room Name *
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => {
              setRoomName(e.target.value);
              setError('');
            }}
            placeholder="e.g., Project Alpha"
            className="input-field w-full"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this room about?"
            className="input-field w-full h-20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Room Password (optional)
          </label>
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave empty for public room"
          />
          {password && (
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> The room password will be used as the decryption key
                  for all hidden messages. Share the password only with trusted members!
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            Create Room
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoomModal;
