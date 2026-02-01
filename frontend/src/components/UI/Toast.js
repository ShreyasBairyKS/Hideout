import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Copy, Download, Info } from 'lucide-react';

// Toast configuration
export const ToastContainer = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: 'var(--toast-bg)',
        color: 'var(--toast-color)',
        border: '1px solid var(--toast-border)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
      },
    }}
  />
);

// Custom toast functions
export const showSuccessToast = (message) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-dark-800 dark:bg-dark-800 light:bg-white shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-green-500/30`}
    >
      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-5 h-5 text-green-400" />
      </div>
      <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">{message}</p>
    </div>
  ));
};

export const showErrorToast = (message) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-dark-800 dark:bg-dark-800 light:bg-white shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-red-500/30`}
    >
      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">{message}</p>
    </div>
  ));
};

export const showCopyToast = (message = 'Copied to clipboard!') => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-dark-800 dark:bg-dark-800 light:bg-white shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-primary-500/30`}
    >
      <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Copy className="w-5 h-5 text-primary-400" />
      </div>
      <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">{message}</p>
    </div>
  ));
};

export const showDownloadToast = (message = 'Download started!') => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-dark-800 dark:bg-dark-800 light:bg-white shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-blue-500/30`}
    >
      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Download className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">{message}</p>
    </div>
  ));
};

export const showInfoToast = (message) => {
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-dark-800 dark:bg-dark-800 light:bg-white shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4 border border-yellow-500/30`}
    >
      <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Info className="w-5 h-5 text-yellow-400" />
      </div>
      <p className="text-gray-200 dark:text-gray-200 light:text-gray-800 font-medium">{message}</p>
    </div>
  ));
};

export default toast;
