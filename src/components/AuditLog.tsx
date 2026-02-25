import { useState, useEffect } from 'react';
import { FileClock, AlertTriangle, Loader2 } from 'lucide-react';

interface CommitLog {
  id: number;
  files_changed: string;
  timestamp: string;
}

interface ErrorLog {
  id: number;
  message: string;
  stack?: string;
  timestamp: string;
}

export function AuditLog() {
  const [commits, setCommits] = useState<CommitLog[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/logs')
      .then(res => res.json())
      .then(data => {
        setCommits(data.commits || []);
        setErrors(data.errors || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="p-6 bg-zinc-50 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold text-zinc-900 mb-6">Audit Log</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commit History */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2"><FileClock size={20} /> Change History</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {commits.map(commit => (
              <div key={commit.id} className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <p className="text-xs text-zinc-500 mb-2">{new Date(commit.timestamp).toLocaleString()}</p>
                <p className="text-sm text-zinc-700 font-medium">Files Changed:</p>
                <ul className="list-disc list-inside text-sm text-zinc-600 mt-1">
                  {JSON.parse(commit.files_changed).map((file: string, i: number) => <li key={i}>{file}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Error Logs */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Error & Crash Records</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {errors.map(error => (
              <details key={error.id} className="p-4 rounded-lg bg-red-50 border border-red-200">
                <summary className="text-sm text-red-700 font-medium cursor-pointer">
                  {error.message}
                  <p className="text-xs text-red-500 mt-1">{new Date(error.timestamp).toLocaleString()}</p>
                </summary>
                {error.stack && <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded-md overflow-auto">{error.stack}</pre>}
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
