import { NextResponse } from 'next/server';
import { NodeSSH } from 'node-ssh';
import path from 'path';
import os from 'os';

const ssh = new NodeSSH();

export async function POST(request) {
  try {
    const { nodeId, action, ip } = await request.json();

    // 1. Définition de la commande système selon l'action
    let command = '';
    if (action === 'RESTART') command = 'sudo reboot';
    if (action === 'SHUTDOWN') command = 'sudo poweroff';

    if (!command) {
      return NextResponse.json({ 
        success: false, 
        message: "Action non reconnue" 
      }, { status: 400 });
    }

    // 2. Configuration du chemin vers ta clé ed25519
    // os.homedir() permet de pointer vers /Users/charles-augustinvidelaine sur ton Mac
    const keyPath = path.join(os.homedir(), '.ssh', 'id_ed25519');

    // 3. Tentative de connexion SSH
    await ssh.connect({
      host: ip,
      username: 'ubuntu', // Vérifie si c'est 'ubuntu' ou 'root' sur ton VPS Oracle
      privateKeyPath: keyPath
    });

    // 4. Exécution de la commande
    await ssh.execCommand(command);
    
    // Fermeture propre de la session
    ssh.dispose(); 

    return NextResponse.json({ 
      success: true, 
      message: `La commande ${action} a été envoyée avec succès au serveur ${ip}.` 
    });

  } catch (error) {
    console.error("SSH Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: `Erreur SSH : ${error.message}` 
    }, { status: 500 });
  }
}