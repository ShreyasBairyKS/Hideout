from fastapi import FastAPI, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from stego import encode_image, decode_image, generate_key
import database
import os
import re
import uuid
import json
import hashlib
import secrets
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Optional
import base64

app = FastAPI(title="Hideout API", description="Steganography Messaging Platform")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create temp directory for processing images, anchored to this file's location
# so generated images always land in backend/temp_images/ (matching .gitignore)
# regardless of the process's current working directory.
TEMP_DIR = Path(__file__).resolve().parent / "temp_images"
TEMP_DIR.mkdir(exist_ok=True)

# ============= WebSocket Chat System =============

def hash_password(password: str) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256 and a random per-password salt"""
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return f"{salt.hex()}:{derived.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its salted PBKDF2 hash"""
    try:
        salt_hex, derived_hex = hashed.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(derived_hex)
    except (ValueError, AttributeError):
        return False
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return secrets.compare_digest(derived, expected)

class ConnectionManager:
    """Manages WebSocket connections and chat rooms"""
    
    def __init__(self):
        # room_id -> set of (websocket, username) - sockets are process-local,
        # so this (unlike rooms/messages) is never persisted to the database.
        self.active_connections: Dict[str, List[tuple]] = {}

        database.init_db()
        database.seed_default_rooms(hash_password)
        # Rooms and message history are persisted in SQLite (backend/hideout.db);
        # these dicts are just an in-memory cache loaded at startup for fast access.
        self.rooms: Dict[str, dict] = database.load_rooms()
        self.message_history: Dict[str, List[dict]] = database.load_all_messages()
    
    def verify_room_password(self, room_id: str, password: Optional[str]) -> bool:
        """Verify if the provided password is correct for the room"""
        if room_id not in self.rooms:
            return False
        
        room = self.rooms[room_id]
        if not room.get("is_protected", False):
            return True  # Public room, no password needed
        
        if not password:
            return False
        
        return verify_password(password, room.get("password_hash", ""))
    
    async def connect(self, websocket: WebSocket, room_id: str, username: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append((websocket, username))
        
        # Send message history to new user
        if room_id in self.message_history:
            await websocket.send_json({
                "type": "history",
                "messages": self.message_history[room_id][-50:]  # Last 50 messages
            })
        
        # Notify room of new user
        await self.broadcast_to_room(room_id, {
            "type": "system",
            "message": f"{username} joined the room",
            "timestamp": datetime.now().isoformat(),
            "users": self.get_room_users(room_id)
        })
    
    def disconnect(self, websocket: WebSocket, room_id: str, username: str):
        if room_id in self.active_connections:
            self.active_connections[room_id] = [
                (ws, user) for ws, user in self.active_connections[room_id] 
                if ws != websocket
            ]
    
    def get_room_users(self, room_id: str) -> List[str]:
        if room_id not in self.active_connections:
            return []
        return [username for _, username in self.active_connections[room_id]]
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id not in self.active_connections:
            return
        
        # Store in history (except system messages about users)
        if message.get("type") in ["text", "image"]:
            if room_id not in self.message_history:
                self.message_history[room_id] = []
            self.message_history[room_id].append(message)
            # Keep only last 100 messages per room
            if len(self.message_history[room_id]) > 100:
                self.message_history[room_id] = self.message_history[room_id][-100:]
            database.save_message(room_id, message)
        
        disconnected = []
        for websocket, username in self.active_connections[room_id]:
            try:
                await websocket.send_json(message)
            except:
                disconnected.append((websocket, username))
        
        # Clean up disconnected
        for ws, user in disconnected:
            self.disconnect(ws, room_id, user)

manager = ConnectionManager()

@app.get("/rooms")
def get_rooms():
    """Get list of available chat rooms"""
    rooms_with_users = {}
    for room_id, room_info in manager.rooms.items():
        # Don't expose password hash to clients
        rooms_with_users[room_id] = {
            "name": room_info.get("name"),
            "description": room_info.get("description"),
            "created_at": room_info.get("created_at"),
            "created_by": room_info.get("created_by", "system"),
            "is_protected": room_info.get("is_protected", False),
            "user_count": len(manager.get_room_users(room_id)),
            "users": manager.get_room_users(room_id)
        }
    return {"rooms": rooms_with_users}

@app.post("/rooms")
def create_room(
    name: str = Form(...), 
    description: str = Form(""),
    password: Optional[str] = Form(None),
    username: str = Form(...)  # Creator's username
):
    """Create a new chat room (optionally password protected)"""
    # Slugify the name into a URL/path-safe id: lowercase, spaces to hyphens,
    # strip anything that isn't a letter/digit/hyphen so the id can never break
    # the /ws/{room_id}/{username} or /rooms/{room_id} routes.
    room_id = re.sub(r"[^a-z0-9-]", "", name.strip().lower().replace(" ", "-"))
    room_id = re.sub(r"-+", "-", room_id).strip("-")
    if not room_id:
        raise HTTPException(status_code=400, detail="Room name must contain at least one letter or number")
    if room_id in manager.rooms:
        raise HTTPException(status_code=400, detail="Room already exists")
    
    is_protected = bool(password and password.strip())

    room = {
        "name": name,
        "description": description,
        "created_at": datetime.now().isoformat(),
        "created_by": username,  # Track who created the room
        "password_hash": hash_password(password) if is_protected else None,
        "is_protected": is_protected
    }
    database.save_room(room_id, room)
    manager.rooms[room_id] = room
    return {"status": "success", "room_id": room_id, "is_protected": is_protected, "created_by": username}

@app.delete("/rooms/{room_id}")
async def delete_room(room_id: str, username: str = Form(...)):
    """Delete a chat room (only creator can delete)"""
    if room_id not in manager.rooms:
        raise HTTPException(status_code=404, detail="Room not found")

    room = manager.rooms[room_id]

    # Check if user is the creator
    if room.get("created_by") == "system":
        raise HTTPException(status_code=403, detail="System rooms cannot be deleted")

    if room.get("created_by") != username:
        raise HTTPException(status_code=403, detail="Only the room creator can delete this room")

    # Disconnect all users in the room
    if room_id in manager.active_connections:
        for ws, user in manager.active_connections[room_id]:
            try:
                await ws.close(code=4003, reason="Room deleted")
            except Exception:
                pass
        del manager.active_connections[room_id]
    
    # Delete message history
    if room_id in manager.message_history:
        del manager.message_history[room_id]

    # Delete the room (cascades to its messages in the database)
    database.delete_room(room_id)
    del manager.rooms[room_id]
    
    return {"status": "success", "message": f"Room '{room_id}' deleted"}

@app.post("/rooms/{room_id}/verify")
def verify_room_password(room_id: str, password: str = Form(...)):
    """Verify password for a protected room"""
    if room_id not in manager.rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = manager.rooms[room_id]
    if not room.get("is_protected", False):
        return {"valid": True, "message": "Room is not protected"}
    
    if manager.verify_room_password(room_id, password):
        return {"valid": True, "message": "Password correct"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str, 
    username: str,
    password: Optional[str] = Query(None)
):
    if room_id not in manager.rooms:
        await websocket.close(code=4004)
        return
    
    # Verify password for protected rooms
    if not manager.verify_room_password(room_id, password):
        await websocket.close(code=4001, reason="Invalid password")
        return
    
    await manager.connect(websocket, room_id, username)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "text":
                # Regular text message
                message = {
                    "type": "text",
                    "id": str(uuid.uuid4()),
                    "username": username,
                    "content": data.get("content", ""),
                    "timestamp": datetime.now().isoformat()
                }
                await manager.broadcast_to_room(room_id, message)
            
            elif data.get("type") == "image":
                # Encoded image message
                message = {
                    "type": "image",
                    "id": str(uuid.uuid4()),
                    "username": username,
                    "image_data": data.get("image_data"),  # Base64 encoded
                    "has_hidden_message": data.get("has_hidden_message", False),
                    "encryption_key": data.get("encryption_key"),  # Optional - sender can share
                    "timestamp": datetime.now().isoformat()
                }
                await manager.broadcast_to_room(room_id, message)
            
            elif data.get("type") == "typing":
                # Typing indicator
                await manager.broadcast_to_room(room_id, {
                    "type": "typing",
                    "username": username,
                    "is_typing": data.get("is_typing", False)
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, username)
        await manager.broadcast_to_room(room_id, {
            "type": "system",
            "message": f"{username} left the room",
            "timestamp": datetime.now().isoformat(),
            "users": manager.get_room_users(room_id)
        })

# ============= Original API Endpoints =============

@app.get("/")
def root():
    return {"message": "🕵️‍♂️ Hideout backend is running!", "version": "1.0.0"}

@app.post("/encode")
async def encode(
    file: UploadFile, 
    message: str = Form(...),
    key: Optional[str] = Form(None)  # Optional custom key for protected rooms
):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Generate unique filenames
        file_id = str(uuid.uuid4())
        input_path = TEMP_DIR / f"input_{file_id}.png"
        output_path = TEMP_DIR / f"encoded_{file_id}.png"
        
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Use custom key if provided, otherwise generate one
        if key:
            encryption_key = key  # Keep as string, normalize_key will handle it
        else:
            encryption_key = generate_key()
        
        success = encode_image(str(input_path), str(output_path), message, encryption_key)
        
        # Cleanup input file
        input_path.unlink()
        
        if success:
            # Return the original key/password (not the derived Fernet key)
            returned_key = encryption_key.decode() if isinstance(encryption_key, bytes) else encryption_key
            return {
                "status": "success", 
                "key": returned_key, 
                "file_id": file_id,
                "message": "Message successfully hidden in image"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to encode message")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{file_id}")
async def download_encoded_image(file_id: str):
    """Download the encoded image"""
    file_path = TEMP_DIR / f"encoded_{file_id}.png"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        media_type="image/png",
        filename=f"hideout_message_{file_id}.png"
    )

@app.post("/decode")
async def decode(file: UploadFile, key: str = Form(...)):
    try:
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        input_path = TEMP_DIR / f"decode_{file_id}.png"
        
        # Save uploaded file
        with open(input_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Decode message (normalize_key handles string-to-key conversion)
        message = decode_image(str(input_path), key)
        
        # Cleanup
        input_path.unlink()
        
        return {
            "status": "success",
            "message": message,
            "decoded_at": file_id
        }
        
    except Exception as e:
        # Cleanup on error
        if 'input_path' in locals() and input_path.exists():
            input_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to decode: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "hideout-api"}
