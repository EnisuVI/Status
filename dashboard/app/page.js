"use client";
import React from 'react';
import { Settings, RefreshCw, Power, Terminal, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Données fictives pour le graph
const data = [
  { name: '00:00', mac: 20, oracle: 10, aws: 30 },
  { name: '04:00', mac: 35, oracle: 15, aws: 45 },
  { name: '08:00', mac: 25, oracle: 12, aws: 60 },
  { name: '12:00', mac: 40, oracle: 18, aws: 85 },
  { name: '16:00', mac: 30, oracle: 14, aws: 91 },
];

const StatCard = ({ title, status, cpu, ram, disk, uptime, color }) => (
  <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800 shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color === 'orange' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>
      <span className="text-gray-400 text-sm">{status}</span>
    </div>
    
    <div className="space-y-3 mb-6">
      <ResourceBar label="CPU" value={cpu} color={cpu > 80 ? 'bg-red-500' : (color === 'orange' ? 'bg-red-500' : 'bg-green-500')} />
      <ResourceBar label="RAM" value={ram} color={ram > 80 ? 'bg-red-500' : 'bg-blue-500'} />
      <ResourceBar label="Disk" value={disk} color="bg-purple-500" />
    </div>

    <div className="flex justify-between text-gray-400 text-xs mb-4">
      <span>Uptime</span>
      <span>{uptime}</span>
    </div>

    <div className="grid grid-cols-2 gap-2 mb-2">
      <button className="flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white py-2 rounded-lg text-sm transition">
        <RefreshCw size={14} /> Restart
      </button>
      <button className="flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white py-2 rounded-lg text-sm transition">
        <Power size={14} /> Shutdown
      </button>
    </div>
    <button className="w-full flex items-center justify-center gap-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white py-2 rounded-lg text-sm transition">
      <Terminal size={14} /> SSH Console
    </button>
  </div>
);

const ResourceBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#121212] p-8 font-sans text-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h1 className="text-xl font-medium text-white">status.enisuvi.cloud</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>3 online • 0 alerts</span>
          <Settings size={18} className="cursor-pointer hover:rotate-45 transition-transform" />
        </div>
      </div>

      {/* Grid Cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
        <StatCard title="Mac Mini" status="Online" cpu={34} ram={61} disk={48} uptime="14d 3h" color="green" />
        <StatCard title="Oracle VPS" status="Online" cpu={78} ram={45} disk={22} uptime="32d 11h" color="green" />
        <StatCard title="AWS EC2" status="Warning" cpu={91} ram={88} disk={65} uptime="5d 22h" color="orange" />
      </div>

      {/* Graphique */}
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 max-w-6xl mx-auto mb-8 shadow-lg">
        <h3 className="text-white font-bold mb-6">CPU history — last 24h</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="mac" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="oracle" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="aws" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: 'none' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Améliorations */}
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 max-w-6xl mx-auto shadow-lg">
        <h3 className="text-white font-bold mb-2">Idées d'améliorations futures</h3>
        <p className="text-gray-400 text-sm mb-2">Alertes email/Discord • Logs centralisés • Métriques réseau • Terminal web intégré • Historique 30j</p>
        <p className="text-gray-400 text-sm">Déploiement auto (Coolify/Dokku) • Backup monitoring • Nouveau VPS Oracle AMD à venir</p>
      </div>
    </div>
  );
}