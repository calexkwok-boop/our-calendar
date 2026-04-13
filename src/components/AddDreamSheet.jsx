import { useState } from "react";

const CATEGORIES = [
  { id: "travel",    label: "Travel",    icon: "✈",  bg: "#E1F5EE", color: "#085041", border: "#1D9E75", glow: "rgba(29,158,117,.15)" },
  { id: "food",      label: "Food",      icon: "◎",  bg: "#FAEEDA", color: "#633806", border: "#BA7517", glow: "rgba(186,117,23,.15)" },
  { id: "adventure", label: "Adventure", icon: "▲",  bg: "#FAECE7", color: "#712B13", border: "#D85A30", glow: "rgba(216,90,48,.15)" },
  { id: "culture",   label: "Culture",   icon: "◈",  bg: "#EEEDFE", color: "#3C3489", border: "#7F77DD", glow: "rgba(127,119,221,.15)" },
  { id: "home",      label: "Home",      icon: "⌂",  bg: "#EAF3DE", color: "#27500A", border: "#639922", glow: "rgba(99,153,34,.15)" },
  { id: "wellness",  label: "Wellness",  icon: "◡",  bg: "#FBEAF0", color: "#72243E", border: "#D4537E", glow: "rgba(212,83,126,.15)" },
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

export default function AddDreamSheet({ onAdd, onDismiss }) {
  const [dream, setDream] = useState("");
  const [selectedCat, setSelectedCat] = useState("travel");
  const [selectedSources, setSelectedSources] = useState(new Set());

  const toggleSource = (id) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (!dream.trim()) return;
    onAdd?.({
      dream,
      category: selectedCat,
      sources: [...selectedSources],
    });
  };

  return (
    <div style={styles.overlay} onClick={() => onDismiss?.()}>
      <div style={styles.sheet} onClick={(event) => event.stopPropagation()}>
        {/* Close button */}
        <button style={styles.closeBtn} onClick={() => onDismiss?.()}>✕</button>

        {/* Drag handle */}
        <div style={styles.dragHandle} />

        {/* Header */}
        <div style={styles.headerBand}>
          <h2 style={styles.title}>Add a dream ✦</h2>
          <p style={styles.subtitle}>What do you want to do someday?</p>
        </div>

        <div style={styles.divider} />

        {/* Dream input */}
        <div style={styles.section}>
          <div style={styles.secLabel}>The dream</div>
          <input
            style={styles.dreamField}
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="e.g. Trek in Patagonia…"
            onFocus={(e) => {
              e.target.style.borderColor = "#7F77DD";
              e.target.style.boxShadow = "0 0 0 4px rgba(127,119,221,0.12)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--color-border-secondary)";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                style={styles.sugChip}
                onClick={() => setDream(s)}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#7F77DD";
                  e.target.style.borderStyle = "solid";
                  e.target.style.background = "#EEEDFE";
                  e.target.style.color = "#534AB7";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "var(--color-border-secondary)";
                  e.target.style.borderStyle = "dashed";
                  e.target.style.background = "transparent";
                  e.target.style.color = "var(--color-text-secondary)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={styles.section}>
          <div style={styles.secLabel}>Category</div>
          <div style={styles.catGrid}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  style={{
                    ...styles.catBtn,
                    background: cat.bg,
                    color: cat.color,
                    border: isActive ? `2px solid ${cat.border}` : "2px solid transparent",
                    boxShadow: isActive ? `0 0 0 3px ${cat.glow}` : "none",
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
          <div style={styles.secLabel}>Where'd this come from?</div>
          <div style={styles.sourceRow}>
            {SOURCES.map((src) => {
              const isActive = selectedSources.has(src.id);
              return (
                <button
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  style={{
                    ...styles.srcPill,
                    borderColor: isActive ? "#7F77DD" : "var(--color-border-secondary)",
                    background: isActive ? "#EEEDFE" : "var(--color-background-secondary)",
                    color: isActive ? "#3C3489" : "var(--color-text-secondary)",
                  }}
                >
                  {src.icon}
                  {src.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAdd}
          disabled={!dream.trim()}
          style={{
            ...styles.addBtn,
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
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
  },
  sheet: {
    position: "relative",
    width: "100%",
    maxWidth: 480,
    background: "#fffdf8",
    borderRadius: "20px 20px 0 0",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
    paddingBottom: 32,
  },
  dragHandle: {
    width: 40,
    height: 5,
    background: "var(--color-border-secondary)",
    borderRadius: 3,
    margin: "14px auto 22px",
  },
  headerBand: {
    padding: "0 22px 18px",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 16,
    background: "rgba(15,23,42,0.06)",
    border: "none",
    fontSize: 14,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    width: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    lineHeight: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    margin: "0 0 3px",
  },
  subtitle: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    margin: 0,
  },
  divider: {
    height: 0.5,
    background: "var(--color-border-tertiary)",
    marginBottom: 20,
  },
  section: {
    padding: "0 22px",
    marginBottom: 22,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "var(--color-text-tertiary)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  dreamField: {
    width: "100%",
    boxSizing: "border-box",
    border: "1.5px solid var(--color-border-secondary)",
    borderRadius: 14,
    padding: "13px 16px",
    fontSize: 16,
    fontFamily: "inherit",
    color: "var(--color-text-primary)",
    background: "var(--color-background-secondary)",
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
    border: "1.5px dashed var(--color-border-secondary)",
    fontSize: 13,
    color: "var(--color-text-secondary)",
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
  addBtn: {
    display: "block",
    width: "calc(100% - 44px)",
    margin: "0 22px",
    padding: 15,
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    border: "none",
    borderRadius: 16,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "opacity .15s",
    letterSpacing: "0.01em",
  },
};
