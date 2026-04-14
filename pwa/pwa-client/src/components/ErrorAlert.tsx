// src/components/ErrorAlert.tsx
import { FC } from "react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: FC<Props> = ({ message, onRetry }) => (
  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "16px", display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "16px", marginBottom: "16px" }}>
    <svg style={{ width: 24, height: 24, color: "#dc2626", flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    <div style={{ flex: 1 }}>
      <p style={{ color: "#991b1b", fontWeight: 600, margin: 0, fontSize: "0.9375rem" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{ marginTop: "8px", fontSize: "0.875rem", color: "#dc2626", textDecoration: "underline", border: "none", background: "none", cursor: "pointer", padding: 0 }}
        >
          Reintentar
        </button>
      )}
    </div>
  </div>
);

// No spinner is shown per user request.
