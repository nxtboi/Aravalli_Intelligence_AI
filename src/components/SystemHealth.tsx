import React from 'react';


const mockErrors = [
  { level: 'error', message: 'Failed to connect to database: Connection timed out', timestamp: '2023-10-27 10:30:15' },
  { level: 'critical', message: 'Unhandled exception: NullPointerException in user service', timestamp: '2023-10-27 10:25:02' },
  { level: 'warning', message: 'API rate limit exceeded for endpoint /api/users', timestamp: '2023-10-27 10:20:00' },
  { level: 'error', message: 'Payment processing failed: Invalid card details', timestamp: '2023-10-26 15:10:45' },
];

const mockCommits = [
  { hash: 'a1b2c3d', message: 'feat: Add user profile page', author: 'Admin', timestamp: '2023-10-27 09:00:00' },
  { hash: 'e4f5g6h', message: 'fix: Correct alignment issue on dashboard', author: 'Admin', timestamp: '2023-10-26 18:30:12' },
  { hash: 'i7j8k9l', message: 'refactor: Optimize database query for user list', author: 'Admin', timestamp: '2023-10-26 11:45:30' },
  { hash: 'm0n1p2q', message: 'docs: Update API documentation for /api/posts', author: 'Admin', timestamp: '2023-10-25 14:05:00' },
];

const ErrorLog = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Error and Crash Records</h3>
    <div className="h-96 overflow-y-auto border border-zinc-200 rounded-md p-2 font-mono text-xs">
      {mockErrors.map((error, index) => (
        <div key={index} className="p-2 border-b border-zinc-100">
          <p className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-white text-[10px] ${error.level === 'critical' ? 'bg-red-600' : error.level === 'error' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
              {error.level.toUpperCase()}
            </span>
            <span className="text-zinc-500">{error.timestamp}</span>
          </p>
          <p className="mt-1 text-zinc-800">{error.message}</p>
        </div>
      ))}
    </div>
  </div>
);

const CommitHistory = () => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4">Commit History</h3>
    <div className="h-96 overflow-y-auto border border-zinc-200 rounded-md p-2 font-mono text-xs">
      {mockCommits.map((commit, index) => (
        <div key={index} className="p-2 border-b border-zinc-100">
          <p className="flex items-center justify-between">
            <span className="text-purple-600 font-bold">{commit.hash}</span>
            <span className="text-zinc-500">{commit.timestamp}</span>
          </p>
          <p className="mt-1 text-zinc-800">{commit.message} - <span className="text-zinc-500">{commit.author}</span></p>
        </div>
      ))}
    </div>
  </div>
);

export const SystemHealth: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">System Health</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorLog />
        <CommitHistory />
      </div>
    </div>
  );
};
