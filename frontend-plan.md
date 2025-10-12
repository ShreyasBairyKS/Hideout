# 🎨 Frontend Development Plan

## Components Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── Steganography/
│   │   ├── EncodeForm.tsx
│   │   ├── DecodeForm.tsx
│   │   └── ImagePreview.tsx
│   ├── Chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── UI/
│       ├── Button.tsx
│       ├── FileUpload.tsx
│       └── LoadingSpinner.tsx
├── pages/
│   ├── Home.tsx
│   ├── Encode.tsx
│   ├── Decode.tsx
│   └── Chat.tsx
├── services/
│   ├── api.ts
│   └── steganography.ts
├── types/
│   └── index.ts
└── utils/
    └── helpers.ts
```

## Key Features to Implement

### Phase 1: Basic Steganography UI
1. **Encode Page**: Upload image + message → download encoded image
2. **Decode Page**: Upload encoded image + key → reveal message
3. **File handling**: Drag & drop, preview, validation
4. **Key management**: Copy to clipboard, QR code generation

### Phase 2: Chat Interface
1. **Image-based chat**: Send/receive encoded images
2. **Real-time messaging**: WebSocket integration
3. **Message history**: Local storage or database
4. **User authentication**: Simple username/session

### Phase 3: Enhanced Features
1. **Auto-generated cover images**: Stock photos, patterns
2. **Batch encoding**: Multiple messages at once
3. **Mobile responsiveness**: Touch-friendly interface
4. **PWA features**: Offline capability

## API Integration

```typescript
interface EncodeRequest {
  file: File;
  message: string;
}

interface EncodeResponse {
  status: string;
  key: string;
  file_id: string;
  message: string;
}

interface DecodeRequest {
  file: File;
  key: string;
}

interface DecodeResponse {
  status: string;
  message: string;
  decoded_at: string;
}
```