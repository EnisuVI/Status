export const runtime = 'nodejs';

import { createClient } from '@supabase/supabase-js';
import { createCipheriv, randomBytes } from 'crypto';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function encrypt(text, secret) {
  const key = Buffer.from(secret.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export async function POST(req) {
  const { name, ip, user, key, type } = await req.json();

  const encryptedKey = encrypt(key, process.env.SSH_ENCRYPTION_KEY);

  const { error } = await supabase
    .from('vps_nodes')
    .insert([{ name, ip_address: ip, ssh_user: user, ssh_key: encryptedKey, type }]);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}