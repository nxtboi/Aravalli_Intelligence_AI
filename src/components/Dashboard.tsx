import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  ReferenceLine,
  Area
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, TreePine, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const ndviData = [
  { year: '2019', ndvi: 0.65 },
  { year: '2020', ndvi: 0.68 },
  { year: '2021', ndvi: 0.62 },
  { year: '2022', ndvi: 0.55 },
  { year: '2023', ndvi: 0.48 }, // Drop
  { year: '2024', ndvi: 0.42 }, // Continued drop
];

const ntlData = [
  { month: 'Jan', intensity: 20 },
  { month: 'Feb', intensity: 22 },
  { month: 'Mar', intensity: 25 },
  { month: 'Apr', intensity: 85 }, // Spike
  { month: 'May', intensity: 80 },
  { month: 'Jun', intensity: 30 },
];

function calculateSlope(data: { year: string; ndvi: number }[]) {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, index) => {
    const x = index;
    const y = point.ndvi;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  return slope;
}

export function Dashboard() {
  const ndviSlope = calculateSlope(ndviData);
  const isDegradation = ndviSlope < -0.01; // Threshold for degradation
  const trendStatus = isDegradation ? 'Degradation' : 'Natural';

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative h-64 rounded-2xl overflow-hidden shadow-md mx-6 mt-6 group">
        <img 
          src="https://picsum.photos/seed/aravalli_hills/1200/400" 
          alt="Aravalli Hills" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent flex flex-col justify-end p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 backdrop-blur-md border border-emerald-500/30 rounded-full text-xs font-medium uppercase tracking-wider">
              Protected Zone
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Aravalli Range Monitor</h1>
          <p className="text-zinc-300 max-w-2xl text-lg">
            Real-time satellite surveillance and ecological health tracking of the oldest fold mountains in India.
          </p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Avg NDVI Score</p>
              <h3 className="text-3xl font-bold text-zinc-900 mt-1">0.42</h3>
            </div>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <TreePine size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
            <ArrowDownRight size={16} />
            <span>12% decrease</span>
            <span className="text-zinc-400 font-normal ml-1">vs last year</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Nightlight Volatility</p>
              <h3 className="text-3xl font-bold text-zinc-900 mt-1">High</h3>
            </div>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Zap size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
            <ArrowUpRight size={16} />
            <span>Spike detected</span>
            <span className="text-zinc-400 font-normal ml-1">in April</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-zinc-500">Active Alerts</p>
              <h3 className="text-3xl font-bold text-zinc-900 mt-1">3</h3>
            </div>
            <div className="p-2 bg-zinc-100 text-zinc-600 rounded-lg">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-sm text-zinc-500">
            2 Illegal Construction, 1 Degradation
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NDVI Trend */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-zinc-900">NDVI Long-term Trend (5 Years)</h3>
              <p className="text-sm text-zinc-500">Linear Regression Analysis</p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2",
              isDegradation ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              <Activity size={14} />
              {trendStatus} (Slope: {ndviSlope.toFixed(4)})
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndviData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#71717A'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717A'}} domain={[0, 1]} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-lg">
                          <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">{label}</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {Number(payload[0].value).toFixed(2)}
                            <span className="text-xs text-zinc-400 font-normal ml-1">NDVI</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#10B981', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ndvi" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            <span className="font-medium text-zinc-900">Analysis:</span> Consistent negative slope indicates permanent degradation rather than seasonal shedding.
          </p>
        </div>

        {/* NTL Volatility */}
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="font-semibold text-zinc-900 mb-6">Nightlight Intensity (Last 6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ntlData}>
                <defs>
                  <linearGradient id="colorNtl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#71717A'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717A'}} />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-zinc-100 shadow-xl rounded-lg">
                          <p className="text-xs font-semibold text-zinc-500 uppercase mb-1">{label}</p>
                          <p className="text-lg font-bold text-amber-500">
                            {payload[0].value}
                            <span className="text-xs text-zinc-400 font-normal ml-1">Lumens</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#F59E0B" 
                  fillOpacity={1} 
                  fill="url(#colorNtl)" 
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
                <ReferenceLine y={60} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Construction Threshold', fill: 'red', fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-zinc-500 mt-4">
            <span className="font-medium text-zinc-900">Analysis:</span> Sharp spike in April correlates with reported night-shift activity.
          </p>
        </div>
      </div>

      {/* Blogger/News Feed (Simulated) */}
      <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <h3 className="font-semibold text-zinc-900 mb-4">Community Reports & News</h3>
        <div className="space-y-4">
          {[
            { source: "EcoWarrior Blog", date: "2 days ago", title: "Trucks seen entering protected zone at night", sentiment: "negative" },
            { source: "Local News", date: "1 week ago", title: "Government announces new green corridor initiative", sentiment: "positive" },
            { source: "Twitter / X", date: "3 weeks ago", title: "Dust levels rising in Sector 42, residents complain", sentiment: "negative" }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-3 hover:bg-zinc-50 rounded-lg transition-colors">
              <div className={cn(
                "w-2 h-2 rounded-full mt-2",
                item.sentiment === 'negative' ? "bg-red-500" : "bg-emerald-500"
              )} />
              <div>
                <h4 className="font-medium text-zinc-900">{item.title}</h4>
                <p className="text-xs text-zinc-500">{item.source} • {item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
