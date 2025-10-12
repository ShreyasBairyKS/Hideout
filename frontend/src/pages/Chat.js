import React from 'react';
import { MessageSquare, Users, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chat = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Chat Platform</h1>
        <p className="text-xl text-gray-300">
          Real-time messaging with hidden encrypted messages in images
        </p>
      </div>

      {/* Coming Soon */}
      <div className="card bg-gradient-to-br from-primary-500/10 to-green-500/10 border-primary-500/20">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-10 h-10 text-primary-400" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-primary-400 mb-2">Coming Soon!</h2>
            <p className="text-gray-300 text-lg">
              We're building an amazing chat platform where you can send messages 
              hidden inside images in real-time.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-semibold text-gray-200">Image Messages</h3>
              <p className="text-sm text-gray-400">
                Send images that contain hidden encrypted messages
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-semibold text-gray-200">Group Chats</h3>
              <p className="text-sm text-gray-400">
                Create secure group conversations with multiple participants
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="font-semibold text-gray-200">Real-time</h3>
              <p className="text-sm text-gray-400">
                Instant message delivery with WebSocket technology
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <p className="text-gray-400">
              In the meantime, try encoding and decoding messages manually:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/encode" className="btn-primary inline-flex items-center gap-2">
                Encode Message
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/decode" className="btn-secondary inline-flex items-center gap-2">
                Decode Message
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-200 mb-6">Development Roadmap</h2>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200">Phase 1: Core Steganography</h4>
              <p className="text-gray-400 text-sm">Encode and decode messages in images - ✅ Complete</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200">Phase 2: Real-time Chat</h4>
              <p className="text-gray-400 text-sm">WebSocket integration, user sessions, message history</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200">Phase 3: Advanced Features</h4>
              <p className="text-gray-400 text-sm">Auto-generated cover images, group chats, file sharing</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">4</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200">Phase 4: Mobile App</h4>
              <p className="text-gray-400 text-sm">React Native app with camera integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;