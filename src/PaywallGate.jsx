import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Lock } from "lucide-react";

const INK = "#14213D";
const PARCHMENT = "#FAF9F5";
const BRASS = "#A9812F";
const SLATE = "#5B6472";
const HAIRLINE = "#E4E0D6";

// Set this to your Gumroad product URL once it's live.
const PURCHASE_URL = "https://gaugekeeper7.gumroad.com/l/readinessgauge";

export default function PaywallGate({ session, children }) {
  const [status, setStatus] = useState("checking"); // checking | allowed | denied | error

  useEffect(() => {
    let cancelled = false;
    const email = session?.user?.email;
    if (!email) {
      setStatus("denied");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Paywall check failed:", error);
        setStatus("error");
      } else {
        setStatus(data ? "allowed" : "denied");
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only re-check when the signed-in email actually changes - not on every
    // background token refresh, which creates a new session object each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  if (status === "checking") {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "Georgia, serif", color: INK }}>
        Checking your access...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
        <p>Something went wrong checking your access. Please refresh the page.</p>
        <p style={{ fontSize: 12.5, color: SLATE }}>
          If this keeps happening, the <code>allowed_users</code> table may not exist yet in Supabase.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 420, textAlign: "center", background: "#FFFFFF", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 32 }}>
          <Lock size={28} color={BRASS} style={{ marginBottom: 12 }} />
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: INK, margin: "0 0 10px" }}>
            This account doesn't have access yet
          </h2>
          <p style={{ fontSize: 14, color: SLATE, lineHeight: 1.5, marginBottom: 20 }}>
            You're signed in as <strong>{session.user.email}</strong>. Purchase access below using
            this same email address to unlock the diagnostic.
          </p>
          <a
            href={PURCHASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: INK,
              color: "#FFF",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Get access
          </a>
          <p style={{ fontSize: 12, color: SLATE, marginTop: 18 }}>
            Already purchased with this email? Access is usually added within a few hours - check back soon.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

