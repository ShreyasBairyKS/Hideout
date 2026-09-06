import React, { useState } from 'react';
import { Users, MessageSquare, Plus, Hash, Lock, Trash2, AlertTriangle } from 'lucide-react';
import Modal from '../UI/Modal';

const RoomList = ({ rooms, currentUsername, onJoinRoom, onCreateRoom, onDeleteRoom, isLoading }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {id, name}

  const handleDeleteClick = (e, roomId, roomName) => {
    e.stopPropagation(); // Prevent joining room
    setDeleteConfirm({ id: roomId, name: roomName });
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDeleteRoom(deleteConfirm.id, deleteConfirm.name);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">
          Chat Rooms
        </h3>
        <button
          onClick={onCreateRoom}
          className="btn-secondary text-sm flex items-center gap-1 py-1 px-2"
        >
          <Plus className="w-4 h-4" />
          New Room
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-dark-700 dark:bg-dark-700 light:bg-gray-100 rounded-lg h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(rooms).map(([roomId, room]) => {
            const isCreator = room.created_by === currentUsername;
            const canDelete = isCreator && room.created_by !== 'system';
            
            return (
              <div
                key={roomId}
                className="w-full card bg-dark-700/50 dark:bg-dark-700/50 light:bg-gray-50 hover:bg-dark-600/50 dark:hover:bg-dark-600/50 light:hover:bg-gray-100 transition-colors text-left p-4 cursor-pointer"
                onClick={() => onJoinRoom(roomId, room.name)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    room.is_protected 
                      ? 'bg-yellow-500/20' 
                      : 'bg-primary-500/20'
                  }`}>
                    {room.is_protected 
                      ? <Lock className="w-5 h-5 text-yellow-400" />
                      : <Hash className="w-5 h-5 text-primary-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">
                        {room.name}
                      </h4>
                      {room.is_protected && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                          Protected
                        </span>
                      )}
                      {isCreator && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          Your Room
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-500 truncate">
                      {room.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {room.user_count || 0} online
                      </span>
                      {room.users && room.users.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {room.users.slice(0, 3).join(', ')}
                          {room.users.length > 3 && ` +${room.users.length - 3}`}
                        </span>
                      )}
                      {room.is_protected && (
                        <span className="text-yellow-400/70 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Password = Decrypt Key
                        </span>
                      )}
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteClick(e, roomId, room.name)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && Object.keys(rooms).length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No rooms available</p>
          <p className="text-sm">Create one to get started!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <Modal maxWidthClass="max-w-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">
              Delete Room?
            </h3>
          </div>
          <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-6">
            Are you sure you want to delete <strong className="text-gray-200 dark:text-gray-200 light:text-gray-800">"{deleteConfirm.name}"</strong>?
            This will disconnect all users and delete all messages. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RoomList;
