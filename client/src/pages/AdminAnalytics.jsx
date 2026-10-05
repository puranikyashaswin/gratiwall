import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api/client';
import { Loading, EmptyState } from '../components/States';
import { useTheme } from '../context/ThemeContext';

const PALETTE_LIGHT = ['#c2410c', '#3f6212', '#b45309', '#475569'];
const PALETTE_DARK = ['#f97316', '#84cc16', '#f59e0b', '#94a3b8'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const { theme } = useTheme();

  useEffect(() => {
    api
      .get('/admin/analytics')
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="container page">
        <Loading label="Crunching the numbers…" />
      </div>
    );
  }

  if (status === 'error' || !data) {
    return (
      <div className="container page">
        <EmptyState mark="!" title="Analytics unavailable">
          The server didn’t respond. Make sure the backend and database are running, then refresh.
        </EmptyState>
      </div>
    );
  }

  const palette = theme === 'dark' ? PALETTE_DARK : PALETTE_LIGHT;
  const chart = {
    grid: theme === 'dark' ? '#39322b' : '#e7e0d4',
    tick: theme === 'dark' ? '#c9bfb2' : '#57534e',
    tooltip: {
      contentStyle: {
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        color: 'var(--ink)',
        fontSize: 13,
      },
      labelStyle: { color: 'var(--ink)' },
      itemStyle: { color: 'var(--ink-soft)' },
    },
    cursor: theme === 'dark' ? 'rgba(245,241,234,0.05)' : 'rgba(28,25,23,0.04)',
  };

  const { totals, thisWeek, byDepartment, categoryTrend, topRecipients } = data;
  const maxTop = Math.max(1, ...topRecipients.map((r) => r.count));

  return (
    <div className="container container-dash page">
      <div className="page-head">
        <span className="eyebrow">Analytics</span>
        <h1>Appreciation trends</h1>
        <p>How gratitude is moving around campus: by department, by kind of note, and by person.</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Total notes" value={totals.all} />
        <StatCard label="Published" value={totals.approved} tone="green" />
        <StatCard label="Awaiting review" value={totals.pending} tone="amber" />
        <StatCard label="This week" value={thisWeek} tone="accent" />
      </div>

      <div className="chart-panel">
        <h3>Notes per department</h3>
        <p className="chart-sub">Counted by the recipient’s department when they’re registered, otherwise the sender’s.</p>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={byDepartment} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 12, fill: chart.tick }} interval={0} angle={-12} textAnchor="end" height={64} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chart.tick }} />
              <Tooltip cursor={{ fill: chart.cursor }} {...chart.tooltip} />
              <Bar dataKey="count" name="Notes" fill={palette[0]} radius={[5, 5, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        <div className="chart-panel">
          <h3>Weekly trend by category</h3>
          <p className="chart-sub">New notes per week, last 8 weeks.</p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={categoryTrend.weeks} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: chart.tick }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: chart.tick }} />
                <Tooltip {...chart.tooltip} />
                <Legend wrapperStyle={{ fontSize: 12, color: chart.tick }} />
                {categoryTrend.categories.map((c, i) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={palette[i % palette.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel">
          <h3>Most appreciated</h3>
          <p className="chart-sub">Top recipients of published notes.</p>
          {topRecipients.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: '0.9rem' }}>No published notes yet.</p>
          ) : (
            <ol className="leaderboard">
              {topRecipients.map((r, i) => (
                <li key={r.name}>
                  <span className="rank">{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="lb-name">{r.name}</span>
                    <div className="lb-bar" style={{ width: `${(r.count / maxTop) * 100}%` }} />
                  </div>
                  <span className="lb-count">{r.count} note{r.count === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${tone || ''}`}>{value}</div>
    </div>
  );
}
