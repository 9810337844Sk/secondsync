import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

const SESSION_KEY = "ss_welcomed";

export function Preloader() {
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "gone">("gone");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return; // already seen this session
    setPhase("in");

    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("out"), 2400);
    const t3 = setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "gone") return null;

  const isOut = phase === "out";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #c0392b 0%, #7b1c10 100%)",
        animation: isOut ? "ss-preloader-out 0.6s cubic-bezier(0.4,0,1,1) forwards" : undefined,
        overflow: "hidden",
      }}
    >
      {/* Background texture circles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", bottom: "-25%", left: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)",
        }} />
      </div>

      {/* Logo */}
      <div style={{
        animation: "ss-logo-in 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
        position: "relative",
      }}>
        <div style={{
          width: 80, height: 80,
          borderRadius: 22,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <img
            src={logo}
            alt="Second Sync"
            style={{ width: 52, height: 52, objectFit: "contain" }}
          />
        </div>
      </div>

      {/* Welcome text group */}
      <div style={{
        marginTop: 28, textAlign: "center",
        animation: "ss-fade-up 0.55s ease 0.55s both",
      }}>
        <p style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          marginBottom: 8,
        }}>
          Welcome to
        </p>
        <h1 style={{
          color: "#fff",
          fontSize: "clamp(36px, 8vw, 52px)",
          fontFamily: "Cormorant Garamond, serif",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          margin: 0,
        }}>
          Second Sync
        </h1>
      </div>

      {/* Divider line */}
      <div style={{
        marginTop: 18,
        height: 1.5,
        background: "rgba(255,255,255,0.35)",
        borderRadius: 2,
        animation: "ss-line-grow 0.5s ease 0.9s both",
      }} />

      {/* Tagline */}
      <p style={{
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
        marginTop: 12,
        letterSpacing: "0.04em",
        animation: "ss-fade-up 0.5s ease 1.0s both",
      }}>
        Nepal's Smart Second-Hand Marketplace
      </p>

      {/* Loading dots */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginTop: 48,
        animation: "ss-fade-up 0.5s ease 1.1s both",
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 5,
              height: 18,
              borderRadius: 3,
              background: "rgba(255,255,255,0.5)",
              animation: `ss-dot 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
