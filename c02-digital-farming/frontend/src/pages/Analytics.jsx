import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts';
import { TrendingUp, Activity, Droplets } from 'lucide-react';

const mockYieldData = [
  { month: 'Jan', yield: 3200, target: 4000 },
  { month: 'Feb', yield: 3400, target: 4000 },
  { month: 'Mar', yield: 3800, target: 4000 },
  { month: 'Apr', yield: 4100, target: 4000 },
  { month: 'May', yield: 4500, target: 4000 },
  { month: 'Jun', yield: 4800, target: 4000 },
];

const mockNPKData = [
  { day: 'Mon', N: 65, P: 40, K: 35 },
  { day: 'Tue', N: 60, P: 38, K: 33 },
  { day: 'Wed', N: 55, P: 35, K: 30 },
  { day: 'Thu', N: 75, P: 45, K: 40 }, // Fertilizer applied
  { day: 'Fri', N: 80, P: 48, K: 42 },
  { day: 'Sat', N: 78, P: 46, K: 41 },
  { day: 'Sun', N: 75, P: 45, K: 40 },
];

const mockSoilData = [
  { time: '00:00', moisture: 45, temp: 24 },
  { time: '04:00', moisture: 43, temp: 23 },
  { time: '08:00', moisture: 40, temp: 26 },
  { time: '12:00', moisture: 35, temp: 31 },
  { time: '16:00', moisture: 32, temp: 29 },
  { time: '20:00', moisture: 55, temp: 25 }, // Irrigation event
];

const Analytics = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Stats */}
      <div className="grid-cards">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Season Yield Prediction</h3>
            <TrendingUp color="var(--accent-green)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>4,800 kg/ha</p>
          <p style={{ color: 'var(--accent-green)', fontSize: '0.875rem' }}>+12% vs last season</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Overall Health Index</h3>
            <Activity color="var(--accent-blue)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>92%</p>
          <p style={{ color: 'var(--accent-green)', fontSize: '0.875rem' }}>Optimal Conditions</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex-between">
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Water Usage Efficiency</h3>
            <Droplets color="var(--accent-purple)" />
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>A+</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Smart Irrigation Active</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Yield History */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Yield Trends (kg/ha)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockYieldData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="yield" stroke="#10b981" fillOpacity={1} fill="url(#colorYield)" name="Actual Yield" />
              <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" name="Target Yield" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* NPK Levels */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '400px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Soil Nutrients (Virtual Sensor)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockNPKData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Legend />
              <Bar dataKey="N" fill="#3b82f6" name="Nitrogen" radius={[4, 4, 0, 0]} />
              <Bar dataKey="P" fill="#10b981" name="Phosphorus" radius={[4, 4, 0, 0]} />
              <Bar dataKey="K" fill="#f59e0b" name="Potassium" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Soil Moisture & Temp (Full Width) */}
        <div className="glass-panel" style={{ padding: '1.5rem', height: '300px', gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>24h Soil Moisture & Temp</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockSoilData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="moisture" stroke="#3b82f6" strokeWidth={3} name="Moisture (%)" />
              <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={3} name="Temperature (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
