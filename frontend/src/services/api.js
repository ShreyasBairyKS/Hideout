import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for image processing
});

export class SteganographyAPI {
  /**
   * Encode a message into an image
   */
  static async encodeMessage(file, message) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);

    try {
      const response = await api.post('/encode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to encode message');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Download the encoded image
   */
  static async downloadEncodedImage(fileId) {
    try {
      const response = await api.get(`/download/${fileId}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to download image');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Decode a message from an image
   */
  static async decodeMessage(file, key) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);

    try {
      const response = await api.post('/decode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Failed to decode message');
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Check API health
   */
  static async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('API is not responding');
    }
  }
}

export default SteganographyAPI;