import { ImageResponse } from "next/og";

export const alt = "Musinsa Tracking";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 34,
          background: "#030303",
          color: "#f5f5f5",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 0%, rgba(125, 240, 174, 0.22), transparent 34%), radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.12), transparent 30%), linear-gradient(180deg, #111111 0%, #090909 20%, #040404 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 36,
            border: "1px solid rgba(255,255,255,0.12)",
            backgroundColor: "rgba(12,12,12,0.86)",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
            boxShadow: "0 32px 90px rgba(0,0,0,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 36,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
            opacity: 0.18,
          }}
        />
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 1,
            padding: "30px 34px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.14)",
                  backgroundColor: "#0f0f0f",
                  backgroundImage:
                    "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(125,240,174,0.14))",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: "#ffffff",
                    boxShadow: "10px 0 0 #7df0ae",
                    transform: "translateX(-5px)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 3.2,
                    textTransform: "uppercase",
                    color: "rgba(245,245,245,0.62)",
                  }}
                >
                  Musinsa Product Tracking
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  Musinsa Tracking
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 44,
                padding: "0 18px",
                borderRadius: 999,
                border: "1px solid rgba(125,240,174,0.24)",
                backgroundColor: "rgba(10,22,12,0.72)",
                backgroundImage:
                  "linear-gradient(180deg, rgba(125,240,174,0.1), rgba(125,240,174,0.02))",
                color: "#b7fbce",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              Price history dashboard
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              width: "78%",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 74,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: -2.8,
              }}
            >
              Track Musinsa prices with a clean, fast dashboard.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 760,
                fontSize: 28,
                lineHeight: 1.5,
                color: "rgba(245,245,245,0.72)",
              }}
            >
              Save product URLs, compare recent price moves, and check history before you buy.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            {[
              { label: "Realtime checks", value: "Latest price" },
              { label: "History view", value: "Chart & timeline" },
              { label: "Cloud save", value: "Google login sync" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  gap: 10,
                  padding: "20px 22px",
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(17,17,17,0.9)",
                  backgroundImage:
                    "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    color: "rgba(245,245,245,0.58)",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 28,
                    fontWeight: 700,
                    color: item.label === "Cloud save" ? "#b7fbce" : "#ffffff",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
