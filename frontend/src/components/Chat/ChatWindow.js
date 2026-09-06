import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Lock, Unlock, X, Loader2 } from 'lucide-react';
import { chatService, fileToBase64 } from '../../services/chatService';
import { SteganographyAPI } from '../../services/api';
import { showSuccessToast, showErrorToast } from '../UI/Toast';
import Modal from '../UI/Modal';

const ChatWindow = ({ roomId, roomName, username, roomPassword, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [secretMessage, setSecretMessage] = useState('');
  const [isEncoding, setIsEncoding] = useState(false);
  const [decodeModal, setDecodeModal] = useState({ show: false, imageData: null, key: '', decodedMessage: '', showResult: false });
  const [isDecoding, setIsDecoding] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Is this a password-protected room?
  const isProtectedRoom = !!roomPassword;

  useEffect(() => {
    // Connect to room (with password if protected)
    chatService.connect(roomId, username, roomPassword)
      .then(() => setIsConnected(true))
      .catch((error) => {
        showErrorToast('Failed to connect to chat room');
        console.error(error);
      });

    // Handle incoming messages
    const unsubMessage = chatService.onMessage((data) => {
      if (data.type === 'history') {
        setMessages(data.messages || []);
      } else if (data.type === 'text' || data.type === 'image') {
        setMessages(prev => [...prev, data]);
      } else if (data.type === 'system') {
        setMessages(prev => [...prev, data]);
        if (data.users) {
          setUsers(data.users);
        }
      } else if (data.type === 'typing') {
        if (data.is_typing && data.username !== username) {
          setTypingUsers(prev => [...new Set([...prev, data.username])]);
        } else {
          setTypingUsers(prev => prev.filter(u => u !== data.username));
        }
      }
    });

    // Handle connection changes
    const unsubConnection = chatService.onConnectionChange((data) => {
      if (data.type === 'connected') {
        setIsConnected(true);
        const msg = isProtectedRoom 
          ? `Connected to ${roomName} (protected - auto-decode enabled)`
          : `Connected to ${roomName}`;
        showSuccessToast(msg);
      } else if (data.type === 'disconnected') {
        setIsConnected(false);
      } else if (data.type === 'auth_failed') {
        showErrorToast('Invalid password');
        onLeave();
      }
    });

    return () => {
      unsubMessage();
      unsubConnection();
      chatService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username, roomName, roomPassword]);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;

    chatService.sendMessage(inputMessage.trim());
    setInputMessage('');
    chatService.sendTypingIndicator(false);
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    
    // Send typing indicator
    chatService.sendTypingIndicator(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      chatService.sendTypingIndicator(false);
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setShowImageModal(true);
    }
  };

  const handleSendImage = async (withHiddenMessage = false) => {
    if (!selectedImage) return;
    
    setIsEncoding(true);
    
    try {
      let imageData;
      let encryptionKey = null;
      
      if (withHiddenMessage && secretMessage.trim()) {
        // For protected rooms, use room password as the encryption key
        // For public rooms, a random key is generated
        const customKey = isProtectedRoom ? roomPassword : null;

        // Encode message into image (pass custom key if in protected room)
        const response = await SteganographyAPI.encodeMessage(
          selectedImage,
          secretMessage.trim(),
          customKey
        );
        encryptionKey = response.key;

        // Download the encoded image and convert to base64
        const blob = await SteganographyAPI.downloadEncodedImage(response.file_id);
        imageData = await fileToBase64(blob);
        
        const msg = isProtectedRoom 
          ? 'Message hidden using room password!'
          : 'Message hidden in image!';
        showSuccessToast(msg);
      } else {
        // Just send the original image
        imageData = await fileToBase64(selectedImage);
      }
      
      // For protected rooms, don't include the key in message (everyone has it)
      const shareKey = isProtectedRoom ? null : encryptionKey;

      chatService.sendImageMessage(imageData, withHiddenMessage, shareKey);
      
      setShowImageModal(false);
      setSelectedImage(null);
      setSecretMessage('');
    } catch (error) {
      console.error('Send image error:', error);
      showErrorToast('Failed to send image: ' + error.message);
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecodeImage = async (imageData, providedKey = null) => {
    // Determine which key to use
    const decryptKey = providedKey || (isProtectedRoom ? roomPassword : null);

    if (!decryptKey) {
      // No key available - show modal to enter key manually
      setDecodeModal({ show: true, imageData, key: '', decodedMessage: '', showResult: false });
      return;
    }
    
    // We have a key - decode directly
    setIsDecoding(true);
    try {
      // Convert base64 data URL to blob
      let blob;
      if (imageData.startsWith('data:')) {
        // It's a data URL - convert to blob
        const base64Response = await fetch(imageData);
        blob = await base64Response.blob();
      } else {
        // It's a regular URL
        const response = await fetch(imageData);
        blob = await response.blob();
      }
      
      const file = new File([blob], 'image.png', { type: 'image/png' });

      const result = await SteganographyAPI.decodeMessage(file, decryptKey);
      
      // Show decoded message in a more visible way
      setDecodeModal({ 
        show: true, 
        imageData: null, 
        key: '', 
        decodedMessage: result.message,
        showResult: true 
      });
      showSuccessToast('🔓 Message revealed!');
    } catch (error) {
      console.error('Decode error:', error);
      showErrorToast('Could not decode: ' + error.message);
    } finally {
      setIsDecoding(false);
    }
  };

  const performDecode = async () => {
    if (!decodeModal.key.trim()) {
      showErrorToast('Please enter the decryption key');
      return;
    }
    
    setIsDecoding(true);
    
    try {
      // Convert base64 data URL to blob
      let blob;
      if (decodeModal.imageData.startsWith('data:')) {
        const base64Response = await fetch(decodeModal.imageData);
        blob = await base64Response.blob();
      } else {
        const response = await fetch(decodeModal.imageData);
        blob = await response.blob();
      }
      
      const file = new File([blob], 'image.png', { type: 'image/png' });

      const result = await SteganographyAPI.decodeMessage(file, decodeModal.key.trim());
      
      // Show decoded message in modal
      setDecodeModal({ 
        show: true, 
        imageData: null, 
        key: '', 
        decodedMessage: result.message,
        showResult: true 
      });
      showSuccessToast('🔓 Message revealed!');
    } catch (error) {
      console.error('Manual decode error:', error); // Debug log
      showErrorToast('Failed to decode: ' + error.message);
    } finally {
      setIsDecoding(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[600px] card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-600 dark:border-dark-600 light:border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800">{roomName}</h3>
            {isProtectedRoom && (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Protected
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {users.length} {users.length === 1 ? 'user' : 'users'} online
            {!isConnected && ' • Disconnected'}
            {isProtectedRoom && ' • Auto-decode enabled'}
          </p>
        </div>
        <button
          onClick={onLeave}
          className="text-gray-400 hover:text-red-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            message={msg}
            isOwnMessage={msg.username === username}
            onDecode={handleDecodeImage}
            onCopyKey={(key) => {
              navigator.clipboard.writeText(key);
              showSuccessToast('Key copied!');
            }}
            formatTime={formatTime}
            isProtectedRoom={isProtectedRoom}
            isDecoding={isDecoding}
          />
        ))}
        
        {typingUsers.length > 0 && (
          <div className="text-sm text-gray-400 italic">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-600 dark:border-dark-600 light:border-gray-200">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-primary-400 transition-colors"
            title="Send image"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 input-field"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="btn-primary p-2 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Image Upload Modal */}
      {showImageModal && (
        <Modal>
          <h3 className="text-xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-4">
            Send Image
          </h3>

          {selectedImage && (
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="Preview"
              className="w-full h-48 object-contain bg-dark-700 rounded-lg mb-4"
            />
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2 block">
                Hide a secret message? (optional)
              </label>
              <textarea
                value={secretMessage}
                onChange={(e) => setSecretMessage(e.target.value)}
                placeholder="Enter a secret message to hide..."
                className="input-field w-full h-20 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImage(null);
                  setSecretMessage('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendImage(!!secretMessage.trim())}
                disabled={isEncoding}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isEncoding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Encoding...
                  </>
                ) : secretMessage.trim() ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Send with Secret
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Image
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Decode Modal */}
      {decodeModal.show && (
        <Modal>
          <h3 className="text-xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-4">
            {decodeModal.showResult ? '🔓 Hidden Message Revealed!' : 'Decode Hidden Message'}
          </h3>

          <div className="space-y-4">
            {decodeModal.showResult ? (
              /* Show decoded message */
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-400 mb-2 font-semibold">Decoded Message:</p>
                <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 break-words whitespace-pre-wrap">
                  {decodeModal.decodedMessage}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(decodeModal.decodedMessage);
                    showSuccessToast('Message copied!');
                  }}
                  className="mt-3 text-xs text-primary-400 hover:text-primary-300 underline"
                >
                  Copy Message
                </button>
              </div>
            ) : (
              /* Show key input for decoding */
              <input
                type="text"
                value={decodeModal.key}
                onChange={(e) => setDecodeModal(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Enter decryption key..."
                className="input-field w-full"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDecodeModal({ show: false, imageData: null, key: '', decodedMessage: '', showResult: false })}
                className="btn-secondary flex-1"
              >
                {decodeModal.showResult ? 'Close' : 'Cancel'}
              </button>
              {!decodeModal.showResult && (
                <button
                  onClick={performDecode}
                  disabled={isDecoding}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {isDecoding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  Decode
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwnMessage, onDecode, onCopyKey, formatTime, isProtectedRoom, isDecoding }) => {
  if (message.type === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-dark-700/50 dark:bg-dark-700/50 light:bg-gray-100 px-3 py-1 rounded-full">
          {message.message}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-xl p-3 ${
          isOwnMessage
            ? 'bg-primary-600 text-white'
            : 'bg-dark-700 dark:bg-dark-700 light:bg-gray-100 text-gray-200 dark:text-gray-200 light:text-gray-800'
        }`}
      >
        {!isOwnMessage && (
          <p className="text-xs font-semibold text-primary-400 mb-1">{message.username}</p>
        )}
        
        {message.type === 'image' ? (
          <div className="space-y-2">
            <img
              src={message.image_data}
              alt="Shared"
              className="rounded-lg max-h-64 w-full object-contain cursor-pointer"
              onClick={() => window.open(message.image_data, '_blank')}
            />
            {message.has_hidden_message && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Contains hidden message
                  </span>
                  {isProtectedRoom ? (
                    <button
                      onClick={() => {
                        console.log('Protected room decode - using room password');
                        onDecode(message.image_data, null);
                      }}
                      disabled={isDecoding}
                      className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isDecoding ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      {isDecoding ? 'Decoding...' : 'Click to Reveal'}
                    </button>
                  ) : message.encryption_key ? (
                    <button
                      onClick={() => {
                        console.log('Public room decode - using attached key:', message.encryption_key);
                        onDecode(message.image_data, message.encryption_key);
                      }}
                      disabled={isDecoding}
                      className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isDecoding ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                      {isDecoding ? 'Decoding...' : 'Reveal Message'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('No key attached - opening manual entry modal');
                        onDecode(message.image_data, null);
                      }}
                      className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/30 transition-colors flex items-center gap-1"
                    >
                      <Unlock className="w-3 h-3" />
                      Enter Key to Decode
                    </button>
                  )}
                </div>
                {/* Show full encryption key for public rooms */}
                {!isProtectedRoom && message.encryption_key && (
                  <div className="bg-dark-800/50 dark:bg-dark-800/50 light:bg-gray-200/50 p-2 rounded text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-yellow-400 font-medium">🔑 Key:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyKey(message.encryption_key);
                        }}
                        className="text-primary-400 hover:text-primary-300 text-xs underline"
                      >
                        Copy Key
                      </button>
                    </div>
                    <code className="text-gray-300 dark:text-gray-300 light:text-gray-700 break-all block mt-1 font-mono text-[10px]">
                      {message.encryption_key}
                    </code>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="break-words">{message.content}</p>
        )}
        
        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/60' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;
