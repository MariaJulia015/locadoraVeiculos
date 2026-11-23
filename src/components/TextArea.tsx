import type { ChangeEvent } from "react";

interface TextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  error?: string;
}

export const TextArea = ({ label, name, value, onChange, rows = 3, error }: TextAreaProps) => {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className={`form-control${error ? " is-invalid" : ""}`}
        value={value}
        onChange={onChange}
        rows={rows}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
