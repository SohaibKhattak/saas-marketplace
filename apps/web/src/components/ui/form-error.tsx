import React from "react";

interface FormErrorProps {
  message?: string | null;
  onClose?: () => void;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ message, onClose, className = "" }) => {
  if (!message) return null;
  return (
    <div
      className={`relative flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-3 text-sm text-red-700 font-semibold tracking-tight shadow-sm mb-2 animate-fade-in ${className}`}
      role="alert"
    >
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss error"
          className="mr-2 mt-0.5 text-red-400 hover:text-red-700 focus:outline-none"
          onClick={onClose}
          style={{ fontWeight: "bold", fontSize: "1.1em", lineHeight: 1 }}
        >
          ×
        </button>
      )}
      <span>{message}</span>
    </div>
  );
};
