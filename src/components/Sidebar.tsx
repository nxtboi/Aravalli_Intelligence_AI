import { 
  LayoutDashboard, 
  Map as MapIcon, 
  History, 
  Settings, 
  Upload, 
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  appName?: string;
}

export function Sidebar({ activeTab, setActiveTab, onLogout, isAdmin, appName = 'Aravalli Watch' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Map', icon: MapIcon },
    { id: 'analysis', label: 'New Analysis', icon: Upload },
    { id: 'suggestions', label: 'AI Suggestions', icon: Sparkles },
    { id: 'history', label: 'History', icon: History },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 text-white rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 text-zinc-100 border-r border-zinc-800 transform transition-transform duration-200 lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black">
              <MapIcon size={18} />
            </span>
            {appName}
          </h1>
          <p className="text-xs text-zinc-500 mt-2">Eco-Monitoring System</p>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  activeTab === item.id 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>

          <div className="bg-zinc-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <AlertTriangle size={16} />
              <span className="text-xs font-bold uppercase">Alert</span>
            </div>
            <p className="text-xs text-zinc-400">
              High NTL volatility detected in Sector 42. Possible illegal mining.
            </p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
