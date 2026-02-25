import React from 'react';
import { User, Settings, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    siteVersion: 'N/A',
    aiRequests: 0,
  });

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Total Users</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Bot className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">AI Requests (24h)</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.aiRequests}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-full">
            <Settings className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Site Version</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.siteVersion}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
