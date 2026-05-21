// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const { error } = router.query;
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace("/dashboard");
        else setChecking(false);
      });
  }, []);

  if (checking) return null;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column",
      fontFamily: "'DM Mono', monospace", color: "#e8e4dc",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');`}</style>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c8f264", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "0.1em" }}>LIFEOS</span>
        </div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
          Your life,<br />
          <span style={{ color: "#c8f264" }}>fully optimized.</span>
        </h1>
        <p style={{ color: "#666", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
          Connect your WHOOP to sync live recovery scores, sleep data,
          strain, and calories — automatically, every time you open the dashboard.
        </p>
        {error && (
          <div style={{ background: "#1d0a0a", border: "1px solid #f87171", borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#f87171" }}>
            Auth error: {error}. Please try again.
          </div>
        )}
        <a href="/api/auth/login" style={{
          display: "inline-flex", alignItems: "center", gap: 10, background: "#c8f264",
          color: "#0a0a0f", padding: "14px 28px", borderRadius: 10, fontSize: 15,
          fontWeight: 600, textDecoration: "none", fontFamily: "'Syne', sans-serif",
          transition: "opacity 0.2s",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-11h2v6h-2zm0-4h2v2h-2z"/>
          </svg>
          Connect WHOOP &amp; Launch Dashboard
        </a>
        <p style={{ color: "#444", fontSize: 12, marginTop: 20 }}>
          Your data never leaves your own deployment.
        </p>
      </div>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
