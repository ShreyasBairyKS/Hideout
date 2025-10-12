import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, formatFileSize, createImagePreview } from '../../utils/helpers';

const FileUpload = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
  className = '',
}) => {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      const previewUrl = await createImagePreview(file);
      setPreview(previewUrl);
      onFileSelect(file);
    } catch (error) {
      console.error('Error creating preview:', error);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false,
    disabled,
  });

  const handleRemove = () => {
    setPreview(null);
    onFileRemove();
  };

  if (selectedFile && preview) {
    return (
      <div className={`relative ${className}`}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ImageIcon className="w-5 h-5" style={{ color: '#22c55e' }} />
              <div>
                <p style={{ fontWeight: '500', color: '#e5e7eb', margin: 0 }}>{selectedFile.name}</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              disabled={disabled}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div style={{ aspectRatio: '16/9', backgroundColor: '#374151', borderRadius: '8px', overflow: 'hidden' }}>
            <img
              src={preview}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className="card"
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderColor: isDragActive ? '#22c55e' : '#4b5563',
          backgroundColor: isDragActive ? 'rgba(34, 197, 94, 0.05)' : undefined,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Upload 
            className="w-12 h-12"
            style={{ 
              margin: '0 auto 16px',
              color: isDragActive ? '#4ade80' : '#9ca3af'
            }}
          />
          
          {isDragActive ? (
            <p style={{ color: '#4ade80', fontWeight: '500', margin: 0 }}>Drop the image here</p>
          ) : (
            <div>
              <p style={{ color: '#d1d5db', fontWeight: '500', marginBottom: '8px' }}>
                Drop an image here, or click to select
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Supports JPEG, PNG, WebP • Max 10MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;