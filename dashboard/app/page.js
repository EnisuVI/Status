"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Settings, RefreshCw, Power, Terminal, Plus, Activity, Cpu, X, Trash2, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid, Legend } from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ResourceBar = ({ label, value, color, extraLabel }) => (
  <div>
    <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-bold">
      <title>Status - EnisuVI</title>
      <span>{label}</span>
      <span>
        {extraLabel ? <span className="mr-2 text-gray-400 normal-case font-medium">{extraLabel}</span> : null}
        <span className="text-gray-300">{Math.round(value || 0)}%</span>
      </span>
    </div>
    <div className="w-full bg-gray-700/30 h-1.5 rounded-full overflow-hidden border border-gray-800/50">
      <div className={`${color} h-full transition-all duration-1000 ease-out`} style={{ width: `${value || 0}%` }}></div>
    </div>
  </div>
);

const StatCard = ({ node, onDelete }) => {
  const stats = node.vps_metrics?.[0] || { cpu_usage: 0, ram_usage: 0, disk_usage: 0, ram_total: 0, disk_total: 0 };
  const lastSeen = stats?.recorded_at ? new Date(stats.recorded_at) : null;
  const isOnline = lastSeen && (new Date() - lastSeen) < 60000;

  const totalDisk = stats.disk_total || 0; 
  const usedDisk = totalDisk > 0 ? ((stats.disk_usage || 0) * totalDisk / 100).toFixed(1) : 0;
  const totalRam = stats.ram_total || 0; 
  const usedRam = totalRam > 0 ? ((stats.ram_usage || 0) * totalRam / 100).toFixed(2) : 0;

  const handleAction = async (actionType) => {
    if (!confirm(`Voulez-vous vraiment exécuter : ${actionType} sur ${node.name} ?`)) return;
    try {
      const res = await fetch('/api/vps-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id, action: actionType, ip: node.ip_address, username: node.ssh_user || 'root' })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Action réussie !");
      } else {
        alert("Erreur: " + (data.error || data.message || "Problème serveur interne"));
      }
    } catch (err) {
      alert("Erreur réseau ou crash API.");
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <h3 className="text-white font-bold tracking-tight">{node.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDelete(node.id, node.name)}
            className="p-1.5 text-gray-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
            title="Delete Node"
          >
            <Trash2 size={14} />
          </button>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-tighter ${isOnline ? 'text-gray-400 bg-gray-800' : 'text-red-400 bg-red-900/20'}`}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
      
      <div className={`space-y-4 mb-6 transition-all duration-700 ${isOnline ? 'opacity-100' : 'opacity-20 grayscale'}`}>
        <ResourceBar label="CPU" value={isOnline ? stats.cpu_usage : 0} color="bg-green-500" />
        <ResourceBar label="RAM" value={isOnline ? stats.ram_usage : 0} color="bg-blue-500" extraLabel={isOnline && totalRam > 0 ? `${usedRam} / ${totalRam} GB` : null} />
        <ResourceBar label="DISK" value={isOnline ? stats.disk_usage : 0} color="bg-purple-500" extraLabel={isOnline && totalDisk > 0 ? `${usedDisk} / ${totalDisk} GB` : null} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={() => handleAction('RESTART')} className="flex items-center justify-center gap-2 bg-[#262626] hover:bg-blue-600/10 hover:text-blue-400 text-gray-400 py-2.5 rounded-lg text-[11px] font-bold transition-all border border-transparent hover:border-blue-500/20">
          <RefreshCw size={13} /> RESTART
        </button>
        <button onClick={() => handleAction('SHUTDOWN')} className="flex items-center justify-center gap-2 bg-[#262626] hover:bg-red-600/10 hover:text-red-400 text-gray-400 py-2.5 rounded-lg text-[11px] font-bold transition-all border border-transparent hover:border-red-500/20">
          <Power size={13} /> POWER
        </button>
      </div>
      <button onClick={() => window.open(`ssh://${node.ip_address}`, '_blank')} className="w-full flex items-center justify-center gap-2 bg-[#262626] hover:bg-white/5 text-gray-400 hover:text-white py-2.5 rounded-lg text-[11px] font-bold transition-all border border-transparent hover:border-gray-600">
        <Terminal size={13} /> SSH CONSOLE
      </button>
    </div>
  );
};

export default function Dashboard() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newNode, setNewNode] = useState({ name: '', ip_address: '', ssh_user: 'ubuntu' });
  const settingsRef = useRef(null);

  // Ferme le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNodes = async () => {
    try {
      const { data: nodesData } = await supabase.from('vps_nodes').select('*');
      if (nodesData) {
        const nodesWithMetrics = await Promise.all(nodesData.map(async (node) => {
          const { data: metrics } = await supabase.from('vps_metrics').select('*').eq('vps_id', node.id).order('recorded_at', { ascending: false }).limit(30);
          return { ...node, vps_metrics: metrics || [] };
        }));
        setNodes(nodesWithMetrics);
        const timeline = {};
        nodesWithMetrics.forEach(node => {
          node.vps_metrics.forEach(m => {
            const time = new Date(m.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (!timeline[time]) timeline[time] = { time };
            timeline[time][`${node.name}_cpu`] = m.cpu_usage;
            timeline[time][`${node.name}_ram`] = m.ram_usage;
          });
        });
        setChartData(Object.values(timeline).reverse());
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleRegisterNode = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('vps_nodes').insert([newNode]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewNode({ name: '', ip_address: '', ssh_user: 'ubuntu' });
      fetchNodes();
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDeleteNode = async (id, name) => {
    if (!confirm(`🚨 Êtes-vous sûr de vouloir supprimer définitivement le VPS "${name}" ? Toutes les métriques seront effacées.`)) return;
    try {
      await supabase.from('vps_metrics').delete().eq('vps_id', id);
      const { error } = await supabase.from('vps_nodes').delete().eq('id', id);
      if (error) throw error;
      fetchNodes();
    } catch (err) { alert("Erreur lors de la suppression : " + err.message); }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase">Establishing Uplink...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8 text-gray-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
            <h1 className="text-xl font-black tracking-[0.15em] text-white uppercase italic">status.enisuvi.cloud</h1>
          </div>
          <div className="flex items-center gap-8 text-right">
            <div className="border-r border-gray-800 pr-8">
              <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black mb-1">Active Nodes</p>
              <p className="text-2xl font-black text-white leading-none">{nodes.length}</p>
            </div>

            {/* Settings dropdown */}
            <div className="relative" ref={settingsRef}>
              <Settings
                className={`cursor-pointer transition-all duration-300 ${settingsOpen ? 'text-white rotate-90' : 'text-gray-600 hover:text-white hover:rotate-90'}`}
                size={20}
                onClick={() => setSettingsOpen(!settingsOpen)}
              />
              {settingsOpen && (
                <div className="absolute right-0 top-8 bg-[#1e1e1e] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 w-44">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={13} /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {nodes.map(node => <StatCard key={node.id} node={node} onDelete={handleDeleteNode} />)}
          <div onClick={() => setIsModalOpen(true)} className="border-2 border-dashed border-gray-800/50 rounded-xl flex flex-col items-center justify-center p-8 text-gray-700 hover:border-blue-500/30 hover:text-blue-500 hover:bg-blue-500/[0.02] transition-all cursor-pointer group">
            <Plus size={28} className="mb-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[10px] font-black uppercase tracking-widest">Register New Node</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartBox title="Processor Load Realtime" icon={<Cpu size={16}/>} data={chartData} nodes={nodes} suffix="_cpu" color="#10b981" />
          <ChartBox title="Memory Allocation Delta" icon={<Activity size={16}/>} data={chartData} nodes={nodes} suffix="_ram" color="#3b82f6" />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 w-full max-w-md p-8 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-black uppercase tracking-tighter text-lg">New Uplink Configuration</h2>
              <X onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white cursor-pointer" size={20} />
            </div>
            <form onSubmit={handleRegisterNode} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Node Identifier</label>
                <input required value={newNode.name} onChange={e => setNewNode({...newNode, name: e.target.value})} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white transition-colors" placeholder="ex: Oracle-Server-01" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Target IPv4 Address</label>
                <input required value={newNode.ip_address} onChange={e => setNewNode({...newNode, ip_address: e.target.value})} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white transition-colors" placeholder="141.253.115.198" />
                <input required value={newNode.ssh_user} onChange={e => setNewNode({...newNode, ssh_user: e.target.value})} className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white transition-colors" placeholder="Utilisateur SSH (ex: ubuntu, opc, root)" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all mt-4 active:scale-95">Establish Connection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ChartBox = ({ title, icon, data, nodes, suffix, color }) => (
  <div className="bg-[#111111] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color + '33' }}></div>
    <div className="flex items-center gap-3 mb-8" style={{ color }}>
      {icon}
      <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">{title}</h3>
    </div>
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 100]} stroke="#333" fontSize={9} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} />
          <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', paddingTop: '25px', fontWeight: 'bold', textTransform: 'uppercase' }} />
          {nodes.map((node, i) => (
            <Line key={node.id} type="monotone" dataKey={node.name + suffix} name={node.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);