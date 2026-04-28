import { Client } from 'ssh2';

export async function POST(req) {
  try {
    const { ip } = await req.json();
    const isAWS = ip.startsWith('13.') || ip.startsWith('3.') || ip.startsWith('18.');
    
    // Récupération brute
    let rawKey = isAWS ? process.env.AWS_SSH_KEY : process.env.ORACLE_SSH_KEY;

    if (!rawKey) return Response.json({ error: "Clé SSH manquante dans le .env" }, { status: 500 });

    // --- NETTOYAGE ULTIME ---
    // On enlève les guillemets éventuels et on transforme les \n textuels en vrais sauts de ligne
    let formattedKey = rawKey.trim();
    if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
      formattedKey = formattedKey.slice(1, -1);
    }
    formattedKey = formattedKey.replace(/\\n/g, '\n');

    return new Promise((resolve) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        conn.exec('sudo reboot', (err, stream) => {
          if (err) return resolve(Response.json({ error: "Erreur exécution: " + err.message }, { status: 500 }));
          stream.on('close', () => {
            conn.end();
            resolve(Response.json({ message: "Success" }));
          });
        });
      }).on('error', (err) => {
        // C'est ici que l'erreur DECODER est captée
        resolve(Response.json({ error: "Erreur SSH : " + err.message }, { status: 500 }));
      }).connect({
        host: ip,
        port: 22,
        username: isAWS ? 'ubuntu' : 'opc',
        privateKey: formattedKey, // On passe la clé nettoyée
        readyTimeout: 15000,
        // Option de secours pour les formats anciens
        algorithms: {
          serverHostKey: ['ssh-rsa', 'ssh-dss'],
        }
      });
    });
  } catch (e) {
    // Si l'API crash, c'est capté ici
    return Response.json({ error: "Crash API: " + e.message }, { status: 500 });
  }
}