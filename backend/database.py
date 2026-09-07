"""SQLite persistence for chat rooms and message history.

Active WebSocket connections are never persisted (a socket is only ever
meaningful within one running process) - only rooms and their message
history survive a restart.
"""
import os
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# HIDEOUT_DB_PATH lets the test suite point this at a throwaway file instead
# of the real database; unset in normal (dev/prod) operation.
DB_PATH = Path(os.environ["HIDEOUT_DB_PATH"]) if os.environ.get("HIDEOUT_DB_PATH") \
    else Path(__file__).resolve().parent / "hideout.db"

# Keep at most this many messages per room, matching the previous in-memory cap.
MAX_MESSAGES_PER_ROOM = 100


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create tables if they don't exist yet. Safe to call on every startup."""
    conn = _connect()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rooms (
                room_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                created_by TEXT NOT NULL,
                password_hash TEXT,
                is_protected INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                username TEXT,
                content TEXT,
                image_data TEXT,
                has_hidden_message INTEGER,
                encryption_key TEXT,
                timestamp TEXT NOT NULL
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id)")
        conn.commit()
    finally:
        conn.close()


def seed_default_rooms(hash_password_fn) -> None:
    """Insert the built-in demo rooms the very first time the DB is created."""
    conn = _connect()
    try:
        if conn.execute("SELECT 1 FROM rooms LIMIT 1").fetchone():
            return  # Already seeded (or rooms were created by a user) - leave as is

        now = datetime.now().isoformat()
        conn.executemany(
            """INSERT INTO rooms (room_id, name, description, created_at, created_by, password_hash, is_protected)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [
                ("general", "General", "General discussion", now, "system", None, 0),
                ("secret-ops", "Secret Ops", "Top secret communications - Password protected!",
                 now, "system", hash_password_fn("secret123"), 1),
                ("crypto-chat", "Crypto Chat", "Cryptography enthusiasts", now, "system", None, 0),
            ],
        )
        conn.commit()
    finally:
        conn.close()


def _room_row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "name": row["name"],
        "description": row["description"],
        "created_at": row["created_at"],
        "created_by": row["created_by"],
        "password_hash": row["password_hash"],
        "is_protected": bool(row["is_protected"]),
    }


def load_rooms() -> Dict[str, dict]:
    """Load every room into the {room_id: room_dict} shape the app uses in memory."""
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM rooms").fetchall()
        return {row["room_id"]: _room_row_to_dict(row) for row in rows}
    finally:
        conn.close()


def save_room(room_id: str, room: dict) -> None:
    conn = _connect()
    try:
        conn.execute(
            """INSERT INTO rooms (room_id, name, description, created_at, created_by, password_hash, is_protected)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                room_id,
                room["name"],
                room.get("description", ""),
                room["created_at"],
                room["created_by"],
                room.get("password_hash"),
                1 if room.get("is_protected") else 0,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def delete_room(room_id: str) -> None:
    """Delete a room; its messages are removed automatically via ON DELETE CASCADE."""
    conn = _connect()
    try:
        conn.execute("DELETE FROM rooms WHERE room_id = ?", (room_id,))
        conn.commit()
    finally:
        conn.close()


def _message_row_to_dict(row: sqlite3.Row) -> dict:
    message = {
        "type": row["type"],
        "id": row["id"],
        "username": row["username"],
        "timestamp": row["timestamp"],
    }
    if row["type"] == "image":
        message["image_data"] = row["image_data"]
        message["has_hidden_message"] = bool(row["has_hidden_message"])
        message["encryption_key"] = row["encryption_key"]
    else:
        message["content"] = row["content"]
    return message


def load_all_messages() -> Dict[str, List[dict]]:
    """Load message history for every room, oldest first (already capped per room)."""
    conn = _connect()
    try:
        rows = conn.execute("SELECT * FROM messages ORDER BY room_id, rowid ASC").fetchall()
        history: Dict[str, List[dict]] = {}
        for row in rows:
            history.setdefault(row["room_id"], []).append(_message_row_to_dict(row))
        return history
    finally:
        conn.close()


def save_message(room_id: str, message: dict) -> None:
    """Persist one message and trim the room's history back down to the cap."""
    conn = _connect()
    try:
        conn.execute(
            """INSERT INTO messages (id, room_id, type, username, content, image_data,
                                      has_hidden_message, encryption_key, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                message["id"],
                room_id,
                message["type"],
                message.get("username"),
                message.get("content"),
                message.get("image_data"),
                1 if message.get("has_hidden_message") else 0,
                message.get("encryption_key"),
                message["timestamp"],
            ),
        )
        conn.execute(
            """DELETE FROM messages
               WHERE room_id = ? AND rowid NOT IN (
                   SELECT rowid FROM messages WHERE room_id = ? ORDER BY rowid DESC LIMIT ?
               )""",
            (room_id, room_id, MAX_MESSAGES_PER_ROOM),
        )
        conn.commit()
    finally:
        conn.close()
