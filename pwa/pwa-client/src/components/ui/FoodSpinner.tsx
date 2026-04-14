"use client";

import { useTheme } from "@/context/ThemeContext";

export function FoodSpinner({ fullScreen = true }: { fullScreen?: boolean }) {
  // Graceful fallback for useTheme in case it's used outside its provider randomly
  let dark = true;
  try {
    const themeContext = useTheme();
    dark = themeContext?.dark ?? true;
  } catch (e) {
    dark = true; 
  }

  const bg = dark ? "#111214" : "#FFF0DC";
  
  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 64, height: 64 }}>
        {/* Outer spinning ring */}
        <div style={{ 
          position: "absolute", inset: 0, 
          borderRadius: "50%", 
          border: "4px solid rgba(255, 107, 53, 0.2)", 
          borderTopColor: "#FF6B35", 
          animation: "spin 1s cubic-bezier(0.5, 0.1, 0.4, 0.9) infinite" 
        }} />
        {/* Inner bouncing emoji */}
        <div style={{ 
          position: "absolute", inset: 0, 
          display: "flex", alignItems: "center", justifyContent: "center", 
          fontSize: "1.5rem",
          animation: "pulseEmoji 1.5s ease-in-out infinite"
        }}>
          🍽️
        </div>
      </div>
      <p style={{ color: dark ? "#8a8f98" : "#9B7B6B", fontSize: "0.9375rem", fontWeight: 700, animation: "pulseText 1.5s ease-in-out infinite", margin: 0 }}>
        Cargando...
      </p>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulseEmoji { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.15); opacity: 1; } }
        @keyframes pulseText { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );

  if (!fullScreen) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>{content}</div>;
  }

  return (
    <div style={{ minHeight: "100dvh", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {content}
    </div>
  );
}
