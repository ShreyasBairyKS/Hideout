import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Image, MessageSquare, ArrowRight, Zap, Eye } from 'lucide-react';

const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            <span className="text-gradient">Hideout</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Send secret messages hidden inside ordinary images. 
            Combine the power of <span className="text-primary-400">encryption</span> and 
            <span className="text-primary-400"> steganography</span> for ultimate privacy.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/encode" className="btn-primary inline-flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Encode Message
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/decode" className="btn-secondary inline-flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Decode Message
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200">Military-Grade Encryption</h3>
          <p className="text-gray-400">
            Your messages are encrypted with AES-256 before being hidden in images, 
            ensuring maximum security.
          </p>
        </div>

        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto">
            <Image className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200">Invisible Steganography</h3>
          <p className="text-gray-400">
            Messages are hidden in image pixels using LSB encoding. 
            The images look completely normal to the human eye.
          </p>
        </div>

        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-primary-500/10 rounded-xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-200">Easy to Use</h3>
          <p className="text-gray-400">
            Simple drag-and-drop interface. No technical knowledge required. 
            Perfect for secure communication.
          </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-center text-gray-200">How It Works</h2>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Upload & Encrypt</h4>
                <p className="text-gray-400">Choose an image and type your secret message. We encrypt it with a unique key.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Hide in Pixels</h4>
                <p className="text-gray-400">The encrypted message is embedded into the image pixels invisibly using steganography.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-200 mb-2">Share Securely</h4>
                <p className="text-gray-400">Send the image anywhere. Only someone with the decryption key can reveal the message.</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-primary-500/10 to-green-500/10 border-primary-500/20">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-primary-400 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-200">Ready to Try?</h3>
              <p className="text-gray-400">Start sending secret messages hidden in plain sight.</p>
              <Link to="/encode" className="btn-primary inline-flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="card bg-yellow-500/5 border-yellow-500/20">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-200 mb-2">Security Notice</h3>
            <p className="text-yellow-100/80 text-sm">
              This tool is for educational and legitimate privacy purposes only. 
              Always comply with local laws and regulations. The encryption keys are generated 
              locally and not stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;