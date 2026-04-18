import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle,
  Clock, Calendar, Target, Zap
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PROJECT_STATUSES = [
  { value: 'PLANNING',  label: '🗂 Planning',    color: '#b45309', bg: 'rgba(245,158,11,0.12)' },
  { value: 'ONGOING',   label: '⚡ In Progress',  color: '#4f46e5', bg: 'rgba(99,102,241,0.12)' },
  { value: 'COMPLETED', label: '✓ Completed',    color: '#16a34a', bg: 'rgba(34,197,94,0.12)'  },
  { value: 'ON_HOLD',   label: '⏸ On Hold',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)'},
];

export default function MemberDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [stats, setStats]                       = useState(null);
  const [projectsProgress, setProjectsProgress] = useState([]);
  const [upcomingTasks, setUpcomingTasks]        = useState([]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [dashData, progressData] = await Promise.allSettled([
        dashboardApi.getUserDashboard(),
        dashboardApi.getProjectsProgress(6),
      ]);

      if (dashData.status === 'fulfilled') setStats(dashData.value);
      if (progressData.status === 'fulfilled') setProjectsProgress(progressData.value || []);

      // Load tasks: iterate over member's projects and collect tasks
      const projects = progressData.status === 'fulfilled'
        ? (progressData.value || [])
        : [];

      const collected = [];
      for (const p of projects) {
        try {
          const t = await tasksApi.getByProject(p.projectId);
          if (Array.isArray(t)) {
            t.forEach((task) => {
              // Only add tasks assigned to current user
              const isAssigned =
                !task.assigneeIds?.length || // unfiltered task — include
                task.assigneeIds?.includes(user?.id) ||
                task.assigneeNames?.some((n) =>
                  n?.toLowerCase().includes(user?.fullName?.split(' ')[0]?.toLowerCase())
                );
              if (isAssigned) {
                collected.push({ ...task, projectName: p.projectName });
              }
            });
          }
        } catch { /* skip inaccessible */ }
      }

      // Sort by due date, exclude completed/done, take nearest 7
      const upcoming = collected
        .filter((t) => t.dueDate && t.status !== 'DONE' && t.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 7);

      setUpcomingTasks(upcoming);
    } finally {
      setLoading(false);
    }
  };

  /** helpers */
  const daysUntil = (dateStr) => Math.ceil((new Date(dateStr) - new Date()) / 86400000);

  const deadlineUrgency = (days) => {
    if (days < 0)   return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: `${Math.abs(days)}d overdue` };
    if (days === 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Due today!' };
    if (days <= 2)  return { color: '#f97316', bg: 'rgba(249,115,22,0.1)',  label: `${days}d left` };
    if (days <= 5)  return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: `${days}d left` };
    if (days <= 14) return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  label: `${days}d left` };
    return               { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    label: `${days}d left` };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return '#22c55e';
    if (pct >= 40) return '#6366f1';
    return '#f59e0b';
  };

  const getStatusStyle = (status) =>
    PROJECT_STATUSES.find((s) => s.value === status) ||
    { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', label: status || '—' };

  const getPriorityStyle = (priority) => {
    if (priority === 'URGENT' || priority === 'HIGH') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (priority === 'MEDIUM') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const completionPct = Math.min(stats?.overallCompletionPercentage ?? 0, 100);
  const pendingTasks  = (stats?.totalTasks ?? 0) - (stats?.completedTasks ?? 0);

  const statCards = [
    {
      label: 'My Projects', value: stats?.totalProjects ?? 0,
      icon: FolderKanban,   color: '#6366f1', bg: 'rgba(99,102,241,0.12)',
      sub: `${stats?.activeProjects ?? 0} active`,
    },
    {
      label: 'My Tasks', value: stats?.totalTasks ?? 0,
      icon: CheckSquare,  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
      sub: `${stats?.completedTasks ?? 0} done (${completionPct.toFixed(0)}%)`,
    },
    {
      label: 'Pending',  value: pendingTasks < 0 ? 0 : pendingTasks,
      icon: Clock,       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
      sub: 'tasks remaining',
    },
    {
      label: 'Overdue',  value: stats?.overdueTasks ?? 0,
      icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)',
      sub: 'need attention!',
    },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.fullName}!</h1>
        <p className="page-subtitle">Your personal task &amp; project overview.</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">{stat.label}</p>
                <p className="stat-card-value">{stat.value}</p>
                <p style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  {stat.sub}
                </p>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 2-col Grid ── */}
      <div className="content-grid" style={{ marginTop: '1.5rem' }}>

        {/* My Projects Progress */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">My Projects</h2>
            <button className="card-link" onClick={() => navigate('/projects')}>View All →</button>
          </div>
          <div className="card-content">
            {projectsProgress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <FolderKanban size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>No projects assigned yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {projectsProgress.map((p) => {
                  const pct         = Math.min(p.completionPercentage || 0, 100);
                  const color       = getProgressColor(pct);
                  const statusStyle = getStatusStyle(p.projectStatus);
                  return (
                    <div
                      key={p.projectId}
                      onClick={() => navigate(`/projects/${p.projectId}`)}
                      style={{
                        padding: '1rem 1.1rem', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-neutral)',
                        background: 'var(--color-surface-raised)',
                        cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 650, fontSize: '0.9rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.projectName}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                          borderRadius: '99px', background: statusStyle.bg, color: statusStyle.color,
                        }}>
                          {statusStyle.label}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color, minWidth: '38px', textAlign: 'right' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                        <CheckSquare size={11} /> {p.completedTasks}/{p.totalTasks} tasks done
                      </p>
                      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: color, transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Task Deadlines */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={18} style={{ color: '#f59e0b' }} />
                Upcoming Task Deadlines
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                Your tasks sorted by nearest due date
              </p>
            </div>
            <button className="card-link" onClick={() => navigate('/tasks')}>View All →</button>
          </div>
          <div className="card-content">
            {upcomingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <CheckSquare size={26} style={{ color: '#22c55e' }} />
                </div>
                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>All clear!</p>
                <p style={{ fontSize: '0.82rem' }}>No upcoming task deadlines 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upcomingTasks.map((task) => {
                  const days        = daysUntil(task.dueDate);
                  const urgency     = deadlineUrgency(days);
                  const prioritySt  = getPriorityStyle(task.priority);
                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate('/tasks')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${urgency.bg}`,
                        background: 'var(--color-surface-raised)',
                        cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      {/* Urgency indicator */}
                      <div style={{
                        width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
                        background: urgency.color,
                        boxShadow: days <= 2 ? `0 0 6px ${urgency.color}` : 'none',
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.855rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {task.title}
                          </p>
                          {task.priority && (
                            <span style={{
                              fontSize: '0.6rem', fontWeight: 700, padding: '0.08rem 0.35rem',
                              borderRadius: '99px', background: prioritySt.bg, color: prioritySt.color,
                              whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={10} />
                          <span>{formatDate(task.dueDate)}</span>
                          {task.projectName && (
                            <>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <FolderKanban size={10} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.projectName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        padding: '0.2rem 0.5rem', borderRadius: '99px',
                        background: urgency.bg, color: urgency.color,
                        whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start', marginTop: '0.02rem',
                      }}>
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

      {/* ── Performance Summary ── */}
      {stats && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={19} style={{ color: '#6366f1' }} /> My Performance
            </h2>
          </div>
          <div className="card-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

              {/* Completion rate */}
              <div style={{ padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Task Completion Rate</p>
                  <span style={{ fontWeight: 800, fontSize: '1.35rem', color: '#6366f1' }}>{completionPct.toFixed(0)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                    {stats.completedTasks ?? 0} of {stats.totalTasks ?? 0} tasks completed
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${completionPct}%`, borderRadius: '99px',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    transition: 'width 0.9s ease',
                  }} />
                </div>
              </div>

              {/* Overdue status */}
              <div style={{
                padding: '1rem',
                background: (stats?.overdueTasks ?? 0) > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${(stats?.overdueTasks ?? 0) > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.65rem', fontWeight: 500 }}>Overdue Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {(stats?.overdueTasks ?? 0) > 0 ? (
                    <>
                      <AlertTriangle size={22} style={{ color: '#ef4444' }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ef4444' }}>
                          {stats.overdueTasks} overdue
                        </p>
                        <p style={{ fontSize: '0.72rem', color: '#ef4444', opacity: 0.8 }}>Please address these</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Zap size={22} style={{ color: '#22c55e' }} />
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#22c55e' }}>All on track!</p>
                        <p style={{ fontSize: '0.72rem', color: '#22c55e', opacity: 0.8 }}>Great work, keep it up!</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
