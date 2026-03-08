import { useEffect, useState } from 'react';
import { dashboardAPI, formatCurrency } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#006600', '#BB0000', '#0891b2', '#7c3aed', '#d97706', '#0d9488'];

function StatCard({ icon, label, value, sub, color, change }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className={`stat-icon ${color}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
        {change && <div className={`stat-change ${change > 0 ? 'up' : 'down'}`}>
          <i className={`bi bi-arrow-${change > 0 ? 'up' : 'down'}-short`} />
          {Math.abs(change)}% from last month
        </div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: p.color, display: 'flex', gap: 8 }}>
          <span>{p.name}:</span>
          <b>{typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-spinner" style={{ height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <span>Loading dashboard...</span>
    </div>
  );

  if (!stats) return <div className="empty-state"><i className="bi bi-wifi-off" /><h3>Could not load data</h3></div>;

  const { summary, claims_trend, claims_by_type, top_counties, members_trend } = stats;

  const claimsTypeData = claims_by_type.map(d => ({
    name: d.claim_type.charAt(0).toUpperCase() + d.claim_type.slice(1),
    value: d.count,
  }));

  const trendData = claims_trend.map((d, i) => ({
    ...d,
    registrations: members_trend[i]?.registrations || 0,
  }));

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -40, width: 150, height: 150, background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>
            SHA Kenya Management System
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
            Social Health Authority · Universal Health Coverage for all Kenyans
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
            {[
              { label: 'System Status', value: '🟢 Operational' },
              { label: 'Database', value: '🟢 Online' },
              { label: 'Claims Queue', value: `${summary.pending_claims} Pending` },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Total Collections</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
            {formatCurrency(summary.total_contributions)}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>All time confirmed</div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-16 mb-24">
        <StatCard icon="bi-people-fill" label="Total Members" value={summary.total_members.toLocaleString()}
          sub={`${summary.active_members} active`} color="green" change={4.2} />
        <StatCard icon="bi-hospital-fill" label="Health Facilities" value={summary.total_facilities.toLocaleString()}
          sub={`${summary.active_facilities} accredited`} color="blue" change={1.1} />
        <StatCard icon="bi-file-medical-fill" label="Total Claims" value={summary.total_claims.toLocaleString()}
          sub={`${summary.pending_claims} pending review`} color="orange" change={8.5} />
        <StatCard icon="bi-cash-coin" label="Claims Disbursed" value={formatCurrency(summary.total_approved_amount)}
          sub={`${summary.paid_claims} claims paid`} color="purple" change={12.3} />
      </div>

      {/* Claims Status Row */}
      <div className="grid grid-cols-4 gap-16 mb-24">
        {[
          { label: 'Pending', value: summary.pending_claims, icon: 'bi-hourglass-split', color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Under Review', value: summary.approved_claims, icon: 'bi-search', color: '#0891b2', bg: '#e0f2fe' },
          { label: 'Approved', value: summary.approved_claims, icon: 'bi-check-circle', color: '#16a34a', bg: '#dcfce7' },
          { label: 'Paid', value: summary.paid_claims, icon: 'bi-wallet-fill', color: '#7c3aed', bg: '#ede9fe' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${s.color}22` }}>
            <div style={{ width: 40, height: 40, background: `${s.color}22`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: 18 }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: s.color, opacity: 0.7, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-20 mb-20" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Claims & Contributions Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-graph-up-arrow" />Claims & Registration Trend (6 Months)</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006600" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#006600" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="regsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BB0000" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#BB0000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="claims" name="Claims" stroke="#006600" strokeWidth={2.5} fill="url(#claimsGrad)" dot={{ fill: '#006600', r: 3 }} />
                <Area type="monotone" dataKey="registrations" name="New Members" stroke="#BB0000" strokeWidth={2} fill="url(#regsGrad)" dot={{ fill: '#BB0000', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Claims by Type */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-pie-chart-fill" />Claims by Type</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={claimsTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {claimsTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Claims']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {claimsTypeData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <b>{d.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-20" style={{ gridTemplateColumns: '380px 1fr' }}>
        {/* Top Counties */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-bar-chart-fill" />Top Counties by Members</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {top_counties.map((c, i) => {
                const max = top_counties[0]?.member_count || 1;
                const pct = (c.member_count / max) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.member_count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly Claims Amount */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-cash-stack" />Monthly Claims Amount (KES)</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Approved & Paid</div>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={claims_trend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount (KES)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}