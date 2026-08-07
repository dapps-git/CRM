import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  danger = true,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
        >
          <FiX size={16} />
        </button>

        <div className="flex items-start space-x-3 mb-4">
          <div className={`p-2.5 rounded-md ${danger ? 'bg-rose-100 text-rose-600' : 'bg-brand-100 text-brand-600'}`}>
            <FiAlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">{title}</h3>
            <p className="text-[11px] text-neutral-600 font-medium mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[10px] uppercase rounded transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 font-bold text-[10px] uppercase rounded transition-colors text-white ${
              danger 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-sm' 
                : 'bg-[#8a32c6] hover:bg-[#7828b0] shadow-sm'
            } flex items-center justify-center space-x-1`}
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
