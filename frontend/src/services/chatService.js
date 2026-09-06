// WebSocket-based chat service

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws');

class ChatService {
  constructor() {
    this.ws = null;
    this.messageHandlers = [];
    this.connectionHandlers = [];
    this.currentRoom = null;
    this.currentUsername = null;
    this.currentPassword = null;  // Store password for reconnection
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to a chat room (with optional password)
  connect(roomId, username, password = null) {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.disconnect();
      }

      this.currentRoom = roomId;
      this.currentUsername = username;
      this.currentPassword = password;
      
      // Build WebSocket URL with optional password query param
      let wsUrl = `${WS_BASE_URL}/ws/${roomId}/${encodeURIComponent(username)}`;
      if (password) {
        wsUrl += `?password=${encodeURIComponent(password)}`;
      }
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected to room:', roomId);
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers({ type: 'connected', roomId, username });
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessageHandlers(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionHandlers({ type: 'error', error });
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        
        // 4001 = Invalid password, don't reconnect
        if (event.code === 4001) {
          this.notifyConnectionHandlers({ type: 'auth_failed', code: event.code, reason: 'Invalid password' });
          reject(new Error('Invalid password'));
          return;
        }
        
        this.notifyConnectionHandlers({ type: 'disconnected', code: event.code });
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(this.currentRoom, this.currentUsername, this.currentPassword).catch(() => {});
          }, 2000 * this.reconnectAttempts);
        }
      };
    });
  }

  // Disconnect from current room
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    this.currentRoom = null;
    this.currentUsername = null;
  }

  // Send a text message
  sendMessage(content) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    this.ws.send(JSON.stringify({
      type: 'text',
      content
    }));
    return true;
  }

  // Send an encoded image message
  sendImageMessage(imageData, hasHiddenMessage = false, encryptionKey = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    this.ws.send(JSON.stringify({
      type: 'image',
      image_data: imageData,
      has_hidden_message: hasHiddenMessage,
      encryption_key: encryptionKey
    }));
    return true;
  }

  // Send typing indicator
  sendTypingIndicator(isTyping) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'typing',
      is_typing: isTyping
    }));
  }

  // Register message handler
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Register connection handler
  onConnectionChange(handler) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  // Notify all message handlers
  notifyMessageHandlers(data) {
    this.messageHandlers.forEach(handler => handler(data));
  }

  // Notify all connection handlers
  notifyConnectionHandlers(data) {
    this.connectionHandlers.forEach(handler => handler(data));
  }

  // Get connection status
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Fetch available rooms
export const fetchRooms = async () => {
  const response = await fetch(`${API_BASE_URL}/rooms`);
  if (!response.ok) {
    throw new Error('Failed to fetch rooms');
  }
  return response.json();
};

// Verify room password
export const verifyRoomPassword = async (roomId, password) => {
  const formData = new FormData();
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/verify`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Invalid password');
  }
  return response.json();
};

// Create a new room (with optional password)
export const createRoom = async (name, description = '', password = null, username) => {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('username', username);  // Track creator
  if (password) {
    formData.append('password', password);
  }

  console.log('createRoom API call:', { name, description, hasPassword: !!password, username });

  const response = await fetch(`${API_BASE_URL}/rooms`, {
    method: 'POST',
    body: formData
  });
  
  console.log('createRoom response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('createRoom error response:', error);
    throw new Error(error.detail || 'Failed to create room');
  }
  return response.json();
};

// Delete a room (only creator can delete)
export const deleteRoom = async (roomId, username) => {
  const formData = new FormData();
  formData.append('username', username);

  const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
    method: 'DELETE',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete room');
  }
  return response.json();
};

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// Singleton instance
export const chatService = new ChatService();
export default chatService;
