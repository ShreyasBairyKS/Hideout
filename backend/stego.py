from PIL import Image
from cryptography.fernet import Fernet
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Generate a symmetric encryption key
def generate_key():
    """Generate a Fernet encryption key"""
    return Fernet.generate_key()

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
        # Open and convert image to RGB if needed
        img = Image.open(input_image_path).convert('RGB')
        encoded = img.copy()
        width, height = img.size
        
        # Encrypt and prepare message
        encrypted_msg = encrypt_message(message, key)
        encoded_msg = base64.b64encode(encrypted_msg).decode()
        encoded_msg += "====="  # End marker
        
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
        img = Image.open(encoded_image_path).convert('RGB')
        logger.info(f"Decoding message from {img.size[0]}x{img.size[1]} image")
        
        # Extract binary data from LSBs
        binary_data = ""
        for pixel in img.getdata():
            for n in range(3):  # RGB channels
                binary_data += str(pixel[n] & 1)
        
        # Convert binary to characters
        all_bytes = [binary_data[i: i + 8] for i in range(0, len(binary_data), 8)]
        decoded_data = ""
        
        for byte in all_bytes:
            if len(byte) == 8:  # Valid byte
                char = chr(int(byte, 2))
                decoded_data += char
                
                # Check for end marker
                if decoded_data.endswith("====="):
                    decoded_data = decoded_data[:-5]  # Remove end marker
                    break
        
        if not decoded_data:
            raise ValueError("No hidden message found or invalid end marker")
        
        # Decode base64 and decrypt
        encrypted_message = base64.b64decode(decoded_data.encode())
        original_message = decrypt_message(encrypted_message, key)
        
        logger.info("Message successfully decoded and decrypted")
        return original_message
        
    except Exception as e:
        logger.error(f"Decoding failed: {e}")
        raise ValueError(f"Failed to decode message: {str(e)}")
