# 🕵️‍♂️ Hideout

**Hideout** is a secure chat platform that allows users to communicate by sending **images that contain hidden, encrypted messages**.  
It combines the power of **steganography** (hiding data inside images) and **encryption** to enable private, covert messaging.

---

## 🚀 Features  

- 🔒 **Encrypted Messaging** – All messages are securely encrypted using AES.
- 🖼 **Image Steganography** – Messages are hidden inside image pixels using LSB (Least Significant Bit) encoding.
- 💬 **Image-Based Chat** – Users chat by exchanging images instead of plain text.
- 🧠 **Smart Decode** – Uploaded images are automatically scanned and decoded to reveal the hidden text.
- 🌐 **Web-Based Interface** – Built using React (frontend) and FastAPI (backend).

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, TailwindCSS, Axios |
| Backend | FastAPI (Python), Pillow, Cryptography |
| Database (optional) | Firebase / MongoDB |
| Hosting | Netlify (Frontend), Render (Backend) |

---

## 🧠 How It Works

1. User enters a secret message.
2. The message is **encrypted** using AES.
3. Encrypted data is **embedded into the image pixels**.
4. The generated image is sent through chat.
5. Receiver uploads the image → **extracts and decrypts** message.

---

## 💻 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ShreyasBairyKS/Hideout.git
cd Hideout
```
### 2️⃣ Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn api:app --reload
```
### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
npm start
```
---

