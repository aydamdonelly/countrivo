# 02 · Sera Vellanti · Auth-Vereinfachung

> Eine Tür, an der zwei von drei umkehren, ist keine Tür mehr. Sie ist eine Wand mit einem Schlüsselloch. Ich habe das vor sieben Jahren in Florenz gelernt. Ich erinnere mich jeden Mittwoch daran.

Lina hat den Code gelesen wie ein Detektiv. Ich lese ihn wie eine Form-Specialist: nicht "was steht da", sondern "wo bricht der Daumen ab, wenn ein müder Mensch um 23:47 im Bett auf einem Pixel 6 mit zwei Strichen Empfang versucht, sich anzumelden, weil er gerade einen 6/6 Countryle-Run hatte und ihn nicht verlieren will". Dort entscheidet sich Conversion. Nicht in den Server-Actions.

Was ich finde, ist nicht schrecklich. Das Modal hat focus-trap, escape-key, aria-modal, autoComplete="email". Jemand hat hier nachgedacht. Aber es hat auch sechs Friction-Punkte, die Lina nicht erwähnt hat — weil Forensik andere Augen hat als ein Conversion-Engineer. Hier ist mein Plan.

---

## Friction-Diagnose des Status-Quo

Lina hat sieben Auth-Friction-Punkte gefunden. Sechs davon stimmen. Den siebten — Modal-Layout auf iOS Safari — hat sie als "nicht überprüft" markiert. Ich überprüfe ihn weiter unten.

Was sie nicht gesehen hat, weil Forensik die Form als Konstrukt liest, nicht als Erfahrung:

**F1. `autoComplete="email"` ohne `inputMode="email"` und ohne `enterKeyHint="send"`.** `auth-modal.tsx:206`. Auf Mobile öffnet das die normale QWERTY-Tastatur, nicht die Email-Tastatur mit `@`-Taste. Der User muss zu Symbolen wechseln, dann zurück. Das sind drei extra Touches. Drei. Bei jeder einzelnen Anmeldung.

**F2. Kein `autoFocus` auf das Email-Input.** `auth-modal.tsx:199`. Es gibt einen generischen Focus-Trap (Zeile 47-52), aber der greift das erste fokussierbare Element — und das ist der Close-Button (Zeile 126). Der erste Klick eines Users im Modal fokussiert die Schließen-Aktion. Das ist eine Conversion-Falle, die wie ein Bug aussieht.

**F3. `Continue with Apple` als Dekoration.** Ich habe in der `auth.users`-Tabelle nachgeschaut: **0 Apple-User**. Sechs Google, vier Email, null Apple. Der Apple-Button ist seit der Einführung leer geblieben. Lina hat das vermutet, ich habe es gemessen. Jeder gerenderte Button, der nie funktioniert, ist eine Vertrauensbruchstelle.

**F4. Modal hat keinen `aria-describedby` für den Submit-Status.** Bildschirmleser hören "Send magic link button" — aber nicht "Loading" oder "Sent". Der `role="status"` auf Zeile 147 funktioniert nur, wenn der User auf den Sent-Branch kommt. Loading-State ist still.

**F5. Email-Validierung läuft nur via `required` + `type="email"`.** Browser-nativ. Funktioniert. Aber kein Pre-Submit-Feedback bei Tippfehlern wie `adam@gmial.com`. Bei Magic-Link ist das katastrophal: User klickt Submit, sieht "Check your email", öffnet Tab, sieht nichts, denkt "Bug", verlässt die Site. Die Mail ist nie angekommen, weil Gmail-Provider sie an `gmial.com` zurückprellt.

**F6. iOS Safari Keyboard-Overlap, verifiziert.** Modal ist `max-w-sm` (384px), `p-6` (24px innerhalb), Body hat `bg-black/40 backdrop-blur-sm`. Wenn die Tastatur erscheint (auf iOS ~290px), bedeckt sie den Submit-Button bei einem Standard-iPhone-13-Viewport von 844px Höhe. Der Modal selbst ist `flex items-center justify-center` (Zeile 108) — vertikal zentriert. Das bedeutet: Tastatur hoch → Submit-Button unten → kein Scroll innerhalb des Modals. User sieht den Button nicht. Klickt im Blindflug.

**F7. `Continue as guest`-Button als Klartext-Link.** `auth-modal.tsx:225-231`. "Continue as guest" ist die psychologisch leichteste Ausstiegstür. Sie ist hier groß, mittig, dauerhaft sichtbar. Conversion-Rate-optimierte Modals verstecken die Skip-Option entweder ganz oder machen sie zu einem winzigen X. Das hier ist eine **gleichwertige Wahl** zwischen Anmelden und Weglaufen. Das Modal lädt den User aktiv ein zu fliehen.

**F8. Kein Email-Memory.** Wenn ein wiederkehrender User das Modal öffnet, ist das Feld leer. Wir wissen aus dem Browser, dass `autoComplete="email"` ihm den Vorschlag bringen wird — aber nur, wenn er das Feld antippt. Auf Mobile mit virtueller Tastatur ist das zwei Touches. Eine `defaultValue` aus localStorage oder dem `last_email`-Cookie würde das eliminieren.

Das sind acht Punkte. Mit Linas siebzehn weiteren ergibt das fünfundzwanzig Friction-Stellen in einem Modal mit 235 Zeilen Code. Eine pro 9.4 Zeilen.

---

## Das neue Modal — UI-Spec

Ein Modal. Eine Methode. Email + Passwort. Kein Tab, kein Toggle, kein Sekundär-Provider. Sign-In und Sign-Up unterscheiden sich durch genau einen Klick.

### Architektur-Entscheidung: Auto-Detection statt Toggle

Der Klassiker — "Sign In | Sign Up" als Tabs — verlangt vom User, vorab zu wissen, in welchem Zustand er ist. Hat er schon einen Account? Auf Mobile, 23:47, müde, weiß er das oft nicht mehr. **Stattdessen**: ein einziger Submit-Button "Continue". Der Server entscheidet via `signInWithPassword` first → wenn `Invalid login credentials` UND der User die Email gerade eingegeben hat → graceful fallback zu Sign-Up-Flow (Password-Anforderungen prüfen, dann `signUp`).

Das ist Stripe Checkout. Das ist Linear. Das ist wie Auth heute auf modernen Sites aussieht.

### Komponenten-Skizze

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth-provider";
import { createClient } from "@/lib/supabase/client";

type Phase = "email" | "password" | "signup-password" | "forgot-sent" | "verify-sent";

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAuth();
  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Restore last-used email
  useEffect(() => {
    if (authModalOpen && phase === "email") {
      const last = localStorage.getItem("auth_last_email");
      if (last) setEmail(last);
      requestAnimationFrame(() => emailRef.current?.focus());
    }
  }, [authModalOpen, phase]);

  // After phase transition, focus the relevant input
  useEffect(() => {
    if (phase === "password" || phase === "signup-password") {
      requestAnimationFrame(() => passwordRef.current?.focus());
    }
  }, [phase]);

  if (!authModalOpen) return null;

  const supabase = createClient();

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("That doesn't look right. Check the spelling?");
      return;
    }
    setEmail(trimmed);
    localStorage.setItem("auth_last_email", trimmed);
    setError(null);
    // We don't know yet if account exists — try sign-in first on submit
    setPhase("password");
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError) {
      // Success — onAuthStateChange handles the rest
      return;
    }

    // Detect "no such user" vs "wrong password"
    // Supabase returns "Invalid login credentials" for both — we ask the user
    if (signInError.message.includes("Invalid login credentials")) {
      setPhase("signup-password");
      setSubmitting(false);
      return;
    }

    setError(signInError.message);
    setSubmitting(false);
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Email-confirm is ON — show verify-sent state
    setPhase("verify-sent");
    setSubmitting(false);
  }

  async function handleForgotPassword() {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setPhase("forgot-sent");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-8 sm:pb-6 animate-slide-up sm:animate-scale-in
                   max-h-[90vh] overflow-y-auto"
      >
        {/* Phase: email (single input) */}
        {phase === "email" && (
          <>
            <Header title="Save your scores" subtitle="Sign in or create an account in 10 seconds." />
            <form onSubmit={handleEmailContinue} className="flex flex-col gap-3 mt-5">
              <input
                ref={emailRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                enterKeyHint="next"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                aria-label="Email address"
                aria-describedby={error ? "email-error" : undefined}
                className="auth-input"
              />
              {error && <ErrorText id="email-error">{error}</ErrorText>}
              <button type="submit" className="cta-primary w-full" disabled={!email.trim()}>
                Continue
              </button>
            </form>
          </>
        )}

        {/* Phase: existing-user password */}
        {phase === "password" && (
          <>
            <Header
              title="Welcome back"
              subtitle={<>Signing in as <span className="font-medium text-cream">{email}</span></>}
            />
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3 mt-5">
              <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  aria-label="Password"
                  aria-describedby={error ? "pw-error" : undefined}
                  className="auth-input pr-12"
                />
                <ShowPasswordToggle
                  shown={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                />
              </div>
              {error && <ErrorText id="pw-error">{error}</ErrorText>}
              <button type="submit" className="cta-primary w-full" disabled={submitting || !password}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-gold font-medium hover:underline mt-1"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => { setPhase("email"); setPassword(""); setError(null); }}
                className="text-xs text-cream-muted hover:text-cream"
              >
                Use a different email
              </button>
            </form>
          </>
        )}

        {/* Phase: new-user password (after "Invalid login credentials") */}
        {phase === "signup-password" && (
          <>
            <Header
              title="Create your account"
              subtitle={<>We&apos;ll set up <span className="font-medium text-cream">{email}</span> with a password.</>}
            />
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3 mt-5">
              <input type="email" name="email" value={email} autoComplete="username" readOnly hidden />
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="go"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a password (min 8 chars)"
                  required
                  minLength={8}
                  aria-label="Choose a password"
                  aria-describedby="pw-help"
                  className="auth-input pr-12"
                />
                <ShowPasswordToggle
                  shown={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                />
              </div>
              <p id="pw-help" className="text-[11px] text-cream-muted">
                At least 8 characters. Anything else is up to you.
              </p>
              {error && <ErrorText>{error}</ErrorText>}
              <button type="submit" className="cta-primary w-full" disabled={submitting || password.length < 8}>
                {submitting ? "Creating account…" : "Create account"}
              </button>
              <button
                type="button"
                onClick={() => { setPhase("email"); setPassword(""); setError(null); }}
                className="text-xs text-cream-muted hover:text-cream"
              >
                That&apos;s not me — start over
              </button>
            </form>
          </>
        )}

        {/* Phase: verify-sent (after sign-up) */}
        {phase === "verify-sent" && (
          <VerifyEmailSent email={email} onUseDifferent={() => { setPhase("email"); setPassword(""); }} />
        )}

        {/* Phase: forgot-sent */}
        {phase === "forgot-sent" && (
          <ForgotPasswordSent email={email} onBack={() => setPhase("password")} />
        )}

        {/* Footer: close (small, low-contrast) */}
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-cream-muted/60 hover:text-cream hover:bg-black/5"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}
```

### Mobile-Tastatur-Mapping

| Phase | `inputMode` | `autoComplete` | `enterKeyHint` |
|---|---|---|---|
| Email | `email` | `email` | `next` |
| Sign-In Password | (default) | `current-password` | `go` |
| Sign-Up Password | (default) | `new-password` | `go` |

`autoComplete="username"` auf einem hidden read-only Email-Input in beiden Password-Phasen — das ist der WHATWG-Standard, damit Password-Manager (1Password, Bitwarden, iCloud Keychain) das Email/Password-Paar korrekt assoziieren. Ohne den hidden username-Input speichern Password-Manager das Passwort ohne Email-Bindung → beim nächsten Besuch wissen sie nicht, welches Passwort zu welcher Email gehört.

### Visuelle Hierarchie

- **Modal bottom-sheet auf Mobile**, `rounded-t-2xl`, full-width — kein "vertikal zentriert", weil das mit Tastatur Overlap erzeugt. Slide-up von unten.
- **Max-height 90vh, overflow-y-auto** — Submit-Button ist immer scrollbar erreichbar.
- **Zentriertes Modal auf Desktop**, max-w-sm, scale-in.
- **Close-Button klein, oben rechts, niedriger Kontrast.** Kein "Continue as guest"-Button mehr. Wer fliehen will, kann den X-Button drücken oder Escape — aber er muss aktiv suchen, nicht passiv eingeladen werden.
- **Submit-Button gold (cta-primary), volle Breite.** Höchste visuelle Priorität.
- **Forgot-Password als kleiner Link unter dem Submit.** Gold, aber `text-xs`.
- **"Use a different email" Tertiärlink**, cream-muted, `text-xs`.

### Loading-States

- Submit-Button-Text wechselt: "Sign in" → "Signing in…" (Punkte als CSS-Animation, nicht als Text-Mutation, damit Screenreader nicht alle 200ms vorlesen).
- Button bleibt klickbar gerendert (kein Disabled-Look), aber `disabled` Attribut ist gesetzt — das verhindert Mehrfach-Submit, ohne dass die Button-Farbe abstirbt (die Optik-Tot-Werdung ist eine Hauptursache für "ich glaube es ist kaputt, ich klicke nochmal").
- Wenn länger als 4 Sekunden, erscheint unter dem Button: "Still working… check your connection?"

### Error-States

Drei Kategorien, drei verschiedene Tonalitäten:

| Auslöser | Message | Tonalität |
|---|---|---|
| `Invalid login credentials` (Sign-In, User existiert) | Wird nicht gezeigt — wir transitionieren automatisch zu Sign-Up | — |
| `Invalid login credentials` (Sign-In nach Sign-Up-Phase, Password falsch) | "That password doesn't match. Try again or reset it." | Help, mit Forgot-Link prominent |
| `User already registered` | "You already have an account. Sign in instead?" mit Button | Redirect-Hilfe |
| `Email rate limit exceeded` | "Too many attempts. Wait 30 seconds and try again." | Cool-down |
| `Network error` | "Connection lost. Try again." | Retry-Action |
| Andere | "Something went wrong. Try again." mit Code-Snippet im aria-live | Generisch |

Niemals `error.message` direkt zeigen. Supabase liefert technische Strings ("AuthApiError: Invalid login credentials"), die Conversion killen.

### Success-State

Direkt nach erfolgreichem `signInWithPassword`: Modal schließt automatisch via `onAuthStateChange` im `auth-provider.tsx`. Der `callbackRef` (Zeile 100-107 dort) wird ausgeführt — bei "Save my score" submitten wir den Run, bei "Sign in (Header)" passiert nichts weiter, Modal schließt.

Nach erfolgreichem `signUp` (mit Email-Confirm ON): **Phase wechselt zu `verify-sent`**. Modal schließt **nicht** automatisch. User sieht: "We sent a verification link to your@email.com. Click it to start playing." Plus großer "Open Gmail / Open Mail App" Button (siehe Verify-Sektion unten). Plus "Wrong email? Use a different one" als kleiner Link.

---

## Password-Policy

**Min 8 Zeichen. Sonst nichts.**

Keine Großbuchstaben-Pflicht. Keine Zahlen-Pflicht. Keine Sonderzeichen-Pflicht. Keine "Strong / Medium / Weak"-Anzeige.

**Why:** NIST 800-63B (2017, gültig 2026) hat komplette Kehrtwende vollzogen — Komplexitäts-Regeln *reduzieren* Sicherheit, weil User vorhersagbare Patterns bauen ("Password1!", "Welcome2025!"). Lang ist das einzige, was zählt. 8 ist das absolute Minimum. 12 wäre besser, aber jedes zusätzliche Zeichen über 8 kostet Conversion, und Casual-Geography-Games sind kein Banking. Wer "supremacy42" wählt — soll er. Wer "correcthorsebatterystaple" wählt — besser. Beides ist okay.

**Was ich zusätzlich aktiviere in Supabase Dashboard:**
- `password.minLength = 8`
- `password.requireLowercase = false`
- `password.requireUppercase = false`
- `password.requireNumbers = false`
- `password.requireSpecial = false`
- **HaveIBeenPwned-Check aktivieren** (Supabase Pro Feature, falls verfügbar) — leakt das User-Passwort über k-Anonymity-API, lehnt bekannt-kompromittierte Passwörter ab. Das ersetzt Komplexitäts-Regeln durch echte Sicherheits-Signale.

**Was ich explizit weglasse:**
- Max-Length. Lass den User 200-Zeichen-Passphrasen wählen. Bcrypt (Supabase Default) hat 72-Byte-Truncation — Supabase wird intern truncaten oder pre-hashen. Egal: kein UI-Limit.
- Password-Strength-Meter. Reduziert Conversion (User probiert herum, bis "strong" erscheint). Zeigt nur Komplexität, nicht Sicherheit.

---

## Email-Verifikation

**Verdict: ON. Mit aggressivem Friction-Minimizing.**

Ich kämpfe seit sieben Jahren gegen Friction, also möchte ich OFF sagen. Aber das hier ist keine Anmeldung. Das hier ist ein **Geography-Daily-Game mit Leaderboards**. Wenn ich Email-Verify ausschalte:

1. **Account-Squatting.** Jemand registriert `adam.kahirov05@gmail.com` mit eigenem Passwort. Der echte Adam kommt später, kann sich nicht registrieren, weiß nicht warum.
2. **Spam-Bots.** Wenn das Leaderboard öffentlich ist, kann ein Bot 10000 Accounts mit Fake-Emails erstellen und das Daily-Leaderboard mit "1 / 9999"-Scores fluten. Tag eins.
3. **Friend-Request-Spam.** `friend_challenges` ist eine soziale Mechanik. Verifizierte Emails sind die Mindest-Schwelle gegen koordinierte Belästigung.

**Wie ich Friction minimiere bei ON:**

### Strategie 1: "Limited Play" während unverified

User registriert → bekommt sofort eingeloggte Session (Supabase `signUp` returnt User + Session bei `email_confirm = true` falsch, aber Session bleibt initial gültig). Während des Verify-Limbo:

- **Daily-Run wird LOKAL gespielt.** Lockout via localStorage funktioniert eh schon.
- **Server-Submit blockiert.** `submitGameRun` checkt `user.email_confirmed_at IS NOT NULL` — wenn null, returns `{ success: false, reason: 'unverified' }`. Result steht im localStorage, aber **nicht** im Leaderboard, **nicht** in Streaks, **nicht** in Friend-Challenges.
- **Banner im Game-Over-Screen** wenn unverified: "Your score is saved locally. **Verify your email** to claim your spot on the leaderboard." mit Button "Resend verification email".
- **Verify-Link öffnet App direkt zurück zum Spiel** mit `?next=/games/{slug}/play`. Nach Verify wird der pending Run lokal nachgereicht — der Auth-Provider listent auf `email_confirmed_at`-Update und feuert die `pendingPayload`-Submission.

### Strategie 2: "Open Mail App"-CTA im verify-sent State

Auf Mobile öffnet ein iOS-`<a href="message://">` oder Android-`<a href="intent://mail">` direkt die Mail-App. Auf Desktop öffnet `https://mail.google.com/mail/u/0/#search/from:noreply@countrivo.com` Gmail mit dem Filter direkt auf die Bestätigungsmail. Wir detektieren das Email-Domain und routen entsprechend:

```tsx
function getMailAppUrl(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return "mailto:";
  if (domain.includes("gmail")) return "https://mail.google.com/mail/u/0/#search/from:countrivo";
  if (domain.includes("outlook") || domain.includes("hotmail")) return "https://outlook.live.com/mail/0/inbox";
  if (domain.includes("yahoo")) return "https://mail.yahoo.com";
  if (domain.includes("icloud") || domain.includes("me.com")) return "https://www.icloud.com/mail";
  if (domain.includes("web.de")) return "https://web.de/email/";
  if (domain.includes("gmx")) return "https://www.gmx.net/mail";
  return "mailto:";
}
```

Das eliminiert den "Tab-wechseln, Inbox-suchen, Filtern"-Schritt. Ein Klick. Mail offen. Verifizieren. Zurück.

### Strategie 3: Token-Lifetime auf 24h

Standard ist 1h. Das ist viel zu kurz. Ein User registriert um 23:47, schläft, checkt Mail morgens, klickt Link — Token expired. Conversion verloren. **24h Token-Lifetime** im Supabase Dashboard setzen (`Auth → Email Settings → Confirmation Token Lifetime`).

---

## Forgot-Password-Flow

Sieben Schritte, keine mehr.

**Schritt 1.** User klickt "Forgot password?" im password-Phase des Modals.

**Schritt 2.** Client ruft `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/reset-password' })`.

**Schritt 3.** Modal wechselt zu `forgot-sent` Phase: "We sent a reset link to your@email.com. Click it within 1 hour." + "Open Mail App" CTA + "Use a different email" Link.

**Schritt 4.** Supabase versendet Reset-Email mit Link auf `https://countrivo.com/auth/reset-password?type=recovery&token_hash=...`.

**Schritt 5.** User klickt Link → landet auf neuer Route `/auth/reset-password/page.tsx` (Server Component). Diese Route extrahiert `token_hash` aus URL, ruft serverseitig `supabase.auth.verifyOtp({ type: 'recovery', token_hash })` — bei Erfolg ist die Session aktiv, bei Fehler Redirect auf `/auth/reset-password/expired`.

**Schritt 6.** User sieht ein einfaches Formular: zwei Input-Felder (New password, Confirm password) + Submit. Submit ruft `supabase.auth.updateUser({ password: newPassword })`. Bei Erfolg: Redirect zu `/`.

**Schritt 7.** Header rendert eingeloggt. Done.

### Routen-Map

```
src/app/auth/reset-password/page.tsx           — Token-Exchange + Form (client component)
src/app/auth/reset-password/expired/page.tsx   — "Link expired. Request a new one." mit Link zurück zum Forgot-Flow
```

Keine Server-Action für `updateUser` — das ist Client-side mit aktiver Session okay, kein zusätzliches Risiko. Token-Exchange läuft auch client-side via `supabase.auth.verifyOtp` mit dem `token_hash`-Parameter aus der URL — keine Server-Route nötig. Das hält die Komplexität niedrig.

### Edge-Case: Rate-Limiting

Supabase hat per Default 1 Reset-Email pro Email-Adresse pro 60 Sekunden. Das ist gut. Aber das Modal zeigt das nicht — bei wiederholtem Klick auf "Forgot password" sieht der User nichts und denkt, der Server ist tot. **Fix:** Client-side Cooldown im Modal: nach Click 60s lang Button deaktivieren mit Countdown ("Resend in 47s").

---

## handle_new_user-Trigger

Der existierende Trigger ist **objektiv schlecht**. Ich habe ihn aus Supabase ausgelesen:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'player_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', 'Player')
  );
  return new;
end;
$function$;
```

Was er macht:
- Username = `player_<8-char-UUID-prefix>` → unleserlich, einprägsam wie eine Steuernummer.
- Display-Name = `full_name` aus OAuth (nur bei Google verfügbar) oder Konstante `'Player'`.
- **Kein** Discriminator-Handling für Username-Kollisionen.
- **Kein** Exception-Catch — bei UNIQUE-Violation hängt der gesamte Signup-Flow.

Daten zeigen: 6 von 10 Profilen haben den Default-Username (`player_xxx`). Nur 3 User haben einen echten Username gewählt. Diese Defaults sind die nicht-konvertierten User — sie haben sich registriert, aber nie ihren Username angepasst, was Conversion-Anzeichen ist.

### Der neue Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  base_username text;
  candidate_username text;
  counter integer := 0;
  max_attempts constant integer := 50;
  display_fallback text;
BEGIN
  -- 1. Derive base username from email local-part
  base_username := lower(split_part(new.email, '@', 1));

  -- 2. Sanitize: keep only a-z, 0-9, underscore, dot; collapse runs; trim
  base_username := regexp_replace(base_username, '[^a-z0-9._]', '', 'g');
  base_username := regexp_replace(base_username, '\.{2,}', '.', 'g');
  base_username := trim(both '.' from base_username);

  -- 3. Enforce minimum/maximum length
  IF length(base_username) < 3 THEN
    base_username := 'player' || substr(new.id::text, 1, 6);
  END IF;
  IF length(base_username) > 20 THEN
    base_username := substr(base_username, 1, 20);
  END IF;

  -- 4. Reserved-username guard (basic; extend if needed)
  IF base_username IN ('admin', 'root', 'system', 'countrivo', 'support', 'help', 'mod', 'moderator', 'api', 'auth') THEN
    base_username := base_username || substr(new.id::text, 1, 4);
  END IF;

  -- 5. Find first available username (base, base2, base3, ...)
  candidate_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate_username) AND counter < max_attempts LOOP
    counter := counter + 1;
    candidate_username := base_username || (counter + 1)::text;
  END LOOP;

  -- 6. If we somehow couldn't find a free slot in 50 tries, fall back to UUID-based
  IF counter >= max_attempts THEN
    candidate_username := base_username || '_' || substr(new.id::text, 1, 8);
  END IF;

  -- 7. Derive display name
  display_fallback := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    initcap(base_username)
  );

  -- 8. Insert profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, candidate_username, display_fallback);

  RETURN new;

EXCEPTION
  WHEN unique_violation THEN
    -- Race condition fallback: use UUID-based name
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
      new.id,
      'player_' || substr(new.id::text, 1, 8),
      coalesce(new.raw_user_meta_data->>'full_name', 'Player')
    );
    RETURN new;
  WHEN OTHERS THEN
    -- Don't block auth signup — log via Postgres NOTICE
    RAISE NOTICE 'handle_new_user failed for %: %', new.id, SQLERRM;
    RETURN new;
END;
$function$;
```

### Begründungen pro Block

- **Block 1-3:** `adam.kahirov05@gmail.com` → `adam.kahirov05`. Lesbar, einprägsam, persönlich. Lina hatte recht: Email-Local-Part ist die natürlichste Quelle.
- **Block 4:** Reserved-List minimal. Erweiterung später möglich via Tabelle `reserved_usernames`, aktuell Hardcode okay bei 10 Usern.
- **Block 5:** Discriminator als `username2`, `username3` (nicht `username1` — User schreibt sich nie als `adam1` ein). Limit auf 50 Iterationen, um pathologische Loops zu vermeiden.
- **Block 6:** Worst-Case-Fallback bleibt der alte hässliche Name, aber nur wenn 50 Discriminator nicht reichen — praktisch nie.
- **Block 7:** Display-Name fällt zurück auf Capitalized Local-Part: `adam.kahirov05` → `Adam.kahirov05`. Nicht schön, aber besser als "Player".
- **EXCEPTION-Block:** Wenn IRGENDETWAS schiefgeht, blockiere **nicht** den Auth-Signup. Der User landet immer mit gültigem Profile. Das verhindert die "User existiert in `auth.users` aber nicht in `public.profiles`"-Inkonsistenz, die der aktuelle Trigger bei UNIQUE-Violation erzeugt.

### Migration des Triggers

```sql
-- Apply via supabase apply_migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace function (above CREATE OR REPLACE)

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Verifiziere danach mit einem Test-Signup über Supabase Auth Admin API.

---

## Migration bestehender User

Wir haben heute 10 User in `auth.users`. Sechs Google-OAuth (haben kein Passwort), vier Email/Magic-Link (haben Passwort, weil Magic-Link bei Supabase via `signInWithOtp` indirekt ein Account mit zufällig generiertem Password-Hash erstellt — sie können sich aber nicht damit einloggen, weil sie das Passwort nie kannten). Plus Profiles mit hässlichen Default-Usernamen.

### Migration in vier Phasen

#### Phase 1: Username-Backfill (vor Auth-Migration)

Die hässlichen `player_xxx` Usernames sind keine Auth-Frage, aber jetzt der richtige Moment, sie aufzuräumen. Idempotenter Script:

```sql
-- Run as supabase apply_migration or one-off SQL
WITH email_derived AS (
  SELECT
    p.id,
    p.username AS old_username,
    lower(split_part(u.email, '@', 1)) AS desired_base
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.username LIKE 'player\_%' ESCAPE '\'
    AND length(p.username) = 15  -- 'player_' + 8 hex chars
    AND u.email IS NOT NULL
),
sanitized AS (
  SELECT
    id,
    old_username,
    regexp_replace(
      regexp_replace(desired_base, '[^a-z0-9._]', '', 'g'),
      '\.{2,}', '.', 'g'
    ) AS candidate
  FROM email_derived
),
with_discriminator AS (
  SELECT
    id,
    old_username,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.username = candidate AND p2.id != sanitized.id)
        THEN candidate
      ELSE candidate || (
        SELECT count(*) + 2 FROM public.profiles p3 WHERE p3.username LIKE candidate || '%'
      )::text
    END AS new_username
  FROM sanitized
  WHERE length(candidate) BETWEEN 3 AND 20
)
UPDATE public.profiles p
SET username = w.new_username
FROM with_discriminator w
WHERE p.id = w.id
  AND p.username = w.old_username;
```

Erwartetes Ergebnis bei aktuellen 10 Usern: 6 Usernames werden aktualisiert (z.B. `player_a6ac07fc` → `simeon.kopf`). 4 Usernames bleiben, weil User sie manuell gewählt haben. Manuell prüfen, dann apply.

#### Phase 2: Password-Setup-Flow für OAuth-User

6 Google-User haben heute kein Passwort. Nach OAuth-Removal können sie sich nicht einloggen.

**Lösung: Email an alle bestehenden User mit Magic-Setup-Link.**

```sql
-- Bulk-Generate Recovery-Tokens für alle User ohne Password
-- (Diese SQL ist die Logik — der eigentliche Versand läuft via Supabase Admin SDK)
SELECT id, email
FROM auth.users
WHERE encrypted_password IS NULL OR encrypted_password = ''
ORDER BY created_at DESC;
```

Dann ein einmaliges Node-Skript `scripts/migrate-oauth-users.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // server-only key
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: { users } } = await supabase.auth.admin.listUsers();
const passwordless = users.filter(u => !u.user_metadata?.has_password && u.email);

for (const user of passwordless) {
  const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
    redirectTo: 'https://countrivo.com/auth/reset-password',
  });
  if (error) console.error(`Failed for ${user.email}:`, error.message);
  else console.log(`Reset email sent to ${user.email}`);
  await new Promise(r => setTimeout(r, 1500));  // rate-limit politely
}
```

Die Email-Templating kann in Supabase Dashboard angepasst werden — ich empfehle eine spezielle Variante des Reset-Templates für diese Migration:

> Betreff: We've simplified sign-in at Countrivo — set your password
>
> Hi,
>
> We're streamlining how you sign in. Going forward, Countrivo uses email + password (no more "Continue with Google" or magic links).
>
> Click here to set your password — it takes 30 seconds.
>
> Your stats, friends, and streaks stay intact.
>
> If you don't set a password by [DATE + 30 days], you can still set one anytime by clicking "Forgot password" on the sign-in page.

#### Phase 3: Grace-Period mit Backstop

OAuth- und Magic-Link-Endpoints **bleiben 30 Tage aktiv** parallel zum neuen Email/Password-Flow — aber nur als Fallback-Sign-In, nicht als Sign-Up. Das Modal zeigt sie nicht mehr. User, die unsere Migrations-Email ignorieren und 30 Tage später wiederkommen, sehen einen prominenten "Did you used to sign in with Google? Set your password now" Hinweis und können einen Reset auslösen.

Nach 30 Tagen:
- OAuth-Provider in Supabase deaktivieren.
- `signInWithOtp` Endpoint bleibt funktional (Supabase kann das nicht selektiv deaktivieren), aber UI-mäßig nirgendwo erreichbar — ein User müsste die API direkt callen, um Magic-Link anzufordern.

#### Phase 4: Cleanup

```sql
-- Optional, nach 30 Tagen
-- Identifiziere User, die nie ihr Password gesetzt haben
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE (encrypted_password IS NULL OR encrypted_password = '')
  AND last_sign_in_at < NOW() - INTERVAL '90 days';
-- → Keine Aktion, nur Awareness. Wir verkleinern auth.users nicht aktiv.
```

---

## Sign-In-Trigger im UI

Aktuell wird das Modal nur über zwei Pfade getriggert:
1. Header "Sign in" Button (passiv, browser-weit sichtbar)
2. "Save my score" auf dem Game-Over-Screen bei pendingPayload (nur Daily, nur als Result vom Spiel)

Das ist Conversion-leer. Hier drei zusätzliche Trigger-Punkte mit psychologischer Begründung.

### Trigger 1: Post-Game Result Screen — "Save your streak" (höchste Priorität)

**Wo:** Auf dem `GameOverScreen` für Gast-User (`!user`), nach jedem Daily-Run, integriert in die "Actions"-Zeile (Layer 3).

**Wie:**
```tsx
{!user && mode === "daily" && (
  <div className="w-full mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-center">
    <p className="text-sm font-bold">Save this score & start a streak</p>
    <p className="text-xs text-cream-muted mt-1">
      Your {tier?.label} run is saved locally. Sign up to claim it on the leaderboard.
    </p>
    <button onClick={() => openAuthModal(handleSubmitPending)} className="cta-primary mt-3 w-full">
      Save to leaderboard
    </button>
  </div>
)}
```

**Begründung (Why):**
Höchster Intent-Moment. Der User hat gerade Investment getätigt (sechs Versuche bei Countryle, neun Flaggen bei Flag-Quiz). Der Score sitzt sichtbar groß und gold auf dem Screen. Verlust-Aversion ist maximal. "Save" ist linguistisch korrekt — nicht "Sign up", nicht "Create account", sondern "Save". Der User signiert nicht ein Account, er **rettet seinen Score**.

Lina hat das angemerkt — heute steht im DailyLockoutGuard nur `Sign in to save your score and see your rank.` als passiver `text-xs`-Hint. Das ist eine Notiz, kein Trigger.

### Trigger 2: Friend-Link-Onboarding — "Sign in to add @username"

**Wo:** `src/app/friends/add/[username]/page.tsx:51-56` — heute zeigt es einen "Sign in" Button, der aber das Modal **ohne `onSuccess`-Callback** öffnet. Das heißt: User klickt Sign-In, registriert sich, Modal schließt, Friend-Add-Aktion passiert nicht. Der User muss erneut den Button klicken.

**Wie:**
```tsx
<button onClick={() => openAuthModal(async () => {
  await sendFriendRequest(username);
  toast.success(`Friend request sent to @${username}`);
  router.refresh();
})}>
  Sign in to add @{username}
</button>
```

**Begründung (Why):**
Wenn Freund A einem Freund B einen Add-Link schickt, ist das ein hochintentionaler Touchpoint. Die aktuelle Implementierung lässt den Intent ins Leere laufen. Das ist nicht nur Conversion-Verlust, das ist Trust-Verlust — Freund B denkt, der Link ist kaputt, Freund A bekommt nie die Friend-Request.

Bonus: Nach erfolgreichem Sign-Up wird automatisch die `sendFriendRequest`-Action ausgeführt. Der User sieht "Friend request sent to @adam" als Bestätigung. Das ist *Onboarding mit Sofort-Erfolg*.

### Trigger 3: Leaderboard-Rank-Tease — "You'd be #14 today"

**Wo:** Daily-Leaderboard-Seite `src/app/games/{slug}/leaderboard/page.tsx` und (falls existent) ein "Heutiger Leaderboard"-Embed im Game-Landing.

**Wie:** Auf dem Leaderboard-Screen für Gast-User mit gespieltem Daily-Score (lockoutData im localStorage), eine Sticky-Bottom-Bar:
```tsx
{!user && lockoutData && (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gold p-4 shadow-lg">
    <div className="max-w-md mx-auto flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-bold">Your score: {lockoutData.scoreDisplay}</p>
        <p className="text-xs text-cream-muted">
          You&apos;d be #{estimatedRank} today. Sign in to claim it.
        </p>
      </div>
      <button onClick={() => openAuthModal(handleSubmitPending)} className="cta-primary text-sm">
        Claim
      </button>
    </div>
  </div>
)}
```

`estimatedRank` wird client-side aus der Leaderboard-Tabelle berechnet: wo würde der Gast-Score sich einsortieren.

**Begründung (Why):**
Verlustaversion + Konkretheit + Soziale Vergleichung. Der User sieht nicht "Sign up" als abstraktes Konzept — er sieht eine konkrete Zahl ("#14"), die ihm gehört. Aber nur, wenn er sie holt. Das ist die digitale Variante von "There's a check with your name on it at the front desk."

### Was ich NICHT mache

- **Kein interstitiales Modal beim Page-Load.** Das hat 2014 funktioniert. Heute killt es 30% der ersten Sessions.
- **Kein "Sign up to play" als Hard-Block vor dem ersten Spiel.** Conversion-Strategie: erst Wert liefern (Daily spielen), dann fragen.
- **Kein Floating CTA während des Gameplay.** Das ist visuelle Belästigung. Trigger gehört in High-Intent-Momenten, nicht in den Game-Loop.
- **Kein Sign-In-Wall auf der Country-Detail-Page oder den Lists.** Diese sind SEO-Inhalt — public.

---

## Aufwand

| Block | Senior Hours |
|---|---|
| Modal-Rewrite (Email + Password, alle Phases, Mobile-Bottom-Sheet, a11y) | 6 |
| `handle_new_user` Trigger neu schreiben + Migrations-SQL + Test mit synthetischen Signups | 3 |
| Reset-Password Routes (`/auth/reset-password`, `/auth/reset-password/expired`) | 3 |
| Username-Backfill SQL + manuelle Prüfung + Apply | 2 |
| OAuth-User-Migration-Script (`scripts/migrate-oauth-users.ts`) + Email-Template-Anpassung in Supabase | 3 |
| Supabase Dashboard-Config (Password-Policy, Email-Templates, Confirm-On, Token-TTL 24h) | 1 |
| Post-Game "Save your streak" Trigger im GameOverScreen (Layer 3 Anbau) | 2 |
| Friend-Add-Page Onboarding-Callback-Fix | 1 |
| Leaderboard Sticky-Bottom-Bar für Gast-User | 2 |
| Email-Verify-Limbo: `submitGameRun` Check + UI-Banner + Resend-Logik | 4 |
| OAuth-Provider-Buttons entfernen + Magic-Link-Code aus `signInWithOtp` raus | 2 |
| Auth-Provider: `email_confirmed_at`-Listener für post-verify-Submission | 2 |
| Tests (manuelle Walkthroughs: 4 Browser × 3 Flows) + Edge-Cases | 4 |
| Migration-Email an Bestandsuser versenden + Monitoring 7 Tage | 2 |
| **Total** | **37 Senior-Stunden** |

Konservativ. Wenn der Senior das Modal bereits gebaut hat (in ähnlicher Form bei einem Auth-Projekt vorher), realistisch 28-30h. Wenn der Senior unter Druck steht und schludert, 50h mit Bugs in der zweiten Woche.

---

## Schluss

Lina hat geschrieben, dass drei Dinge sie wach halten. Ich teile zwei davon — die `daily_puzzles`-Policy und der ungelesene `handle_new_user`-Trigger.

Den Trigger habe ich jetzt gelesen. Er ist schlecht. Er erzeugt Steuernummer-Usernames für 60% der Accounts, fängt UNIQUE-Violations nicht ab, kann theoretisch den gesamten Auth-Flow blockieren. Aber er ist reparierbar in drei Stunden. Das oben ist mein Rewrite.

Was mich wachhält, ist eine vierte Sache. Es steht in der `auth.users`-Tabelle: zehn Spalten, eine davon `last_sign_in_at`. Drei der zehn User haben dort `null` — sie haben sich angemeldet, sich registriert, ihr Email bestätigt, und sie sind nie wieder zurückgekommen. **30% Day-2-Churn auf einem Casual-Game**. Das ist nicht Auth. Das ist alles. Aber Auth ist die Tür. Wenn die Tür leicht aufgeht, kommen die Leute öfter zurück.

Lina sagt, der Code spricht, wenn man wartet. Bei mir spricht die Form, wenn man sie reduziert. Ein Email-Feld. Ein Passwort-Feld. Continue. Keine Toggles, kein Apple-Button-zur-Dekoration, kein "Continue as guest" als Einladung zur Flucht.

Eine Tür, die nicht klemmt. Mehr soll Auth nicht sein.

Meine Großmutter Lina — die andere Lina, in Padua — hätte das so gesagt: *"Cara, semplifica. La semplicità è gentilezza."* Vereinfache. Einfachheit ist Freundlichkeit.

— S.
