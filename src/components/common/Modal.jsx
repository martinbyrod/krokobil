import { useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function Modal({ children, onClose }) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return ReactDOM.createPortal(
    <div 
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal__content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
} 