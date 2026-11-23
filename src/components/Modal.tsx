import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  show: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
}

export const Modal = ({ show, title, onClose, onConfirm, children, confirmLabel = "Confirmar" }: ModalProps) => {
  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <Button label="Cancelar" variant="secondary" onClick={onClose} />
              <Button label={confirmLabel} variant="danger" onClick={onConfirm} />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}
