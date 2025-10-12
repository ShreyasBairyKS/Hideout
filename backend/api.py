from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.stego import encode_image, decode_image, generate_key
import os
import uuid
import tempfile
from pathlib import Path

app = FastAPI(title="Hideout API", description="Steganography Messaging Platform")

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create temp directory for processing images
TEMP_DIR = Path("temp_images")
TEMP_DIR.mkdir(exist_ok=True)

@app.get("/")
def root():
    return {"message": "🕵️‍♂️ Hideout backend is running!", "version": "1.0.0"}

@app.post("/encode")
async def encode(file: UploadFile, message: str = Form(...)):
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
        
        # Generate encryption key and encode
        key = generate_key()
        success = encode_image(str(input_path), str(output_path), message, key)
        
        # Cleanup input file
        input_path.unlink()
        
        if success:
            return {
                "status": "success", 
                "key": key.decode(), 
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
        
        # Decode message
        message = decode_image(str(input_path), key.encode())
        
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
