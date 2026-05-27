import crypto from "node:crypto";

export const AUTH_COOKIE = "dos_session";

export type SessionUser = {
  username: string;
  role: "commissioner" | "co-commissioner";
};

type SessionPayload = SessionUser & {
  exp: number;
};

type AllowedUser = SessionUser & {
  password: string;
};

const defaultUsers: AllowedUser[] = [
  { username: "webs", password: "BryceCole98", role: "commissioner" },
];

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "local-dev-secret-change-this";
}

function getAllowedUsers(): AllowedUser[] {
  const raw = process.env.APP_USERS_JSON;
  if (!raw) return defaultUsers;

  try {
    const parsed = JSON.parse(raw) as AllowedUser[];
    if (!Array.isArray(parsed)) return defaultUsers;
    return parsed.filter(
      (u) => typeof u.username === "string" && typeof u.password === "string" && typeof u.role === "string"
    ) as AllowedUser[];
  } catch {
    return defaultUsers;
  }
}

function signPayload(payloadB64: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token?: string): SessionUser | null {
  if (!token) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = signPayload(payloadB64);
  if (signature !== expected) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.username || !payload.role || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return {
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function validateCredentials(username: string, password: string): SessionUser | null {
  const allowed = getAllowedUsers().find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!allowed) return null;

  return {
    username: allowed.username,
    role: allowed.role,
  };
}
