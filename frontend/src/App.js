import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Encode from './pages/Encode';
import Decode from './pages/Decode';
import Chat from './pages/Chat';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/UI/Toast';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/encode" element={<Encode />} />
            <Route path="/decode" element={<Decode />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </Router>
    </ThemeProvider>
  );
}

export default App;