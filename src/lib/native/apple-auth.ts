import { Capacitor } from "@capacitor/core";

export interface AppleResult {
  idToken: string;
  rawNonce: string;
  // Single-use code exchanged server-side for an Apple refresh token, so account
  // deletion can revoke it (Guideline 5.1.1(v)). See supabase/functions/apple-exchange.
  authorizationCode?: string | null;
  profile?: { email?: string | null; givenName?: string | null; familyName?: string | null };
}
type AppleDriver = () => Promise<AppleResult>;

let driver: AppleDriver | null = null;

/** True once the native Apple driver is registered (native shell only). */
export function hasNativeApple(): boolean {
  return driver !== null;
}

export function nativeAppleSignIn(): Promise<AppleResult> {
  if (!driver) throw new Error("no native apple driver");
  return driver();
}

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Native-only. Registers the Apple driver using @capacitor-community/apple-sign-in
 * (Apple-only, no Google/Facebook SDK bloat; iOS AuthenticationServices).
 * Apple embeds the HASHED nonce in its identityToken, so we pass the hashed
 * nonce to authorize() and the RAW nonce to Supabase signInWithIdToken().
 */
export async function registerAppleDriver(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
  driver = async () => {
    const rawNonce = crypto.randomUUID();
    const hashedNonce = await sha256hex(rawNonce);
    const { response } = await SignInWithApple.authorize({
      clientId: "com.countrivo.app",
      redirectURI: "https://countrivo.com/auth/callback",
      scopes: "email name",
      nonce: hashedNonce,
    });
    if (!response?.identityToken) throw new Error("Apple did not return an identityToken");
    return {
      idToken: response.identityToken,
      rawNonce,
      authorizationCode: response.authorizationCode ?? null,
      profile: {
        email: response.email,
        givenName: response.givenName,
        familyName: response.familyName,
      },
    };
  };
}
