import pytest

import database


@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    # Each test gets its own fresh SQLite file - independent of the shared
    # session-wide DB the API tests use - so these unit tests never see
    # rooms/messages left behind by other tests.
    monkeypatch.setattr(database, "DB_PATH", tmp_path / "unit_test.db")
    database.init_db()


def test_seed_default_rooms_creates_three_rooms():
    database.seed_default_rooms(lambda pw: f"hash:{pw}")

    rooms = database.load_rooms()

    assert set(rooms) == {"general", "secret-ops", "crypto-chat"}
    assert rooms["secret-ops"]["is_protected"] is True
    assert rooms["secret-ops"]["password_hash"] == "hash:secret123"
    assert rooms["general"]["is_protected"] is False


def test_seed_default_rooms_is_a_noop_if_rooms_already_exist():
    database.seed_default_rooms(lambda pw: f"hash:{pw}")
    database.save_room("extra-room", {
        "name": "Extra", "description": "", "created_at": "t",
        "created_by": "alice", "password_hash": None, "is_protected": False,
    })

    database.seed_default_rooms(lambda pw: f"hash:{pw}")  # should not reset anything

    assert "extra-room" in database.load_rooms()


def test_save_and_load_room_round_trip():
    room = {
        "name": "Test Room",
        "description": "desc",
        "created_at": "2026-01-01T00:00:00",
        "created_by": "alice",
        "password_hash": None,
        "is_protected": False,
    }
    database.save_room("test-room-db", room)

    assert database.load_rooms()["test-room-db"] == room


def test_delete_room_cascades_its_messages():
    database.save_room("cascade-room", {
        "name": "R", "description": "", "created_at": "t",
        "created_by": "u", "password_hash": None, "is_protected": False,
    })
    database.save_message("cascade-room", {
        "id": "m1", "type": "text", "username": "u", "content": "hi", "timestamp": "t",
    })

    database.delete_room("cascade-room")

    assert "cascade-room" not in database.load_rooms()
    assert database.load_all_messages().get("cascade-room") is None


def test_message_history_trims_to_cap(monkeypatch):
    monkeypatch.setattr(database, "MAX_MESSAGES_PER_ROOM", 3)
    database.save_room("trim-room", {
        "name": "R2", "description": "", "created_at": "t",
        "created_by": "u", "password_hash": None, "is_protected": False,
    })

    for i in range(5):
        database.save_message("trim-room", {
            "id": f"m{i}", "type": "text", "username": "u",
            "content": str(i), "timestamp": f"t{i}",
        })

    history = database.load_all_messages()["trim-room"]

    assert len(history) == 3
    assert [m["content"] for m in history] == ["2", "3", "4"]


def test_image_message_round_trip_preserves_type_specific_fields():
    database.save_room("img-room", {
        "name": "R3", "description": "", "created_at": "t",
        "created_by": "u", "password_hash": None, "is_protected": False,
    })
    database.save_message("img-room", {
        "id": "img1", "type": "image", "username": "u",
        "image_data": "data:image/png;base64,abc123",
        "has_hidden_message": True, "encryption_key": "k",
        "timestamp": "t",
    })

    loaded = database.load_all_messages()["img-room"][0]

    assert loaded["image_data"] == "data:image/png;base64,abc123"
    assert loaded["has_hidden_message"] is True
    assert loaded["encryption_key"] == "k"
    assert "content" not in loaded
