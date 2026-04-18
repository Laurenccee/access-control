import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto'; // Built-in Node tool for security
import { createClient } from '@supabase/supabase-js';

// 1. Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper for terminal input
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim());
    }),
  );
}

// Helper to hash the security answer (Privacy & Security)
function hashString(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase()).digest('hex');
}

async function main() {
  console.log('\n=== 🔐 SYSTEM BOOTSTRAP: ADMIN CREATOR ===\n');

  const username = await ask('Enter System Username: ');
  const email = await ask('Enter Admin Email: ');
  const password = await ask('Enter Admin Password (min 8 chars): ');
  const question = await ask('Set Security Question: ');
  const answer = await ask('Set Security Answer: ');

  if (password.length < 8 || !username || !email) {
    console.error('❌ Error: Missing fields or password too short.');
    process.exit(1);
  }

  console.log(`\n⏳ Provisioning Auth identity...`);

  // Create the User in Supabase Auth (This is where email is stored safely)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) throw new Error(`Auth Error: ${authError.message}`);
  const user = authData.user;

  console.log(`✅ Auth Identity Created. Linking Profile...`);

  // Create the Profile (NO EMAIL HERE - IT'S SECURE IN AUTH)
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: user.id, // Link to the Auth user
      username: username,
      role: 'admin',
      security_question: question,
      security_answer_hash: hashString(answer), // Stored as a hash, not plain text
      failed_attempts: 0,
    },
    { onConflict: 'id' },
  );

  if (profileError)
    throw new Error(`Profile Mapping Error: ${profileError.message}`);

  console.log('\n✨ ADMIN PROVISIONING COMPLETE ✨');
  console.log(`User ID: ${user.id} is now an admin.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ BOOTSTRAP FAILED:', err.message);
  process.exit(1);
});
