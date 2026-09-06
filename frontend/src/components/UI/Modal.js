import React from 'react';

// Shared full-screen backdrop + centered card chrome used by the app's popup dialogs.
const Modal = ({ children, maxWidthClass = 'max-w-md' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className={`bg-dark-800 dark:bg-dark-800 light:bg-white rounded-2xl p-6 ${maxWidthClass} w-full shadow-2xl animate-scale-in`}>
      {children}
    </div>
  </div>
);

export default Modal;
