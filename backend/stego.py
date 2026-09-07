from PIL import Image
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Salt for key derivation (in production, this should be stored securely)
KEY_SALT = b'hideout_steganography_salt_v1'

# Marks the end of the hidden payload. Deliberately built from a character
# ('|') that never appears in base64 output (alphabet is A-Z a-z 0-9 + / =).
# Using '=' here (as a previous version did) is broken: base64 payloads can
# themselves end in 1-2 '=' padding characters, so a run of '=' at the
# boundary between real padding and the marker is ambiguous and can be cut
# in the wrong place - corrupting roughly 1 in 3 messages (whichever ones
# happen to need 2 padding characters) so they fail to decode.
END_MARKER = "|||||"

# Generate a symmetric encryption key
def generate_key():
    """Generate a Fernet encryption key"""
    return Fernet.generate_key()

def derive_key_from_password(password: str) -> bytes:
    """Derive a valid Fernet key from a simple password string"""
    if isinstance(password, bytes):
        password_bytes = password
    else:
        password_bytes = password.encode()
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=KEY_SALT,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
    return key

def normalize_key(key) -> bytes:
    """Normalize a key to ensure it's a valid Fernet key.
    
    If the key is already a valid Fernet key (44 bytes, base64), use it directly.
    Otherwise, derive a Fernet key from it as a password.
    """
    if isinstance(key, str):
        key_bytes = key.encode()
    else:
        key_bytes = key
    
    # Check if it's already a valid Fernet key (44 characters, base64 encoded)
    try:
        if len(key_bytes) == 44:
            # Try to use it as a Fernet key directly
            Fernet(key_bytes)
            return key_bytes
    except Exception:
        pass
    
    # Otherwise, derive a key from the password
    return derive_key_from_password(key_bytes.decode() if isinstance(key_bytes, bytes) else key_bytes)

# Encrypt a message using the key
def encrypt_message(message, key):
    """Encrypt a plaintext message using Fernet encryption"""
    try:
        f = Fernet(key)
        return f.encrypt(message.encode())
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise

# Decrypt a message using the key
def decrypt_message(encrypted_message, key):
    """Decrypt an encrypted message using Fernet decryption"""
    try:
        f = Fernet(key)
        return f.decrypt(encrypted_message).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise

# Encode the encrypted message into an image
def encode_image(input_image_path, output_image_path, message, key):
    """Hide an encrypted message in an image using LSB steganography"""
    try:
        # Normalize the key (handle both Fernet keys and simple passwords)
        normalized_key = normalize_key(key)
        
        # Open and convert image to RGB if needed
        img = Image.open(input_image_path).convert('RGB')
        encoded = img.copy()
        width, height = img.size
        
        # Encrypt and prepare message
        encrypted_msg = encrypt_message(message, normalized_key)
        encoded_msg = base64.b64encode(encrypted_msg).decode()
        encoded_msg += END_MARKER
        
        # Convert message to binary
        binary_message = ''.join(format(ord(c), '08b') for c in encoded_msg)
        
        # Check if image can hold the message
        max_capacity = width * height * 3  # 3 bits per pixel (RGB)
        if len(binary_message) > max_capacity:
            logger.error(f"Message too long for image. Need {len(binary_message)} bits, have {max_capacity}")
            return False
        
        logger.info(f"Encoding {len(binary_message)} bits into {width}x{height} image")
        
        data_index = 0
        for y in range(height):
            for x in range(width):
                pixel = list(img.getpixel((x, y)))
                
                # Modify RGB channels
                for n in range(3):  # RGB
                    if data_index < len(binary_message):
                        # Set LSB to message bit
                        pixel[n] = pixel[n] & ~1 | int(binary_message[data_index])
                        data_index += 1
                
                encoded.putpixel((x, y), tuple(pixel))
                
                # Break early if message is fully encoded
                if data_index >= len(binary_message):
                    break
            
            if data_index >= len(binary_message):
                break
        
        # Save the encoded image
        encoded.save(output_image_path, "PNG")
        logger.info(f"Message successfully encoded to {output_image_path}")
        return True
        
    except Exception as e:
        logger.error(f"Encoding failed: {e}")
        return False

# Decode and decrypt the hidden message
def decode_image(encoded_image_path, key):
    """Extract and decrypt a hidden message from an image"""
    try:
        # Normalize the key (handle both Fernet keys and simple passwords)
        normalized_key = normalize_key(key)
        logger.info(f"Using normalized key for decoding")
        
        img = Image.open(encoded_image_path).convert('RGB')
        width, height = img.size
        logger.info(f"Decoding message from {width}x{height} image")

        # Extract LSBs pixel-by-pixel and decode to characters as we go, stopping
        # as soon as the end marker is found. This scans only as far as the actual
        # message requires (matching encode_image's uncapped capacity) instead of
        # an arbitrary bit limit that could cut off large messages in large images.
        decoded_data = ""
        bit_buffer = ""
        found_marker = False

        for pixel in img.getdata():
            for n in range(3):  # RGB channels
                bit_buffer += str(pixel[n] & 1)
                if len(bit_buffer) == 8:
                    decoded_data += chr(int(bit_buffer, 2))
                    bit_buffer = ""

                    if decoded_data.endswith(END_MARKER):
                        decoded_data = decoded_data[:-len(END_MARKER)]  # Remove end marker
                        found_marker = True
                        logger.info(f"Found end marker, extracted {len(decoded_data)} chars")
                        break
            if found_marker:
                break

        if not decoded_data or not decoded_data.strip():
            raise ValueError("No hidden message found - image may not contain encoded data")

        if not found_marker:
            raise ValueError("No valid encoded data found in image - end marker not found")
        
        # Decode base64 and decrypt
        try:
            encrypted_message = base64.b64decode(decoded_data.encode())
        except Exception as b64_err:
            raise ValueError(f"Invalid encoded data in image: {str(b64_err)}")
        
        try:
            original_message = decrypt_message(encrypted_message, normalized_key)
        except Exception as decrypt_err:
            raise ValueError(f"Decryption failed - wrong key or corrupted data")
        
        logger.info("Message successfully decoded and decrypted")
        return original_message
        
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Decoding failed: {e}")
        raise ValueError(f"Failed to decode: {str(e)}")
