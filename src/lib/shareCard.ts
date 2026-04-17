// Generates a branded share PNG via Canvas with embedded QR code.
import QRCode from "qrcode";
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

  // Logo mark — circular badge with heart + wordmark
  ctx.fillStyle = MINT;
  ctx.beginPath(); ctx.arc(115, 130, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "700 36px sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.fillText("♥", 115, 132);
  ctx.textAlign = "left";
  ctx.fillStyle = INK; ctx.font = "800 32px sans-serif";
  ctx.fillText("Talk To Heal", 160, 124);
  ctx.fillStyle = MUTED; ctx.font = "500 20px sans-serif";
  ctx.fillText("Your pocket health companion", 160, 150);

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

  // Referral CTA pill with QR code on the right
  const link = getReferralLink();
  const pillY = cardY + cardH + 60;
  const pillH = 200;
  ctx.fillStyle = MINT;
  roundRect(ctx, 80, pillY, W - 160, pillH, 24); ctx.fill();

  // QR code (white tile + scannable code)
  const qrSize = 160;
  const qrX = W - 80 - qrSize - 24;
  const qrY = pillY + (pillH - qrSize) / 2;
  ctx.fillStyle = "#fff";
  roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 12); ctx.fill();
  try {
    const qrDataUrl = await QRCode.toDataURL(link, {
      width: qrSize, margin: 0,
      color: { dark: INK, light: "#ffffff" },
    });
    const qrImg = new Image();
    await new Promise<void>((res, rej) => {
      qrImg.onload = () => res();
      qrImg.onerror = () => rej(new Error("qr load"));
      qrImg.src = qrDataUrl;
    });
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  } catch {
    // graceful fallback — leave the white tile
  }

  // CTA text on the left of the pill
  ctx.fillStyle = "#fff"; ctx.font = "800 38px sans-serif"; ctx.textBaseline = "alphabetic";
  ctx.fillText("Scan to try free →", 120, pillY + 80);
  ctx.font = "500 22px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(link.replace(/^https?:\/\//, ""), 120, pillY + 118);
  ctx.font = "500 20px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`Ref: ${stats.referralCode}`, 120, pillY + 152);

  // Footer / watermark
  ctx.fillStyle = MUTED; ctx.font = "500 24px sans-serif";
  ctx.fillText("Powered by Talk To Heal", 80, H - 60);
  ctx.fillStyle = MINT_DARK; ctx.font = "600 22px sans-serif";
  const tagline = "talktoheal.app";
  const tagW = ctx.measureText(tagline).width;
  ctx.fillText(tagline, W - 80 - tagW, H - 60);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png", 0.95));
}
