// Generates a branded share PNG via Canvas (no external deps).
import { loadStats, getReferralLink, todayWaterMl, streakDays } from "./stats";
import { loadProfile } from "./healthProfile";

export interface ShareCardOptions {
  width?: number;
  height?: number;
  title?: string;
  subtitle?: string;
}

// Soft mint palette matching the app
const MINT = "#3DBC8B";
const MINT_DARK = "#2A8A66";
const BG_TOP = "#F2FBF6";
const BG_BOTTOM = "#E1F4EC";
const INK = "#0F2A22";
const MUTED = "#5C7A70";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateShareCard(opts: ShareCardOptions = {}): Promise<Blob> {
  const W = opts.width ?? 1080;
  const H = opts.height ?? 1350; // Instagram portrait
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, BG_TOP);
  bg.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Decorative blobs
  ctx.fillStyle = "rgba(61,188,139,0.10)";
  ctx.beginPath(); ctx.arc(W * 0.85, H * 0.15, 220, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(61,188,139,0.08)";
  ctx.beginPath(); ctx.arc(W * 0.1, H * 0.85, 280, 0, Math.PI * 2); ctx.fill();

  // Header pill
  ctx.fillStyle = MINT;
  roundRect(ctx, 80, 100, 260, 60, 30); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "600 26px sans-serif"; ctx.textBaseline = "middle";
  ctx.fillText("♥  HealthVoice", 110, 130);

  // Title
  ctx.fillStyle = INK;
  ctx.font = "800 78px sans-serif";
  ctx.fillText(opts.title ?? "My Wellness Check", 80, 280);

  ctx.fillStyle = MUTED;
  ctx.font = "400 32px sans-serif";
  ctx.fillText(opts.subtitle ?? new Date().toLocaleDateString(undefined, { dateStyle: "long" }), 80, 350);

  // Stats card
  const cardX = 80, cardY = 430, cardW = W - 160, cardH = 540;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(15,42,34,0.10)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  roundRect(ctx, cardX, cardY, cardW, cardH, 32); ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Stat rows
  const stats = loadStats();
  const profile = loadProfile();
  const water = todayWaterMl();
  const streak = streakDays();

  const rows: { label: string; value: string }[] = [
    { label: "💧  Water today", value: `${water} ml` },
    { label: "🏆  Health Points", value: `${stats.waterPoints}` },
    { label: "🔥  Daily streak", value: `${streak} day${streak === 1 ? "" : "s"}` },
    { label: "👤  Profile", value: profile.age ? `${profile.age} yrs` : "Set up" },
  ];

  rows.forEach((r, i) => {
    const y = cardY + 70 + i * 110;
    ctx.fillStyle = MUTED; ctx.font = "500 30px sans-serif";
    ctx.fillText(r.label, cardX + 50, y);
    ctx.fillStyle = MINT_DARK; ctx.font = "700 44px sans-serif";
    const valW = ctx.measureText(r.value).width;
    ctx.fillText(r.value, cardX + cardW - 50 - valW, y);
    if (i < rows.length - 1) {
      ctx.strokeStyle = "rgba(15,42,34,0.06)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cardX + 50, y + 50); ctx.lineTo(cardX + cardW - 50, y + 50); ctx.stroke();
    }
  });

  // Referral CTA pill
  const link = getReferralLink();
  const pillY = cardY + cardH + 60;
  ctx.fillStyle = MINT;
  roundRect(ctx, 80, pillY, W - 160, 110, 24); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "700 32px sans-serif";
  ctx.fillText("Try it free →", 120, pillY + 45);
  ctx.font = "500 24px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(link.replace(/^https?:\/\//, ""), 120, pillY + 80);

  // Footer / watermark
  ctx.fillStyle = MUTED; ctx.font = "500 24px sans-serif";
  ctx.fillText("Powered by Talk To Heal", 80, H - 70);
  ctx.fillStyle = MINT_DARK; ctx.font = "700 24px sans-serif";
  const code = `Ref: ${stats.referralCode}`;
  const codeW = ctx.measureText(code).width;
  ctx.fillText(code, W - 80 - codeW, H - 70);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png", 0.95));
}
