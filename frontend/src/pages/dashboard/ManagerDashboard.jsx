import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle, ChevronDown,
  Clock, Calendar, TrendingUp, Users,
  Target, BarChart2
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { projectsApi } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

/* ── constants ── */
const PROJECT_STATUSES = [
  { value: 'PLANNING',  label: '🗂 Planning',    color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
  { value: 'ONGOING',   label: '⚡ In Progress',  color: '#4f46e5', bg: 'rgba(99,102,241,0.12)' },
  { value: 'COMPLETED', label: '✓ Completed',    color: '#16a34a', bg: 'rgba(34,197,94,0.12)'  },
  { value: 'ON_HOLD',   label: '⏸ On Hold',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
];

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#ec4899','#14b8a6',
];

const getStatusStyle = (s) =>
  PROJECT_STATUSES.find((p) => p.value === s) ||
  { label: s || '—', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' };

const progressColor = (pct) => {
  if (pct >= 100) return 'linear-gradient(90deg, #22c55e, #10b981)';
  if (pct >= 80)  return '#22c55e';
  if (pct >= 60)  return '#06b6d4';
  if (pct >= 40)  return '#6366f1';
  if (pct >= 20)  return '#f59e0b';
  return '#ef4444';
};

const getProgressBg = (pct) => progressColor(pct);

const getActionColor = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('creat')) return '#22c55e';
  if (a.includes('delet')) return '#ef4444';
  if (a.includes('updat') || a.includes('chang')) return '#6366f1';
  return '#f59e0b';
};

export default function ManagerDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  /* ── data ── */
  const [stats, setStats]                       = useState(null);
  const [projectsProgress, setProjectsProgress] = useState([]);
  const [upcomingProjects, setUpcomingProjects]  = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [statusUpdating, setStatusUpdating]     = useState(null);

  /* ── member stats modal ── */
  const [statsModal, setStatsModal]       = useState(false);
  const [statsTarget, setStatsTarget]     = useState(null);
  const [statsData, setStatsData]         = useState(null);
  const [statsLoading, setStatsLoading]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  /* ────────────────────────── loaders ────────────────────────── */
  const loadAll = async () => {
    try {
      setLoading(true);
      const [dashRes, progRes, projectsRes] = await Promise.allSettled([
        dashboardApi.getUserDashboard(),
        dashboardApi.getProjectsProgress(10),
        projectsApi.list(),
      ]);

      if (dashRes.status === 'fulfilled') setStats(dashRes.value);

      const progress = progRes.status === 'fulfilled' ? (progRes.value || []) : [];
      setProjectsProgress(progress);

      /* upcoming project deadlines */
      if (projectsRes.status === 'fulfilled') {
        const all = projectsRes.value || [];
        const upcoming = all
          .filter((p) => p.endDate && p.status !== 'COMPLETED')
          .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
          .slice(0, 7);
        setUpcomingProjects(upcoming);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── inline project status change ── */
  const handleStatusChange = async (projectId, newStatus, projectName) => {
    setStatusUpdating(projectId);
    try {
      const proj = await projectsApi.getById(projectId);
      await projectsApi.update(projectId, {
        name:        proj.name || projectName,
        description: proj.description,
        status:      newStatus,
        startDate:   proj.startDate,
        endDate:     proj.endDate,
      });
      toast.success('Status updated');
      setProjectsProgress((prev) =>
        prev.map((p) => p.projectId === projectId ? { ...p, projectStatus: newStatus } : p)
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  /* ── member stats modal ── */
  const openStats = async (member) => {
    setStatsTarget(member);
    setStatsModal(true);
    setStatsLoading(true);
    setStatsData(null);
    try {
      const data = await dashboardApi.getUserStats(member.userId);
      setStatsData(data);
    } catch {
      setStatsData({
        totalProjects:  member.projectCount,
        totalTasks:     member.taskCount,
        completedTasks: null,
        overdueTasks:   null,
        overallCompletionPercentage: null,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  /* ── helpers ── */
  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

  const deadlineUrgency = (days) => {
    if (days < 0)   return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: `${Math.abs(days)}d overdue` };
    if (days === 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Due today!' };
    if (days <= 3)  return { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: `${days}d left` };
    if (days <= 7)  return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: `${days}d left` };
    if (days <= 14) return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: `${days}d left` };
    return               { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    label: `${days}d left` };
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fmtDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const progressColor = (p) => {
    if (p >= 80) return '#22c55e';
    if (p >= 40) return '#6366f1';
    return '#f59e0b';
  };

  /* ── render ── */
  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const kpis = [
    { label: 'My Projects',    value: stats?.totalProjects  ?? 0, color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: FolderKanban, sub: `${stats?.activeProjects ?? 0} active` },
    { label: 'Active Projects', value: stats?.activeProjects ?? 0, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   icon: TrendingUp,   sub: 'currently running' },
    { label: 'Total Tasks',    value: stats?.totalTasks     ?? 0, color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: CheckSquare,  sub: `${stats?.completedTasks ?? 0} done (${(stats?.overallCompletionPercentage || 0).toFixed(0)}%)` },
    { label: 'Overdue Tasks',  value: stats?.overdueTasks   ?? 0, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: AlertTriangle,sub: 'across all projects' },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.fullName}!</h1>
        <p className="page-subtitle">Here's your team and project overview.</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="stats-grid">
        {kpis.map((k) => (
          <div key={k.label} className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">{k.label}</p>
                <p className="stat-card-value">{k.value}</p>
                <p style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{k.sub}</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={22} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2-col main grid ── */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>

        {/* Project Progress + status change */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="card-title">Project Progress</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                {projectsProgress.length} projects · click status to update
              </p>
            </div>
            <button className="card-link" onClick={() => navigate('/projects')}>View All →</button>
          </div>
          <div className="card-content">
            {projectsProgress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <FolderKanban size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No projects assigned</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {projectsProgress.map((p) => {
                  const pct         = Math.min(p.completionPercentage || 0, 100);
                  const color       = progressColor(pct);
                  const statusStyle = getStatusStyle(p.projectStatus);
                  const isUpdating  = statusUpdating === p.projectId;
                  return (
                    <div key={p.projectId} style={{
                      padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-neutral)', background: 'var(--color-surface-raised)',
                      opacity: isUpdating ? 0.7 : 1, transition: 'opacity 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          onClick={() => navigate(`/projects/${p.projectId}`)}
                          style={{ fontWeight: 650, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        >
                          {p.projectName}
                        </span>

                        {/* Inline status dropdown */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <select
                            value={p.projectStatus || 'PLANNING'}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(p.projectId, e.target.value, p.projectName)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.65rem', fontWeight: 700,
                              padding: '0.15rem 1.3rem 0.15rem 0.45rem',
                              borderRadius: '99px', outline: 'none', cursor: 'pointer',
                              background: statusStyle.bg, color: statusStyle.color,
                              border: `1px solid ${statusStyle.color}40`, appearance: 'none',
                            }}
                          >
                            {PROJECT_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: statusStyle.color }} />
                        </div>

                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color, minWidth: '36px', textAlign: 'right' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>

                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.3rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <CheckSquare size={11} /> {p.completedTasks}/{p.totalTasks} tasks
                      </p>

                      <div style={{ height: '5px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: getProgressBg(pct), transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={17} style={{ color: '#f59e0b' }} /> Upcoming Deadlines
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                Projects sorted by nearest end date
              </p>
            </div>
            <button className="card-link" onClick={() => navigate('/projects')}>View All →</button>
          </div>
          <div className="card-content">
            {upcomingProjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <Calendar size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem' }}>No upcoming deadlines</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {upcomingProjects.map((p) => {
                  const days    = daysUntil(p.endDate);
                  const urgency = deadlineUrgency(days);
                  const sts     = getStatusStyle(p.status);
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 0.85rem', borderRadius: 'var(--radius-md)',
                        border: `1px solid ${urgency.bg}`, background: 'var(--color-surface-raised)',
                        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: urgency.color, flexShrink: 0, boxShadow: days <= 3 ? `0 0 6px ${urgency.color}` : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.855rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</p>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '99px', background: sts.bg, color: sts.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {sts.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={10} /> {fmtDate(p.endDate)}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: '99px', background: urgency.bg, color: urgency.color, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: '0.02rem' }}>
                        {urgency.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* ── Member Stats Modal ── */}
      <Modal isOpen={statsModal} onClose={() => setStatsModal(false)} title="Member Performance" size="md">
        {statsLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><LoadingSpinner text="Loading stats..." /></div>
        ) : statsTarget && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem' }}>
                {statsTarget.userName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{statsTarget.userName}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  {statsTarget.projectRole?.replace('_', ' ')} · {statsTarget.projectCount ?? '—'} project{(statsTarget.projectCount ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.25rem' }}>
              {[
                { icon: FolderKanban, label: 'Projects',     value: statsData?.totalProjects  ?? statsTarget.projectCount ?? '—', color: '#6366f1' },
                { icon: CheckSquare,  label: 'Total Tasks',  value: statsData?.totalTasks     ?? statsTarget.taskCount    ?? '—', color: '#06b6d4' },
                { icon: Activity,     label: 'Completed',    value: statsData?.completedTasks  ?? '—',  color: '#22c55e' },
                { icon: AlertTriangle,label: 'Overdue',      value: statsData?.overdueTasks    ?? '—',  color: '#ef4444' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '0.85rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{item.label}</p>
                    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* completion bar */}
            {statsData && (statsData.overallCompletionPercentage != null || (statsData.totalTasks > 0 && statsData.completedTasks != null)) && (() => {
              const pct = statsData.overallCompletionPercentage
                ?? Math.round((statsData.completedTasks / statsData.totalTasks) * 100);
              const clamped = Math.min(pct, 100);
              const barColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#6366f1' : '#ef4444';
              return (
                <div style={{ padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Target size={14} style={{ color: '#6366f1' }} /> Task Completion Rate
                    </span>
                    <span style={{ fontWeight: 700, color: barColor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${clamped}%`, borderRadius: '99px', background: barColor, transition: 'width 0.9s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', textAlign: 'right' }}>
                    {statsData.completedTasks ?? '—'} / {statsData.totalTasks ?? '—'} tasks completed
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
