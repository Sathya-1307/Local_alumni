import React from 'react';
import { X } from 'lucide-react';
import './Popup.css'; // Reuse the popup styles

const ConfirmationDialog = ({ message, onConfirm, onCancel, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card popup-card" onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onCancel}>
          <X size={20} />
        </button>
        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>
        <div className="popup-actions">
          <button className="btn-primary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm} style={{ backgroundColor: '#dc2626', marginLeft: '10px' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
