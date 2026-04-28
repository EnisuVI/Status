"use client";
import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Power, Terminal, Plus, Activity, Cpu } from 'lucide-react';
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

const StatCard = ({ node }) => {
  const stats = node.vps_metrics?.[0] || { 
    cpu_usage: 0, 
    ram_usage: 0, 
    disk_usage: 0,
    ram_total: 0,
    disk_total: 0 
  };
  
  const lastSeen = stats?.recorded_at ? new Date(stats.recorded_at) : null;
  const now = new Date();
  const isOnline = lastSeen && (now - lastSeen) < 60000;

  // FALLBACK : On utilise les valeurs de la DB si elles existent, sinon tes valeurs par défaut
  const totalDisk = stats.disk_total || 50; 
  const usedDisk = ((stats.disk_usage || 0) * totalDisk / 100).toFixed(1);
  
  const totalRam = stats.ram_total || 24; 
  const usedRam = ((stats.ram_usage || 0) * totalRam / 100).toFixed(2);

  const handleAction = async (actionType) => {
    const confirmAction = confirm(`Voulez-vous vraiment exécuter : ${actionType} sur ${node.name} ?`);
    if (!confirmAction) return;

    try {
      const res = await fetch('/api/vps-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: node.id, action: actionType, ip: node.ip_address })
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Erreur lors de l'envoi de la commande.");
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800 shadow-lg relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
          <h3 className="text-white font-bold tracking-tight">{node.name}</h3>
        </div>
        <span className={`text-[9px] font-black px-2 py-0.5 rounded tracking-tighter ${isOnline ? 'text-gray-400 bg-gray-800' : 'text-red-400 bg-red-900/20'}`}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>
      
      <div className={`space-y-4 mb-6 transition-all duration-700 ${isOnline ? 'opacity-100' : 'opacity-20 grayscale'}`}>
        <ResourceBar 
          label="CPU" 
          value={isOnline ? stats.cpu_usage : 0} 
          color="bg-green-500" 
        />
        <ResourceBar 
          label="RAM" 
          value={isOnline ? stats.ram_usage : 0} 
          color="bg-blue-500" 
          extraLabel={isOnline ? `${usedRam} / ${totalRam} GB` : null}
        />
        <ResourceBar 
          label="DISK" 
          value={isOnline ? stats.disk_usage : 0} 
          color="bg-purple-500" 
          extraLabel={isOnline ? `${usedDisk} / ${totalDisk} GB` : null}
        />
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

  const fetchNodes = async () => {
    try {
      const { data: nodesData } = await supabase.from('vps_nodes').select('*');
      if (nodesData) {
        const nodesWithMetrics = await Promise.all(nodesData.map(async (node) => {
          const { data: metrics } = await supabase
            .from('vps_metrics')
            .select('*')
            .eq('vps_id', node.id)
            .order('recorded_at', { ascending: false })
            .limit(30);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="text-blue-500 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">Establishing Uplink...</div>
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
            <Settings className="text-gray-600 hover:text-white cursor-pointer transition-all hover:rotate-90" size={20} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {nodes.map(node => <StatCard key={node.id} node={node} />)}
          <div className="border-2 border-dashed border-gray-800/50 rounded-xl flex flex-col items-center justify-center p-8 text-gray-700 hover:border-blue-500/30 hover:text-blue-500 hover:bg-blue-500/[0.02] transition-all cursor-pointer group">
            <Plus size={28} className="mb-2 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[10px] font-black uppercase tracking-widest">Register New Node</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111111] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500/20"></div>
            <div className="flex items-center gap-3 mb-8 text-green-500">
              <Cpu size={16} />
              <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Processor Load Realtime</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} stroke="#333" fontSize={9} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', paddingTop: '25px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  {nodes.map((node, i) => (
                    <Line key={node.id} type="monotone" dataKey={`${node.name}_cpu`} name={node.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111111] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20"></div>
            <div className="flex items-center gap-3 mb-8 text-blue-500">
              <Activity size={16} />
              <h3 className="font-black uppercase text-[10px] tracking-[0.2em]">Memory Allocation Delta</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 100]} stroke="#333" fontSize={9} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', fontSize: '10px' }} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: '9px', paddingTop: '25px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  {nodes.map((node, i) => (
                    <Line key={node.id} type="monotone" dataKey={`${node.name}_ram`} name={node.name} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}