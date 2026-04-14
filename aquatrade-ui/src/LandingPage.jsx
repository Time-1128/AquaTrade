import { useEffect, useState } from "react";
import { useApp } from "./context/AppContext";

export default function LandingPage() {
  const { dispatch } = useApp();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
  const timer = setTimeout(() => setLoaded(true), 200);
  return () => clearTimeout(timer);
  // ── REMOVED the timer that forced SET_PAGE:"login" ──
  // onAuthStateChanged in AppContext now handles all routing
}, [dispatch]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #0A3D62 0%, #0D6B8C 50%, #00B4D8 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated bubbles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${20 + i * 15}px`,
            height: `${20 + i * 15}px`,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            left: `${10 + i * 12}%`,
            bottom: `${-10 + i * 8}%`,
            animation: `floatUp ${3 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-40px) scale(1.1); opacity: 0.8; }
          100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
        }

        @keyframes waveAnim {
          0% { transform: translateX(-50%) scaleY(1); }
          50% { transform: translateX(-50%) scaleY(1.2); }
          100% { transform: translateX(-50%) scaleY(1); }
        }

        @keyframes bounce {
          0%,80%,100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
          textAlign: "center",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontSize: "80px",
            marginBottom: "24px",
            animation: "pulse 2s infinite",
            filter: "drop-shadow(0 8px 20px rgba(0,180,216,0.5))",
          }}
        >
          🎣
        </div>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "36px",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            marginBottom: "12px",
            letterSpacing: "-0.03em",
          }}
        >
          AquaTrade
        </h1>

        <p
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          Smart Fish Marketplace
        </p>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "16px",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6,
            maxWidth: "280px",
            margin: "0 auto 40px",
          }}
        >
          Fresh seafood from local fishermen, Choose your fresh catch today 🐟
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "48px",
          }}
        >
          {[
            "🎣 Live Catch",
            "📍 Nearby Sellers",
            "📦 Pre-Booking",
            "🤖 AI Pricing",
          ].map((f) => (
            <span
              key={f}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.9)",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* Loading indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#90E0EF",
                  borderRadius: "50%",
                  animation: `bounce 1.4s infinite ease-in-out`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Setting sail...
          </span>
        </div>
      </div>

      {/* Bottom wave */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: "200%",
          height: "120px",
          background: "#FFF8F0",
          borderRadius: "50% 50% 0 0",
          transform: "translateX(-50%)",
          animation: "waveAnim 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}