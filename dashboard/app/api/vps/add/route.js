import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(req) {
    const { name, ip, user, key, type } = await req.json();

    // CHIFFREMENT de la clé SSH avant stockage
    const encryptedKey = CryptoJS.AES.encrypt(key, process.env.SSH_ENCRYPTION_KEY).toString();

    const { data, error } = await supabase
        .from('vps_nodes')
        .insert([{ 
            name, 
            ip_address: ip, 
            ssh_user: user, 
            ssh_key: encryptedKey, // Stocké chiffré !
            type 
        }]);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}