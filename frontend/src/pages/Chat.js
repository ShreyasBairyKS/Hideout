import React, { useState, useEffect } from 'react';
import { Shield, Lock, Image, Zap } from 'lucide-react';
import ChatWindow from '../components/Chat/ChatWindow';
import RoomList from '../components/Chat/RoomList';
import UsernameModal from '../components/Chat/UsernameModal';
import CreateRoomModal from '../components/Chat/CreateRoomModal';
import JoinRoomModal from '../components/Chat/JoinRoomModal';
import { fetchRooms, createRoom, verifyRoomPassword, deleteRoom } from '../services/chatService';
import { showSuccessToast, showErrorToast } from '../components/UI/Toast';

const Chat = () => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('hideout-username') || '';
  });
  const [showUsernameModal, setShowUsernameModal] = useState(!username);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(null); // {id, name, isProtected}
  const [rooms, setRooms] = useState({});
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(null); // {id, name, password}

  useEffect(() => {
    // Don't poll the room list while inside a room - it isn't shown there
    if (currentRoom) return;

    loadRooms();

    // Refresh rooms every 30 seconds
    const interval = setInterval(loadRooms, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom]);

  const loadRooms = async () => {
    try {
      const data = await fetchRooms();
      setRooms(data.rooms || {});
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleSetUsername = (newUsername) => {
    setUsername(newUsername);
    localStorage.setItem('hideout-username', newUsername);
    setShowUsernameModal(false);
    showSuccessToast(`Welcome, ${newUsername}!`);
  };

  const handleJoinRoom = (roomId, roomName) => {
    const room = rooms[roomId];
    
    // Check if room is password protected
    if (room?.is_protected) {
      setShowJoinRoomModal({ id: roomId, name: roomName });
    } else {
      // Public room - join directly
      setCurrentRoom({ id: roomId, name: roomName, password: null });
    }
  };

  const handleJoinProtectedRoom = async (password) => {
    if (!showJoinRoomModal) return;
    
    const { id, name } = showJoinRoomModal;
    
    // Verify password before joining
    await verifyRoomPassword(id, password);
    
    // Password is correct - join with password as the decryption key
    setCurrentRoom({ id, name, password });
    setShowJoinRoomModal(null);
    showSuccessToast(`Joined ${name}! Password is your decryption key.`);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    loadRooms(); // Refresh room list
  };

  const handleCreateRoom = async (name, description, password) => {
    try {
      console.log('Creating room:', { name, description, hasPassword: !!password, username });
      const result = await createRoom(name, description, password, username);
      console.log('Room created:', result);
      const message = result.is_protected 
        ? `Protected room "${name}" created! Password is the decryption key.`
        : `Room "${name}" created!`;
      showSuccessToast(message);
      setShowCreateRoomModal(false);
      loadRooms();
    } catch (error) {
      console.error('Room creation error:', error);
      showErrorToast(error.message);
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    try {
      await deleteRoom(roomId, username);
      showSuccessToast(`Room "${roomName}" deleted`);
      loadRooms();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  // Show username modal if no username
  if (showUsernameModal) {
    return <UsernameModal onSubmit={handleSetUsername} />;
  }

  // Show chat window if in a room
  if (currentRoom) {
    return (
      <div className="max-w-4xl mx-auto">
        <ChatWindow
          roomId={currentRoom.id}
          roomName={currentRoom.name}
          username={username}
          roomPassword={currentRoom.password}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  // Show room list
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Secure Chat</h1>
        <p className="text-xl text-gray-300 dark:text-gray-300 light:text-gray-600">
          Real-time messaging with hidden encrypted messages in images
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <span>Logged in as</span>
          <span className="font-semibold text-primary-400">{username}</span>
          <button
            onClick={() => setShowUsernameModal(true)}
            className="text-primary-400 hover:underline"
          >
            (change)
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-primary-500/10 to-transparent border-primary-500/20 text-center p-4">
          <Lock className="w-8 h-8 text-primary-400 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">End-to-End Encrypted</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Messages hidden with AES encryption</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 text-center p-4">
          <Image className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">Image Steganography</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Hide messages inside images</p>
        </div>
        <div className="card bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 text-center p-4">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">Real-time</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">Instant WebSocket messaging</p>
        </div>
      </div>

      {/* Room List */}
      <div className="card">
        <RoomList
          rooms={rooms}
          currentUsername={username}
          onJoinRoom={handleJoinRoom}
          onCreateRoom={() => setShowCreateRoomModal(true)}
          onDeleteRoom={handleDeleteRoom}
          isLoading={isLoadingRooms}
        />
      </div>

      {/* How it works */}
      <div className="card bg-blue-500/5 border-blue-500/20">
        <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          How Secure Chat Works
        </h3>
        <ul className="space-y-2 text-sm text-blue-100/80 dark:text-blue-100/80 light:text-blue-900/80">
          <li>• <strong>Join a room</strong> - Select or create a chat room (some require passwords)</li>
          <li>• <strong>Password = Decryption Key</strong> - For protected rooms, the password is used to decode hidden messages</li>
          <li>• <strong>Send hidden messages</strong> - Click the image icon to send a photo with a secret message embedded</li>
          <li>• <strong>Auto-decode in protected rooms</strong> - If you joined with the password, images are auto-decoded!</li>
          <li>• <strong>Public rooms</strong> - Share encryption keys separately or include them with the image</li>
        </ul>
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <CreateRoomModal
          onSubmit={handleCreateRoom}
          onCancel={() => setShowCreateRoomModal(false)}
        />
      )}

      {/* Join Protected Room Modal */}
      {showJoinRoomModal && (
        <JoinRoomModal
          roomName={showJoinRoomModal.name}
          onSubmit={handleJoinProtectedRoom}
          onCancel={() => setShowJoinRoomModal(null)}
        />
      )}
    </div>
  );
};

export default Chat;