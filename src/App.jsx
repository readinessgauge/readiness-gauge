import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Dot
} from "recharts";
import { TrendingUp, ClipboardList, Gauge as GaugeIcon } from "lucide-react";
import { supabase } from "./supabaseClient";

const INK = "#14213D";
const PARCHMENT = "#FAF9F5";
const BRASS = "#A9812F";
const BRASS_LIGHT = "#D9C48F";
const SLATE = "#5B6472";
const HAIRLINE = "#E4E0D6";

const BANDS = [
  { max: 2.5, label: "Not Ready", color: "#9B2C2C", note: "Foundational gaps across the business." },
  { max: 3.5, label: "Emerging", color: "#B7791F", note: "Some building blocks exist." },
  { max: 4.3, label: "Developing", color: "#2C6E63", note: "Ready for focused pilots." },
  { max: 5.01, label: "Advanced", color: "#1F7A46", note: "Ready to scale with discipline." },
];

function bandFor(score) {
  return BANDS.find((b) => score < b.max) || BANDS[BANDS.length - 1];
}

const CATEGORIES = [
  {
    key: "Leadership",
    name: "Leadership & Sponsorship",
    focus: "Name one executive who is personally accountable for outcomes, not just budget.",
    questions: [
      "At least one senior executive is personally accountable for AI adoption outcomes, not just IT.",
      "Leadership can articulate why AI matters for our specific business, beyond \u2018staying competitive.\u2019",
      "Leaders are prepared to change how teams work, not just fund a new tool.",
      "There is a realistic budget and timeline attached to AI ambitions, not just enthusiasm.",
      "Middle management understands and supports the direction set by leadership.",
    ],
  },
  {
    key: "Governance",
    name: "Governance & Risk",
    focus: "Write a one-page acceptable-use policy and agree who approves new AI use cases.",
    questions: [
      "There is a clear process for approving new AI use cases before they start.",
      "We have defined who is accountable when an AI system makes a mistake.",
      "Data privacy, security, and compliance requirements are understood before adoption, not after.",
      "There is a documented policy on acceptable use of AI tools by staff.",
      "Vendor and third-party AI tools go through a consistent risk review.",
    ],
  },
  {
    key: "Data",
    name: "Data & Systems",
    focus: "Get an honest read on the one dataset your first use case actually depends on.",
    questions: [
      "Our core business data is accurate, accessible, and reasonably well organised.",
      "We know which systems hold the data most relevant to our priority AI use cases.",
      "We can integrate or connect data across systems without excessive manual work.",
      "We have a realistic view of our data quality issues, not an assumed one.",
      "IT and business teams collaborate effectively on data-related decisions.",
    ],
  },
  {
    key: "Skills",
    name: "Skills & Capability",
    focus: "Run a leadership awareness session and deeper training for the team closest to the use case.",
    questions: [
      "Employees have a basic working understanding of what AI can and can't do.",
      "We have identified who needs deeper AI/digital upskilling and by when.",
      "Teams feel psychologically safe raising concerns about AI tools or outcomes.",
      "We have people (internal or external) capable of translating AI potential into working solutions.",
      "Line managers are equipped to support their teams through the change, not just informed of it.",
    ],
  },
  {
    key: "UseCase",
    name: "Use Case Clarity",
    focus: "Name one specific, measurable business problem before evaluating any tool or vendor.",
    questions: [
      "We can name specific business problems AI should solve, not just \u2018use AI somewhere.\u2019",
      "Potential AI use cases are prioritised by business value, not by novelty or hype.",
      "We have a way to measure whether an AI use case actually delivered value.",
      "We know which processes are NOT good candidates for AI right now.",
      "Client- or customer-facing impacts of AI use cases have been considered.",
    ],
  },
];

const ALL_QUESTIONS = CATEGORIES.flatMap((cat) =>
  cat.questions.map((text, i) => ({ id: `${cat.key}-${i}`, cat: cat.key, text }))
);

function scoreAssessment(answers) {
  const categoryScores = {};
  CATEGORIES.forEach((cat) => {
    const ids = cat.questions.map((_, i) => `${cat.key}-${i}`);
    const vals = ids.map((id) => answers[id]).filter((v) => typeof v === "number");
    categoryScores[cat.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  const overall =
    Object.values(categoryScores).reduce((a, b) => a + b, 0) / CATEGORIES.length;
  return { categoryScores, overall };
}

function Gauge({ value }) {
  const pct = Math.max(0, Math.min(1, value / 5));
  const angle = -90 + pct * 180;
  const band = bandFor(value);
  const r = 90;
  const cx = 110;
  const cy = 110;
  const ticks = [0, 1, 2, 3, 4, 5];

  const polarToCartesian = (angleDeg) => {
    const a = ((angleDeg - 180) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  return (
    <svg viewBox="0 0 220 140" style={{ width: "100%", maxWidth: 220, height: "auto" }}>
      <path
        d={`M 20 110 A 90 90 0 0 1 200 110`}
        fill="none"
        stroke={HAIRLINE}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={`M 20 110 A 90 90 0 0 1 200 110`}
        fill="none"
        stroke={band.color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${pct * 283} 283`}
      />
      {ticks.map((t) => {
        const a = -180 + (t / 5) * 180;
        const outer = polarToCartesian(180 + a);
        return (
          <text
            key={t}
            x={cx + (r + 20) * Math.cos(((a - 0) * Math.PI) / 180)}
            y={cy + (r + 20) * Math.sin(((a - 0) * Math.PI) / 180) + 4}
            fontSize="10"
            fill={SLATE}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
          >
            {t}
          </text>
        );
      })}
      <line
        x1={cx}
        y1={cy}
        x2={cx + (r - 22) * Math.cos((angle * Math.PI) / 180)}
        y2={cy + (r - 22) * Math.sin((angle * Math.PI) / 180)}
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="6" fill={INK} />
      <text
        x={cx}
        y={cy - 26}
        textAnchor="middle"
        fontSize="28"
        fontWeight="700"
        fontFamily="ui-monospace, monospace"
        fill={INK}
      >
        {value.toFixed(1)}
      </text>
    </svg>
  );
}

function LikertQuestion({ value, onChange }) {
  const options = [
    { n: 1, label: "Strongly Disagree" },
    { n: 2, label: "Disagree" },
    { n: 3, label: "Neutral" },
    { n: 4, label: "Agree" },
    { n: 5, label: "Strongly Agree" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((o) => {
        const selected = value === o.n;
        return (
          <button
            key={o.n}
            onClick={() => onChange(o.n)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: 8,
              border: `1.5px solid ${selected ? BRASS : HAIRLINE}`,
              background: selected ? "#FBF4E6" : "#FFFFFF",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 120ms ease",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                border: `2px solid ${selected ? BRASS : "#C9C4B8"}`,
                background: selected ? BRASS : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFF" }} />}
            </span>
            <span style={{ fontSize: 15, fontWeight: selected ? 700 : 500, color: INK }}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Tabs({ view, setView, hasResults }) {
  const tabs = [
    { key: "assess", label: "Assess", icon: ClipboardList },
    { key: "dashboard", label: "Dashboard", icon: GaugeIcon, disabled: !hasResults },
    { key: "progress", label: "Progress", icon: TrendingUp, disabled: !hasResults },
  ];
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${HAIRLINE}` }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = view === t.key;
        return (
          <button
            key={t.key}
            disabled={t.disabled}
            onClick={() => setView(t.key)}
            style={{
              flex: "1 1 0",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "12px 8px",
              background: "none",
              border: "none",
              borderBottom: active ? `2px solid ${BRASS}` : "2px solid transparent",
              color: t.disabled ? "#B9B4A8" : active ? INK : SLATE,
              fontWeight: active ? 700 : 500,
              fontSize: "clamp(12px, 3.4vw, 14px)",
              cursor: t.disabled ? "not-allowed" : "pointer",
              fontFamily: "Georgia, 'Times New Roman', serif",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <Icon size={15} style={{ flexShrink: 0 }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("assess");
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assessments, setAssessments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageKey, setStorageKey] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email || "anonymous";
      const key = `readiness-gauge-assessments:${email}`;
      setStorageKey(key);
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) setAssessments(JSON.parse(raw));
      } catch (e) {
        // no data yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const latest = assessments.length ? assessments[assessments.length - 1] : null;

  const chartData = useMemo(
    () =>
      assessments.map((a, i) => ({
        name: new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        Overall: Number(a.overall.toFixed(2)),
        idx: i,
      })),
    [assessments]
  );

  async function handleSubmit(finalAnswers) {
    const answersToScore = finalAnswers || answers;
    const { categoryScores, overall } = scoreAssessment(answersToScore);
    const entry = { date: new Date().toISOString(), answers: answersToScore, categoryScores, overall };
    const next = [...assessments, entry];

    // Always show results right away - don't let storage issues block the UI.
    setAssessments(next);
    setView("dashboard");
    setAnswers({});
    setCurrentIndex(0);

    try {
      window.localStorage.setItem(storageKey || "readiness-gauge-assessments", JSON.stringify(next));
    } catch (e) {
      console.error("Could not save assessment history:", e);
    }
  }


  if (!loaded) {
    return (
      <div style={{ padding: 40, fontFamily: "Georgia, serif", color: INK }}>
        Loading your diagnostic...
      </div>
    );
  }

  return (
    <div style={{ background: PARCHMENT, minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 60px", boxSizing: "border-box" }}>
        <header style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <GaugeIcon size={22} color={BRASS} />
            <h1
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "clamp(21px, 6vw, 26px)",
                fontWeight: 700,
                letterSpacing: "0.3px",
                margin: 0,
              }}
            >
              Readiness Gauge
            </h1>
          </div>
          <p style={{ color: SLATE, fontSize: 13, marginTop: 4, marginLeft: 32, lineHeight: 1.4 }}>
            AI Readiness Diagnostic — a leadership instrument for assessing organisational readiness for AI adoption.
          </p>
        </header>

        <Tabs view={view} setView={setView} hasResults={assessments.length > 0} />

        <div style={{ marginTop: 26 }}>
          {view === "assess" && (
            <AssessView
              answers={answers}
              setAnswers={setAnswers}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              onSubmit={handleSubmit}
              saving={saving}
              retaking={assessments.length > 0}
            />
          )}
          {view === "dashboard" && latest && <DashboardView entry={latest} />}
          {view === "progress" && (
            <ProgressView assessments={assessments} chartData={chartData} />
          )}
        </div>
      </div>
    </div>
  );
}

function AssessView({ answers, setAnswers, currentIndex, setCurrentIndex, onSubmit, saving, retaking }) {
  const total = ALL_QUESTIONS.length;
  const q = ALL_QUESTIONS[currentIndex];
  const cat = CATEGORIES.find((c) => c.key === q.cat);
  const isLast = currentIndex === total - 1;
  const isFirst = currentIndex === 0;

  function selectAnswer(n) {
    setAnswers((prev) => ({ ...prev, [q.id]: n }));
    if (isLast) {
      // slight delay so the selection is visible before results appear
      setTimeout(() => onSubmit({ ...answers, [q.id]: n }), 250);
    } else {
      setTimeout(() => setCurrentIndex((i) => i + 1), 200);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        {retaking && currentIndex === 0 && (
          <p style={{ fontSize: 13, color: SLATE, marginBottom: 10 }}>
            Retaking the assessment lets you track how your organisation's readiness changes over time.
          </p>
        )}
        <div style={{ height: 6, background: HAIRLINE, borderRadius: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentIndex + (answers[q.id] ? 1 : 0)) / total) * 100}%`,
              background: BRASS,
              transition: "width 200ms ease",
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: SLATE, marginTop: 6, fontFamily: "ui-monospace, monospace" }}>
          Question {currentIndex + 1} / {total}
        </p>
      </div>

      <p
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          fontSize: 11.5,
          fontWeight: 700,
          color: BRASS,
          marginBottom: 8,
        }}
      >
        {cat.name}
      </p>
      <h2
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 20,
          lineHeight: 1.4,
          color: INK,
          marginTop: 0,
          marginBottom: 24,
          minHeight: 56,
        }}
      >
        {q.text}
      </h2>

      <LikertQuestion value={answers[q.id]} onChange={selectAnswer} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          style={{
            padding: "10px 18px",
            background: "none",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 8,
            color: isFirst ? "#C9C4B8" : SLATE,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: isFirst ? "not-allowed" : "pointer",
          }}
        >
          Back
        </button>
        {saving && <span style={{ fontSize: 12.5, color: SLATE, alignSelf: "center" }}>Saving...</span>}
      </div>
    </div>
  );
}

function DashboardView({ entry }) {
  const band = bandFor(entry.overall);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <Gauge value={entry.overall} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: 20,
            background: band.color,
            color: "#FFF",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.3px",
          }}
        >
          {band.label}
        </span>
        <p style={{ color: SLATE, fontSize: 13, marginTop: 8 }}>{band.note}</p>
      </div>

      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, marginBottom: 12 }}>
        Category breakdown
      </h3>
      {CATEGORIES.map((cat) => {
        const score = entry.categoryScores[cat.key];
        const catBand = bandFor(score);
        return (
          <div key={cat.key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{cat.name}</span>
              <span style={{ fontFamily: "ui-monospace, monospace", color: SLATE }}>
                {score.toFixed(1)} / 5
              </span>
            </div>
            <div style={{ height: 8, background: HAIRLINE, borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(score / 5) * 100}%`,
                  background: catBand.color,
                }}
              />
            </div>
            {score < 3.5 && (
              <p style={{ fontSize: 12.5, color: SLATE, marginTop: 6, fontStyle: "italic" }}>
                Focus on: {cat.focus}
              </p>
            )}
          </div>
        );
      })}

      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: "#FFFFFF",
          border: `1px solid ${HAIRLINE}`,
          borderLeft: `4px solid ${BRASS}`,
          borderRadius: 4,
        }}
      >
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
          Assessed on{" "}
          {new Date(entry.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          . Revisit this assessment every 6 months and use your lowest-scoring category as the
          agenda item for your next leadership discussion.
        </p>
      </div>
    </div>
  );
}

function ProgressView({ assessments, chartData }) {
  if (assessments.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "50px 20px", color: SLATE }}>
        <TrendingUp size={28} color={BRASS} style={{ marginBottom: 10 }} />
        <p style={{ fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
          Retake the assessment after your next round of changes to start tracking readiness over
          time. You need at least two assessments to see a trend.
        </p>
      </div>
    );
  }

  const first = assessments[0];
  const last = assessments[assessments.length - 1];
  const delta = last.overall - first.overall;

  return (
    <div>
      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, marginBottom: 4 }}>
        Overall readiness over time
      </h3>
      <p style={{ fontSize: 13, color: SLATE, marginBottom: 16 }}>
        {delta >= 0 ? "Up" : "Down"} {Math.abs(delta).toFixed(1)} points since your first
        assessment on {new Date(first.date).toLocaleDateString()}.
      </p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={HAIRLINE} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: SLATE }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: SLATE }} />
            <Tooltip
              contentStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 12, borderRadius: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Overall"
              stroke={BRASS}
              strokeWidth={3}
              dot={{ r: 4, fill: INK }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 style={{ fontFamily: "Georgia, serif", fontSize: 16, margin: "24px 0 10px" }}>
        Assessment history
      </h3>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 320, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${HAIRLINE}`, textAlign: "left" }}>
              <th style={{ padding: "6px 4px", fontWeight: 600 }}>Date</th>
              <th style={{ padding: "6px 4px", fontWeight: 600 }}>Overall</th>
              <th style={{ padding: "6px 4px", fontWeight: 600 }}>Band</th>
            </tr>
          </thead>
          <tbody>
            {assessments
              .slice()
              .reverse()
              .map((a, i) => {
                const b = bandFor(a.overall);
                return (
                  <tr key={i} style={{ borderBottom: `1px dashed ${HAIRLINE}` }}>
                    <td style={{ padding: "8px 4px", whiteSpace: "nowrap" }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ padding: "8px 4px", fontFamily: "ui-monospace, monospace" }}>
                      {a.overall.toFixed(2)}
                    </td>
                    <td style={{ padding: "8px 4px", whiteSpace: "nowrap" }}>
                      <span style={{ color: b.color, fontWeight: 600 }}>{b.label}</span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
