interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline-primary" | "outline-secondary";
  type?: "button" | "submit";
  size?: "sm" | "lg";
  disabled?: boolean;
  onClick?: () => void;
}

export const Button = ({ label, variant = "primary", type = "button", size, disabled, onClick }: ButtonProps) => {
  return (
    <button
      type={type}
      className={`btn btn-${variant}${size ? ` btn-${size}` : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
