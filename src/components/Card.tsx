import type { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export const Card = ({ title, children, actions }: CardProps) => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <h2 className="h6 mb-0">{title}</h2>
        {actions}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
