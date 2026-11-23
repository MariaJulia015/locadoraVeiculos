interface AlertProps {
  type: "success" | "danger" | "warning";
  message: string;
  onClose?: () => void;
}

export const Alert = ({ type, message, onClose }: AlertProps) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type} d-flex justify-content-between align-items-start`} role="alert">
      <span>{message}</span>
      {onClose && <button type="button" className="btn-close ms-3" aria-label="Fechar" onClick={onClose} />}
    </div>
  );
}
