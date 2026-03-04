import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AnalysisRecord {
  id: number;
  location_name: string;
  timestamp: string;
  ndvi_score: number;
  degradation_status: string;
  construction_detected: number; // SQLite returns 0/1 for booleans
  nightlight_intensity: number;
  is_legal_construction: number;
  user_verified: number | null;
  image_url: string;
}

export function HistoryView() {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch history');
        return res.json();
      })
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Unable to load analysis history. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleVerify = async (id: number, correct: boolean) => {
    try {
      const res = await fetch(`/api/verify/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct })
      });
      
      if (!res.ok) throw new Error('Verification failed');

      // Optimistic update
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, user_verified: correct ? 1 : 0 } : item
      ));
    } catch (e) {
      console.error("Verification failed", e);
      alert("Failed to update verification status. Please check your connection.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading history...</div>;

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-lg font-medium text-zinc-900">Error Loading Data</h3>
        <p className="text-zinc-500 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-zinc-900">Analysis History</h2>
        <p className="text-zinc-500">Record of all environmental checks and user verifications.</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-medium text-zinc-500">Date</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Location</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Status</th>
                <th className="px-6 py-4 font-medium text-zinc-500">NDVI</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Construction</th>
                <th className="px-6 py-4 font-medium text-zinc-500">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    No records found. Run a new analysis to see data here.
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-zinc-400" />
                        {format(new Date(record.timestamp), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-zinc-400" />
                        {record.location_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium border",
                        record.degradation_status === 'Natural' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                        record.degradation_status === 'Seasonal' ? "bg-amber-100 text-amber-700 border-amber-200" :
                        "bg-red-100 text-red-700 border-red-200"
                      )}>
                        {record.degradation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-600">
                      {record.ndvi_score.toFixed(3)}
                    </td>
                    <td className="px-6 py-4">
                      {record.construction_detected ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            record.is_legal_construction ? "bg-blue-500" : "bg-red-500"
                          )} />
                          <span className={record.is_legal_construction ? "text-blue-700" : "text-red-700"}>
                            {record.is_legal_construction ? "Legal" : "Illegal"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.user_verified === null ? (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleVerify(record.id, true)}
                            className="p-1 hover:bg-emerald-100 text-emerald-600 rounded"
                            title="Confirm"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => handleVerify(record.id, false)}
                            className="p-1 hover:bg-red-100 text-red-600 rounded"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className={cn(
                          "text-xs font-medium",
                          record.user_verified ? "text-emerald-600" : "text-red-600"
                        )}>
                          {record.user_verified ? "Verified" : "Rejected"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
