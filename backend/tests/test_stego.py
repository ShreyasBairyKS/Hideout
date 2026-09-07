import pytest
from PIL import Image

import stego


@pytest.fixture
def sample_image(tmp_path):
    path = tmp_path / "sample.png"
    Image.new("RGB", (60, 60), color=(120, 130, 140)).save(path)
    return path


def test_encode_decode_round_trip(tmp_path, sample_image):
    output = tmp_path / "encoded.png"
    key = stego.generate_key()

    assert stego.encode_image(str(sample_image), str(output), "hello secret", key) is True
    assert stego.decode_image(str(output), key) == "hello secret"


def test_encode_decode_with_password_instead_of_fernet_key(tmp_path, sample_image):
    output = tmp_path / "encoded.png"

    assert stego.encode_image(str(sample_image), str(output), "hi there", "my-password") is True
    assert stego.decode_image(str(output), "my-password") == "hi there"


def test_decode_with_wrong_key_fails_cleanly(tmp_path, sample_image):
    output = tmp_path / "encoded.png"
    stego.encode_image(str(sample_image), str(output), "hello secret", stego.generate_key())

    with pytest.raises(ValueError, match="Decryption failed"):
        stego.decode_image(str(output), stego.generate_key())


def test_decode_plain_image_raises_clear_error(sample_image):
    # Regression test: decode_image used to check
    # `if "=====" not in decoded_data + "=====":`, which is always False
    # (the appended marker makes the substring trivially present), so a
    # plain image with no hidden data silently fell through to a garbage
    # base64/decrypt attempt instead of raising this clear error.
    with pytest.raises(ValueError, match="end marker not found"):
        stego.decode_image(str(sample_image), stego.generate_key())


def test_normalize_key_derives_consistent_key_from_password():
    key_a = stego.normalize_key("my password")
    key_b = stego.normalize_key("my password")
    assert key_a == key_b
    assert key_a != stego.normalize_key("different password")


def test_normalize_key_passes_through_real_fernet_key():
    real_key = stego.generate_key()
    assert stego.normalize_key(real_key) == real_key


def test_message_too_large_for_image_fails_encode(tmp_path):
    tiny = tmp_path / "tiny.png"
    Image.new("RGB", (2, 2), color=(0, 0, 0)).save(tiny)
    output = tmp_path / "out.png"

    assert stego.encode_image(str(tiny), str(output), "x" * 1000, stego.generate_key()) is False


def test_encode_decode_large_message_on_large_image(tmp_path):
    # Regression test: decode_image used to cap LSB scanning at a fixed
    # 1,000,000 bits regardless of image size, so a message that needed
    # more bits than that to encode - even though it fit the image's real
    # capacity - would encode successfully but fail to decode.
    large_image = tmp_path / "large.png"
    Image.new("RGB", (800, 800), color=(10, 20, 30)).save(large_image)
    output = tmp_path / "large_encoded.png"
    key = stego.generate_key()

    # ~105,000 chars -> encrypted+base64 comfortably exceeds 1,000,000 bits
    # once encoded, while still fitting an 800x800 image's real capacity.
    long_message = "secret " * 15000
    assert stego.encode_image(str(large_image), str(output), long_message, key) is True
    assert stego.decode_image(str(output), key) == long_message
