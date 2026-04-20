// Paste your Paystack PUBLIC key here (test or live).
// Find it in Paystack Dashboard → Settings → API Keys & Webhooks.
export const PAYSTACK_PUBLIC_KEY = "pk_live_845f3744701736cd8e973341f467276d479e82b4";

const SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";
let loaderPromise: Promise<void> | null = null;

export function loadPaystack(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  // @ts-expect-error global
  if (window.PaystackPop) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Paystack")));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export interface PaystackOptions {
  email: string;
  amountKobo: number;
  reference?: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export async function openPaystackCheckout(opts: PaystackOptions) {
  await loadPaystack();
  // @ts-expect-error global
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: opts.email,
    amount: opts.amountKobo,
    currency: "NGN",
    ref: opts.reference ?? `tth_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    callback: (response: { reference: string }) => opts.onSuccess(response.reference),
    onClose: opts.onClose,
  });
  handler.openIframe();
}
