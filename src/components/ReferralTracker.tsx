import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { bump } from "@/lib/stats";

// Counts ?ref=CODE landings once per session.
export function ReferralTracker() {
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (!ref) return;
    const seenKey = `healthvoice.refseen.${ref}`;
    if (sessionStorage.getItem(seenKey)) return;
    sessionStorage.setItem(seenKey, "1");
    sessionStorage.setItem("healthvoice.lastref", ref);
    bump("referralClicks", 1);
  }, [location.search]);
  return null;
}
