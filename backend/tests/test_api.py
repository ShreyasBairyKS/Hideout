import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api import app

client = TestClient(app)


def _delete_room(room_id, username):
    # httpx's TestClient.delete() doesn't accept a form body (`data=`);
    # the DELETE /rooms/{room_id} endpoint needs one to identify the
    # requester, so issue the request directly instead.
    return client.request("DELETE", f"/rooms/{room_id}", data={"username": username})


def _make_test_image_bytes():
    buf = io.BytesIO()
    Image.new("RGB", (100, 100), color=(50, 60, 70)).save(buf, format="PNG")
    buf.seek(0)
    return buf


def test_root_and_health():
    assert client.get("/").status_code == 200
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_default_rooms_are_listed_without_password_hash():
    resp = client.get("/rooms")
    assert resp.status_code == 200
    rooms = resp.json()["rooms"]

    assert "general" in rooms
    assert "secret-ops" in rooms
    assert rooms["secret-ops"]["is_protected"] is True
    assert "password_hash" not in rooms["secret-ops"]


def test_create_room_sanitizes_unsafe_characters():
    # Regression test: room_id used to be `name.lower().replace(" ", "-")`
    # with no further validation, so a name like this could produce an id
    # containing "/" that would break the /ws/{room_id}/{username} route.
    resp = client.post("/rooms", data={"name": "a/b??weird  name", "username": "alice"})
    assert resp.status_code == 200
    room_id = resp.json()["room_id"]
    assert room_id == "abweird-name"

    _delete_room(room_id, "alice")


def test_create_room_rejects_name_that_sanitizes_to_empty():
    resp = client.post("/rooms", data={"name": "???", "username": "alice"})
    assert resp.status_code == 400


def test_create_duplicate_room_fails():
    client.post("/rooms", data={"name": "Dup Room", "username": "alice"})
    resp = client.post("/rooms", data={"name": "Dup Room", "username": "alice"})
    assert resp.status_code == 400
    _delete_room("dup-room", "alice")


def test_protected_room_password_verification():
    client.post("/rooms", data={"name": "Locked Room", "username": "alice", "password": "s3cr3t"})

    ok = client.post("/rooms/locked-room/verify", data={"password": "s3cr3t"})
    assert ok.status_code == 200
    assert ok.json()["valid"] is True

    bad = client.post("/rooms/locked-room/verify", data={"password": "nope"})
    assert bad.status_code == 401

    _delete_room("locked-room", "alice")


def test_only_creator_can_delete_room():
    client.post("/rooms", data={"name": "Owned Room", "username": "alice"})

    forbidden = _delete_room("owned-room", "mallory")
    assert forbidden.status_code == 403

    ok = _delete_room("owned-room", "alice")
    assert ok.status_code == 200


def test_system_room_cannot_be_deleted():
    resp = _delete_room("general", "alice")
    assert resp.status_code == 403


def test_encode_decode_round_trip_over_http():
    encode_resp = client.post(
        "/encode",
        files={"file": ("test.png", _make_test_image_bytes(), "image/png")},
        data={"message": "hello over http", "key": "my-http-password"},
    )
    assert encode_resp.status_code == 200
    body = encode_resp.json()
    assert body["key"] == "my-http-password"  # the password, not a derived key

    download_resp = client.get(f"/download/{body['file_id']}")
    assert download_resp.status_code == 200

    decode_resp = client.post(
        "/decode",
        files={"file": ("encoded.png", io.BytesIO(download_resp.content), "image/png")},
        data={"key": "my-http-password"},
    )
    assert decode_resp.status_code == 200
    assert decode_resp.json()["message"] == "hello over http"


def test_decode_with_wrong_key_returns_clean_error():
    encode_resp = client.post(
        "/encode",
        files={"file": ("test.png", _make_test_image_bytes(), "image/png")},
        data={"message": "another secret", "key": "correct-key"},
    )
    download_resp = client.get(f"/download/{encode_resp.json()['file_id']}")

    decode_resp = client.post(
        "/decode",
        files={"file": ("encoded.png", io.BytesIO(download_resp.content), "image/png")},
        data={"key": "wrong-key"},
    )
    assert decode_resp.status_code == 500
    assert "Decryption failed" in decode_resp.json()["detail"]


def test_websocket_join_and_chat():
    client.post("/rooms", data={"name": "WS Room", "username": "alice"})

    with client.websocket_connect("/ws/ws-room/alice") as ws:
        join_msg = ws.receive_json()
        assert join_msg["type"] == "system"
        assert "alice joined" in join_msg["message"]

        ws.send_json({"type": "text", "content": "hi from test"})
        echoed = ws.receive_json()
        assert echoed["type"] == "text"
        assert echoed["content"] == "hi from test"

    _delete_room("ws-room", "alice")


def test_deleting_room_closes_connected_sockets():
    # Regression test: delete_room used to be a sync `def` calling
    # `asyncio.create_task(ws.close(...))`, which has no running event loop
    # to attach to in that context. The RuntimeError was silently swallowed
    # by a bare `except`, so connected users were dropped from routing but
    # their socket was never actually closed. Now it's `async def` and
    # awaits `ws.close(...)` directly.
    client.post("/rooms", data={"name": "Doomed Room", "username": "alice"})

    with client.websocket_connect("/ws/doomed-room/alice") as ws:
        ws.receive_json()  # join notice

        delete_resp = _delete_room("doomed-room", "alice")
        assert delete_resp.status_code == 200

        # The server closed the socket; a further receive must reflect that
        # instead of hanging or returning as if nothing happened.
        with pytest.raises(Exception):
            ws.receive_json()
