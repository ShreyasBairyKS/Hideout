import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Shared password input with a show/hide toggle, used by the room create/join modals.
const PasswordField = ({ value, onChange, placeholder, autoFocus = false, disabled = false }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field w-full pr-10"
        autoFocus={autoFocus}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default PasswordField;
