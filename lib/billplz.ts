import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Billplz API v3 client. BILLPLZ_MODE picks the environment:
 * sandbox bills run on www.billplz-sandbox.com, production on www.billplz.com.
 */
function baseUrl(): string {
  return process.env.BILLPLZ_MODE === "production"
    ? "https://www.billplz.com"
    : "https://www.billplz-sandbox.com";
}

function authHeader(): string {
  const key = process.env.BILLPLZ_SECRET_KEY;
  if (!key) throw new Error("BILLPLZ_SECRET_KEY is not set");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export type CreatedBill = {
  id: string;
  url: string;
};

export async function createBill(input: {
  email: string;
  name: string;
  /** MYR sen. */
  amount: number;
  description: string;
  callbackUrl: string;
  redirectUrl: string;
}): Promise<CreatedBill> {
  const collectionId = process.env.BILLPLZ_COLLECTION_ID;
  if (!collectionId) throw new Error("BILLPLZ_COLLECTION_ID is not set");
  const body = new URLSearchParams({
    collection_id: collectionId,
    email: input.email,
    name: input.name,
    amount: String(input.amount),
    description: input.description,
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
  });
  const res = await fetch(`${baseUrl()}/api/v3/bills`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Billplz bill creation failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}

export async function getBill(
  billId: string
): Promise<{ paid: boolean; status: string | null }> {
  const res = await fetch(`${baseUrl()}/api/v3/bills/${billId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Billplz bill lookup failed: ${res.status}`);
  }
  const data = (await res.json()) as { paid?: boolean; status?: string };
  return { paid: data.paid === true, status: data.status ?? null };
}

/**
 * Verify a callback's x_signature: HMAC-SHA256 over the remaining params
 * sorted alphabetically, keyed with the X Signature key. Billplz docs show
 * two concatenation conventions (k=v pairs joined by |, and interleaved
 * key|value|key|value) — accept either.
 */
export function verifyXSignature(
  signature: string | null,
  params: Record<string, string>
): boolean {
  const key = process.env.BILLPLZ_X_SIGNATURE_KEY;
  if (!key || !signature) return false;
  const entries = Object.entries(params)
    .filter(([k]) => k !== "x_signature")
    .sort(([a], [b]) => a.localeCompare(b));
  const pairs = entries.map(([k, v]) => `${k}=${v}`).join("|");
  const interleaved = entries.map(([k, v]) => `${k}|${v}`).join("|");
  const candidates = [pairs, interleaved].map((source) =>
    createHmac("sha256", key).update(source).digest("hex")
  );
  const provided = Buffer.from(signature);
  return candidates.some(
    (candidate) =>
      candidate.length === provided.length &&
      timingSafeEqual(Buffer.from(candidate), provided)
  );
}
