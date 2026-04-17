import { useState, useRef } from "react";

const CAVEAT = '"Caveat", cursive';

const CATEGORIES = [
  { id: "travel",    label: "Travel",    icon: "✈",  bg: "#E1F5EE", color: "#085041", border: "#1D9E75", glow: "rgba(29,158,117,.15)",  darkBg: "#0d2e22", darkColor: "#6ee7b7", darkBorder: "#1D9E75", darkGlow: "rgba(29,158,117,.25)" },
  { id: "food",      label: "Food",      icon: "◎",  bg: "#FAEEDA", color: "#633806", border: "#BA7517", glow: "rgba(186,117,23,.15)",  darkBg: "#2e1e07", darkColor: "#fbbf24", darkBorder: "#BA7517", darkGlow: "rgba(186,117,23,.25)" },
  { id: "adventure", label: "Adventure", icon: "▲",  bg: "#FAECE7", color: "#712B13", border: "#D85A30", glow: "rgba(216,90,48,.15)",   darkBg: "#2e1209", darkColor: "#fb923c", darkBorder: "#D85A30", darkGlow: "rgba(216,90,48,.25)" },
  { id: "culture",   label: "Culture",   icon: "◈",  bg: "#EEEDFE", color: "#3C3489", border: "#7F77DD", glow: "rgba(127,119,221,.15)", darkBg: "#1e1b3a", darkColor: "#a5b4fc", darkBorder: "#7F77DD", darkGlow: "rgba(127,119,221,.25)" },
  { id: "home",      label: "Home",      icon: "⌂",  bg: "#EAF3DE", color: "#27500A", border: "#639922", glow: "rgba(99,153,34,.15)",   darkBg: "#162608", darkColor: "#86efac", darkBorder: "#639922", darkGlow: "rgba(99,153,34,.25)" },
  { id: "wellness",  label: "Wellness",  icon: "◡",  bg: "#FBEAF0", color: "#72243E", border: "#D4537E", glow: "rgba(212,83,126,.15)",  darkBg: "#2e0f1e", darkColor: "#f9a8d4", darkBorder: "#D4537E", darkGlow: "rgba(212,83,126,.25)" },
];

const SOURCES = [
  {
    id: "thought",
    label: "Quick Thought",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7 3.5v4l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "place",
    label: "A place we visited",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6c0 3 4.5 7 4.5 7s4.5-4 4.5-7c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="7" cy="6" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "rec",
    label: "Recommendation",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M12 2.5L2 7l3.5 1.3L7 12.5 12 2.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "trip",
    label: "Past trip",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6h11" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "feeling",
    label: "Just a feeling",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M7 4.5v2.8M7 9h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const SUGGESTIONS = [
  "Road trip down the PCH",
  "Learn to surf",
  "A week in Japan",
  "See the Northern Lights",
];

const compressImage = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 600;
        const scale = Math.min(1, maxSize / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          resolve(typeof reader.result === "string" ? reader.result : "");
        }
      };
      img.onerror = () => resolve(typeof reader.result === "string" ? reader.result : "");
      img.src = typeof reader.result === "string" ? reader.result : "";
    };
    reader.readAsDataURL(file);
  });

export default function AddDreamSheet({ onAdd, onDismiss, darkMode = false }) {
  const [dream, setDream] = useState("");
  const [selectedCat, setSelectedCat] = useState("travel");
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [photoUrl, setPhotoUrl] = useState("");
  const [dragY, setDragY] = useState(0);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const dragStartYRef = useRef(null);

  const dm = (light, dark) => (darkMode ? dark : light);

  const toggleSource = (id) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await compressImage(file);
    setPhotoUrl(url);
    e.target.value = "";
  };

  const handleAdd = () => {
    if (!dream.trim()) return;
    onAdd?.({
      dream,
      category: selectedCat,
      sources: [...selectedSources],
      photoUrl,
    });
  };

  const handleDragStart = (clientY) => {
    dragStartYRef.current = clientY;
    setDragY(0);
  };

  const handleDragMove = (clientY) => {
    if (dragStartYRef.current == null) return;
    const delta = Math.max(0, clientY - dragStartYRef.current);
    setDragY(delta);
  };

  const handleDragEnd = () => {
    const shouldDismiss = dragY > 90;
    dragStartYRef.current = null;
    setDragY(0);
    if (shouldDismiss) onDismiss?.();
  };

  return (
    <div style={styles.overlay} onClick={() => onDismiss?.()}>
      <div
        style={{
          ...styles.sheet,
          background: dm("#fffdf8", "#18181c"),
          border: `1px solid ${dm("rgba(15,23,42,0.08)", "rgba(255,255,255,0.08)")}`,
          transform: `translateY(${dragY}px)`,
          transition: dragStartYRef.current ? "none" : "transform 180ms ease",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          style={{
            ...styles.closeBtn,
            background: dm("#e8e5e0", "#2a2a32"),
            color: dm("#555", "#aaa"),
          }}
          onClick={() => onDismiss?.()}
        >
          ✕
        </button>

        {/* Drag handle */}
        <div
          style={{
            ...styles.dragHandle,
            background: dm("rgba(15,23,42,0.15)", "rgba(255,255,255,0.15)"),
          }}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
          onMouseDown={(e) => handleDragStart(e.clientY)}
          onMouseMove={(e) => {
            if (dragStartYRef.current == null) return;
            handleDragMove(e.clientY);
          }}
          onMouseUp={handleDragEnd}
          onMouseLeave={() => {
            if (dragStartYRef.current != null) handleDragEnd();
          }}
        />

        {/* Header */}
        <div style={styles.headerBand}>
          <h2 style={{ ...styles.title, color: dm("#1a1a2e", "#f0eefc"), fontFamily: CAVEAT }}>Add a dream ✦</h2>
          <p style={{ ...styles.subtitle, color: dm("#666", "#888"), fontFamily: CAVEAT }}>What do you want to do someday?</p>
        </div>

        <div
          style={{
            ...styles.divider,
            background: dm("rgba(15,23,42,0.08)", "rgba(255,255,255,0.08)"),
          }}
        />

        {/* Dream input */}
        <div style={styles.section}>
          <div style={{ ...styles.secLabel, color: dm("#999", "#666"), fontFamily: CAVEAT }}>The dream</div>
          <input
            style={{
              ...styles.dreamField,
              border: `1.5px solid ${dm("rgba(15,23,42,0.15)", "rgba(255,255,255,0.12)")}`,
              color: dm("#1a1a2e", "#f0eefc"),
              background: dm("#f5f3ee", "#222228"),
            }}
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="e.g. Trek in Patagonia…"
            onFocus={(e) => {
              e.target.style.borderColor = "#7F77DD";
              e.target.style.boxShadow = "0 0 0 4px rgba(127,119,221,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = darkMode ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.15)";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                style={{
                  ...styles.sugChip,
                  border: `1.5px dashed ${dm("rgba(15,23,42,0.2)", "rgba(255,255,255,0.15)")}`,
                  color: dm("#888", "#666"),
                }}
                onClick={() => setDream(s)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7F77DD";
                  e.currentTarget.style.borderStyle = "solid";
                  e.currentTarget.style.background = dm("#EEEDFE", "rgba(127,119,221,0.18)");
                  e.currentTarget.style.color = dm("#534AB7", "#a5b4fc");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.15)" : "rgba(15,23,42,0.2)";
                  e.currentTarget.style.borderStyle = "dashed";
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = dm("#888", "#666");
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={styles.section}>
          <div style={{ ...styles.secLabel, color: dm("#999", "#666"), fontFamily: CAVEAT }}>Category</div>
          <div style={styles.catGrid}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    ...styles.catBtn,
                    background: dm(cat.bg, cat.darkBg),
                    color: dm(cat.color, cat.darkColor),
                    border: isActive
                      ? `2px solid ${dm(cat.border, cat.darkBorder)}`
                      : `2px solid ${dm("transparent", "rgba(255,255,255,0.05)")}`,
                    boxShadow: isActive ? `0 0 0 3px ${dm(cat.glow, cat.darkGlow)}` : "none",
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source */}
        <div style={styles.section}>
          <div style={{ ...styles.secLabel, color: dm("#999", "#666"), fontFamily: CAVEAT }}>Where'd this come from?</div>
          <div style={styles.sourceRow}>
            {SOURCES.map((src) => {
              const isActive = selectedSources.has(src.id);
              return (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  style={{
                    ...styles.srcPill,
                    borderColor: isActive
                      ? "#7F77DD"
                      : dm("rgba(15,23,42,0.15)", "rgba(255,255,255,0.12)"),
                    background: isActive
                      ? dm("#EEEDFE", "rgba(127,119,221,0.18)")
                      : dm("#f5f3ee", "#222228"),
                    color: isActive ? dm("#3C3489", "#a5b4fc") : dm("#888", "#666"),
                  }}
                >
                  {src.icon}
                  {src.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo */}
        <div style={styles.section}>
          <div style={{ ...styles.secLabel, color: dm("#999", "#666"), fontFamily: CAVEAT }}>Add a photo (optional)</div>
          {photoUrl ? (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={photoUrl}
                alt="Dream preview"
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 12, display: "block", border: `1.5px solid ${dm("rgba(15,23,42,0.12)", "rgba(255,255,255,0.12)")}` }}
              />
              <button
                onClick={() => setPhotoUrl("")}
                style={{
                  position: "absolute", top: -6, right: -6, width: 20, height: 20,
                  borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 10,
                  background: dm("#e8e5e0", "#2a2a32"), color: dm("#555", "#aaa"),
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                }}
              >✕</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  ...styles.photoBtn,
                  border: `1.5px solid ${dm("rgba(15,23,42,0.15)", "rgba(255,255,255,0.12)")}`,
                  background: dm("#f5f3ee", "#222228"),
                  color: dm("#888", "#666"),
                }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M5.5 2L4.5 3.5H2a1 1 0 00-1 1v7a1 1 0 001 1h11a1 1 0 001-1v-7a1 1 0 00-1-1h-2.5L9.5 2h-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <circle cx="7.5" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                Take photo
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                style={{
                  ...styles.photoBtn,
                  border: `1.5px solid ${dm("rgba(15,23,42,0.15)", "rgba(255,255,255,0.12)")}`,
                  background: dm("#f5f3ee", "#222228"),
                  color: dm("#888", "#666"),
                }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="5" cy="5" r="1.3" fill="currentColor"/>
                  <path d="M1.5 10.5l3.5-3.5 2.5 2.5 2-2 3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                Upload photo
              </button>
            </div>
          )}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />
          <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={!dream.trim()}
          style={{
            ...styles.addBtn,
            background: dm("#2dd4bf", "#0f766e"),
            color: dm("#0a1020", "#f8fafc"),
            opacity: dream.trim() ? 1 : 0.4,
            cursor: dream.trim() ? "pointer" : "not-allowed",
          }}
        >
          Add to someday list →
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10030,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "8px 8px max(8px, env(safe-area-inset-bottom))",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 480,
    borderRadius: "20px 20px 0 0",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
    paddingBottom: 18,
    maxHeight: "calc(82dvh - env(safe-area-inset-bottom))",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    margin: "10px auto 16px",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 14,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    lineHeight: 1,
    zIndex: 1,
  },
  headerBand: {
    padding: "0 20px 14px",
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    margin: "0 0 3px",
  },
  subtitle: {
    fontSize: 14,
    margin: 0,
  },
  divider: {
    height: 0.5,
    marginBottom: 16,
  },
  section: {
    padding: "0 20px",
    marginBottom: 18,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  dreamField: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 14,
    padding: "13px 16px",
    fontSize: 16,
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 10,
  },
  sugChip: {
    padding: "7px 13px",
    borderRadius: 20,
    fontSize: 13,
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all .15s",
    whiteSpace: "nowrap",
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 9,
  },
  catBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "14px 8px 12px",
    borderRadius: 14,
    cursor: "pointer",
    transition: "all .18s",
    fontFamily: "inherit",
  },
  sourceRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  srcPill: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "8px 13px",
    borderRadius: 20,
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all .15s",
    fontFamily: "inherit",
  },
  photoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "all .15s",
  },
  addBtn: {
    display: "block",
    width: "calc(100% - 44px)",
    margin: "0 22px",
    padding: 15,
    border: "none",
    borderRadius: 16,
    fontSize: 18,
    fontWeight: 700,
    fontFamily: CAVEAT,
    transition: "opacity .15s",
    letterSpacing: "0.01em",
  },
};
