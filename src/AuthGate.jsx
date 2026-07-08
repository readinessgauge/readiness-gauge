import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Gauge as GaugeIcon, Mail } from "lucide-react";
import PaywallGate from "./PaywallGate";

const INK = "#14213D";
const PARCHMENT = "#FAF9F5";
const BRASS = "#A9812F";
const SLATE = "#5B6472";
const HAIRLINE = "#E4E0D6";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSendLink(e) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          marketing_consent: consent,
          marketing_consent_date: consent ? new Date().toISOString() : null,
        },
      },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: PARCHMENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: INK }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: PARCHMENT, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <GaugeIcon size={22} color={BRASS} />
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: INK, margin: 0 }}>
              Readiness Gauge
            </h1>
          </div>
          <p style={{ color: SLATE, fontSize: 13.5, marginBottom: 28 }}>
            AI Readiness Diagnostic ‚Äî sign in to access your assessment.
          </p>

          {status === "sent" ? (
            <div style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 24 }}>
              <Mail size={26} color={BRASS} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 14, color: INK, margin: 0 }}>
                Check <strong>{email}</strong> for a sign-in link. Click it to open your diagnostic.
              </p>
              <button
                onClick={() => setStatus("idle")}
                style={{ marginTop: 16, background: "none", border: "none", color: BRASS, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendLink} style={{ background: "#FFFFFF", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 24, textAlign: "left" }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: INK, display: "block", marginBottom: 6 }}>
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: `1px solid ${HAIRLINE}`,
                  fontSize: 14,
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
              />

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12.5,
                  color: SLATE,
                  marginBottom: 16,
                  cursor: "pointer",
                  lineHeight: 1.4,
                }}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                Yes, send me occasional updates on AI readiness. (Optional ‚Äî unrelated to signing in.)
              </label>

              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: INK,
                  color: "#FFF",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: status === "sending" ? "wait" : "pointer",
                }}
              >
                {status === "sending" ? "Sending..." : "Send me a sign-in link"}
              </button>
              {status === "error" && (
                <p style={{ color: "#9B2C2C", fontSize: 12.5, marginTop: 10, marginBottom: 0 }}>{errorMsg}</p>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px", maxWidth: 760, margin: "0 auto" }}>
        <button
          onClick={handleLogout}
          style={{ background: "none", border: "none", color: SLATE, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}
        >
          Sign out ({session.user.email})
        </button>
      </div>
      <PaywallGate session={session}>{children}</PaywallGate>
    </div>
  );
}

