import React from 'react';
import { Eye, Calendar, TrendingUp, IndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { Booking } from '@/lib/db';

interface AnalyticsViewProps {
  stats: {
    totalViews: number;
    conversionRate: number;
    projectedRevenue: number;
    totalBookings: number;
  };
  bookings: Booking[];
  chartData: any[];
  sourceData: any[];
}

const AnalyticsView = React.memo(function AnalyticsView({ stats, bookings, chartData, sourceData }: AnalyticsViewProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="glass-card flex items-center gap-4">
          <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>PAGE VIEWS</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{stats.totalViews}</h3>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>TOTAL BOOKINGS</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{stats.totalBookings}</h3>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>CONVERSION RATE</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>{stats.conversionRate}%</h3>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4">
          <div style={{ height: '2.5rem', width: '2.5rem', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>PROJECTED REVENUE</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.15rem' }}>₹{stats.projectedRevenue}</h3>
          </div>
        </div>
      </div>

      {/* Graphs Charts grid */}
      <div className="grid-2">
        {/* Traffic Area Chart */}
        <div className="glass-card">
          <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Traffic vs Booking conversion</h4>
          <div style={{ width: '100%', height: '280px', transform: 'translate3d(0,0,0)', willChange: 'transform', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#6366f1" fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="bookings" name="Bookings Created" stroke="#10b981" fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source Distribution Bar Chart */}
        <div className="glass-card">
          <h4 style={{ fontSize: '1.05rem', marginBottom: '1.25rem' }}>Booking Entry Points Distribution</h4>
          <div style={{ width: '100%', height: '280px', transform: 'translate3d(0,0,0)', willChange: 'transform', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                <Bar dataKey="bookings" fill="#a855f7" name="Bookings count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});


export default AnalyticsView;
