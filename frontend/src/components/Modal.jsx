import { useEffect } from 'react';

export default function Modal({ open, onClose, title, icon, size = 'md', children, footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <div className="modal-title">
            {icon && <i className={`bi ${icon}`} />}
            {title}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Action" icon="bi-exclamation-triangle" size="sm"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-secondary" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Processing...</> : <><i className="bi bi-check-lg" />Confirm</>}
          </button>
        </>
      }
    >
      <div className="text-center">
        <div className="confirm-icon"><i className="bi bi-exclamation-triangle-fill" /></div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{message}</p>
      </div>
    </Modal>
  );
}