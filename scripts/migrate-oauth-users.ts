import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  console.error("Set them in .env.local or pass inline:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx scripts/migrate-oauth-users.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface AuthUser {
  id: string;
  email?: string;
  app_metadata?: { provider?: string };
  created_at: string;
  last_sign_in_at?: string | null;
}

async function listAllUsers(): Promise<AuthUser[]> {
  const out: AuthUser[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    if (!data.users.length) break;
    out.push(...(data.users as AuthUser[]));
    if (data.users.length < 100) break;
    page++;
  }
  return out;
}

async function main() {
  console.log("Fetching auth users…");
  const users = await listAllUsers();
  console.log(`  Total users: ${users.length}`);

  const oauthUsers = users.filter(
    (u) => u.app_metadata?.provider && u.app_metadata.provider !== "email"
  );
  console.log(`  OAuth users: ${oauthUsers.length}`);

  if (oauthUsers.length === 0) {
    console.log("No OAuth users found. Nothing to do.");
    return;
  }

  console.log("\nProviders breakdown:");
  const byProvider = new Map<string, number>();
  for (const u of oauthUsers) {
    const p = u.app_metadata!.provider!;
    byProvider.set(p, (byProvider.get(p) ?? 0) + 1);
  }
  for (const [p, n] of byProvider.entries()) {
    console.log(`  ${p}: ${n}`);
  }

  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("\nDry-run mode. Would send recovery emails to:");
    for (const u of oauthUsers) {
      console.log(`  ${u.email ?? "(no email)"} — ${u.app_metadata?.provider}`);
    }
    return;
  }

  console.log("\nSending recovery emails…");
  let sent = 0;
  let failed = 0;
  for (const u of oauthUsers) {
    if (!u.email) {
      console.log(`  Skip user ${u.id} (no email)`);
      continue;
    }
    const { error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: u.email,
    });
    if (error) {
      console.log(`  ✗ ${u.email}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ ${u.email}`);
      sent++;
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
