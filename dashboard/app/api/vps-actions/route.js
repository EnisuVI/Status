export const runtime = 'nodejs';
import { Client } from 'ssh2';

export async function POST(req) {
  try {
    const { ip, username } = await req.json();
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
        // On détache le reboot avec nohup + sleep 1 pour laisser le temps
        // à SSH de recevoir l'ACK avant que le serveur coupe la connexion.
        // Le "|| true" évite un code de retour non-zéro qui ferait croire à une erreur.
        const cmd = 'nohup sh -c "sleep 1 && sudo reboot" > /dev/null 2>&1 & echo ok';
        conn.exec(cmd, (err, stream) => {
          if (err) return resolve(Response.json({ error: "Erreur exécution: " + err.message }, { status: 500 }));
          let output = '';
          stream.on('data', (d) => { output += d.toString(); });
          stream.on('close', () => {
            conn.end();
            // "ok" dans output = la commande a bien été lancée en arrière-plan
            if (output.trim() === 'ok') {
              resolve(Response.json({ message: "Reboot lancé avec succès" }));
            } else {
              resolve(Response.json({ error: "Réponse inattendue : " + output }, { status: 500 }));
            }
          });
          stream.stderr.resume();
        });
      }).on('error', (err) => {
        // On ignore l'erreur de connexion fermée brutalement (le reboot a coupé SSH)
        if (err.message?.includes('Connection lost') || err.message?.includes('socket hang up')) {
          resolve(Response.json({ message: "Reboot lancé avec succès" }));
          return;
        }
        resolve(Response.json({ error: "Erreur SSH : " + err.message }, { status: 500 }));
      }).connect({
        host: ip,
        port: 22,
        username: username || 'ubuntu',
        privateKey: formattedKey,
        readyTimeout: 20000,
        keepaliveInterval: 5000,
        // Laisser ssh2 négocier automatiquement tous les algorithmes modernes
        // (suppression de l'ancienne restriction 'ssh-rsa'/'ssh-dss' qui bloquait
        //  les serveurs utilisant ecdsa-sha2-nistp256 ou ssh-ed25519)
      });
    });
  } catch (e) {
    // Si l'API crash, c'est capté ici
    return Response.json({ error: "Crash API: " + e.message }, { status: 500 });
  }
}