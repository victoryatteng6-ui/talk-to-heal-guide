import jsPDF from "jspdf";
import { loadProfile } from "./healthProfile";
import { loadStats, todayWaterMl, streakDays, getReferralLink } from "./stats";

interface PdfOptions {
  conversation?: { role: string; content: string }[];
}

export function generatePremiumPdf(opts: PdfOptions = {}): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  // Header bar
  doc.setFillColor(61, 188, 139);
  doc.rect(0, 0, PAGE_W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text("HealthVoice — Premium Health Report", M, 50);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(new Date().toLocaleString(), M, 72);
  y = 130;

  // Disclaimer box
  doc.setFillColor(255, 248, 220); doc.setDrawColor(232, 200, 80);
  doc.roundedRect(M, y, PAGE_W - 2 * M, 56, 8, 8, "FD");
  doc.setTextColor(120, 90, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text("MEDICAL DISCLAIMER", M + 14, y + 20);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text("This report is informational only and is not a medical diagnosis.\nAlways consult a qualified healthcare professional.", M + 14, y + 36);
  y += 80;

  // Profile section
  const profile = loadProfile();
  doc.setTextColor(20, 40, 30); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Your Health Profile", M, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  const profLines = [
    `Age: ${profile.age || "—"}`,
    `Sex: ${profile.sex || "—"}`,
    `Allergies: ${profile.allergies || "—"}`,
    `Medications: ${profile.medications || "—"}`,
    `Conditions: ${profile.conditions || "—"}`,
  ];
  profLines.forEach((l) => { doc.text(l, M, y); y += 16; });
  y += 12;

  // Wellness stats
  const stats = loadStats();
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Wellness Snapshot", M, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  [
    `Water today: ${todayWaterMl()} ml`,
    `Health Points: ${stats.waterPoints}`,
    `Daily streak: ${streakDays()} days`,
    `Member since: ${new Date(stats.installedAt).toLocaleDateString()}`,
  ].forEach((l) => { doc.text(l, M, y); y += 16; });
  y += 12;

  // Conversation summary
  if (opts.conversation?.length) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("Triage Summary", M, y); y += 18;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    opts.conversation.slice(-12).forEach((m) => {
      const prefix = m.role === "user" ? "You: " : "Assistant: ";
      const wrapped = doc.splitTextToSize(prefix + m.content, PAGE_W - 2 * M);
      wrapped.forEach((line: string) => {
        if (y > PAGE_H - M - 60) { doc.addPage(); y = M; }
        doc.text(line, M, y); y += 14;
      });
      y += 4;
    });
  }

  // Recommendations
  if (y > PAGE_H - 180) { doc.addPage(); y = M; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("General Recommendations", M, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  [
    "• Stay hydrated — aim for at least 2 L of water daily.",
    "• Get 7–9 hours of sleep and 30 minutes of moderate exercise.",
    "• If symptoms persist beyond 48 hours or worsen, consult a doctor.",
    "• Keep your medication list up to date in your Health Profile.",
    "• In an emergency, call 112 (or your local emergency number).",
  ].forEach((l) => {
    const wrapped = doc.splitTextToSize(l, PAGE_W - 2 * M);
    wrapped.forEach((line: string) => { doc.text(line, M, y); y += 16; });
  });

  // Footer
  doc.setDrawColor(220, 230, 225);
  doc.line(M, PAGE_H - 50, PAGE_W - M, PAGE_H - 50);
  doc.setFontSize(9); doc.setTextColor(120, 130, 125);
  doc.text("Powered by Talk To Heal — HealthVoice", M, PAGE_H - 32);
  doc.text(getReferralLink(), PAGE_W - M, PAGE_H - 32, { align: "right" });

  return doc;
}
