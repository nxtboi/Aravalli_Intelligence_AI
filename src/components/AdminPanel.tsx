import { useState } from 'react';

import { LayoutDashboard, Wand2, HeartPulse } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AISiteBuilder } from './AISiteBuilder';
import { SystemHealth } from './SystemHealth';

export function AdminPanel() {

  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-full bg-zinc-50">
      <nav className="w-64 bg-white border-r border-zinc-200 p-4">
        <h2 className="text-lg font-semibold text-zinc-900 mb-6">Admin Menu</h2>
        <ul className="space-y-2">
          <li>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              <LayoutDashboard size={18} />
              Dashboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('builder')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'builder' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              <Wand2 size={18} />
              AI Site Builder
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('health')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'health' ? 'bg-purple-100 text-purple-700' : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              <HeartPulse size={18} />
              System Health
            </button>
          </li>
        </ul>
      </nav>
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'builder' && <AISiteBuilder />}
        {activeTab === 'health' && <SystemHealth />}
      </main>
    </div>
  )
}
