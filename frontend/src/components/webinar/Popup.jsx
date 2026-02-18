import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import './Popup.css';

const Popup = ({ message, type = 'success', onClose, autoClose = true, autoCloseDelay = 3000 }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoClose && type === 'success') {
      const startTime = Date.now();
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, autoCloseDelay - elapsed);
        setProgress((remaining / autoCloseDelay) * 100);
      }, 50);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [autoClose, type, onClose, autoCloseDelay]);

  const isSuccess = type === 'success';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-card popup-card ${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="popup-close" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="popup-header">
          <div className="popup-icon">
            {isSuccess ? (
              <CheckCircle className="success-icon" />
            ) : (
              <XCircle className="error-icon" />
            )}
          </div>
        </div>
        <div className="popup-body">
          <p className="popup-message">{message}</p>
        </div>
        {autoClose && type === 'success' && (
          <div className="popup-progress">
            <div
              className="popup-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {!autoClose && (
          <div className="popup-actions">
            <button className="btn-primary" onClick={onClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
