import 'server-only'; // Now this is actually helpful!
import * as crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);

export async function hashSecurityAnswer(answer: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const normalized = answer.toLowerCase().trim();

  const derivedKey = (await scrypt(normalized, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifySecurityAnswer(
  enteredAnswer: string,
  storedValue: string,
): Promise<boolean> {
  const [salt, storedHash] = storedValue.split(':');
  const normalized = enteredAnswer.toLowerCase().trim();

  const derivedKey = (await scrypt(normalized, salt, 64)) as Buffer;
  return derivedKey.toString('hex') === storedHash;
}

export async function logActivity(
  supabase: any,
  {
    userId,
    username,
    event,
    status,
  }: {
    userId: string;
    username: string;
    event: string;
    status: string;
  },
) {
  await supabase.from('activity_logs').insert({
    user_id: userId,
    username: username,
    event_type: event,
    status: status,
  });
}
