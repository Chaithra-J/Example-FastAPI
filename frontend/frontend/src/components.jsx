export function Button({ children, onClick, type = "button", variant = "primary" }) {
  const baseStyle = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  };
  const variants = {
    primary: { backgroundColor: "#2563eb", color: "#fff" },
    secondary: { backgroundColor: "#e5e7eb", color: "#374151" }
  };
  return (
    <button type={type} onClick={onClick} style={{ ...baseStyle, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Card({ children, title }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", margin: "16px 0", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      {title && <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: "8px", color: "#1f2937" }}>{title}</h3>}
      {children}
    </div>
  );
}