import { useState, useEffect } from 'react';
import {
  Users, FolderKanban, CheckSquare, AlertTriangle,
  Search, Target, Activity, BarChart2
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import { useToast } from '../../components/ui/Toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#ec4899','#14b8a6',
];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
const isCompletedProject = (status) => normalizeText(status) === 'completed';
const isCompletedTask = (status) => {
  const s = normalizeText(status);
  return s === 'done' || s === 'completed';
};

export default function TeamMembersPage() {
  const toast = useToast();

  const [members, setMembers] = useState([]);   // { userId, userName, email, projectRole, taskCount, completedTasks, pendingTasks, projectNames }
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  /* stats modal */
  const [statsModal, setStatsModal]     = useState(false);
  const [statsTarget, setStatsTarget]   = useState(null);
  const [statsData, setStatsData]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { loadTeam(); }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const projects = await projectsApi.list();
      const all = projects || [];
      const activeProjects = all.filter((proj) => !isCompletedProject(proj.status));

      // Build member map
      const memberMap = new Map();

      for (const proj of activeProjects) {
        try {
          const [membersRes, tasksRes] = await Promise.allSettled([
            projectsApi.getMembers(proj.id),
            tasksApi.getByProject(proj.id),
          ]);

          const projMembers = membersRes.status === 'fulfilled' ? (membersRes.value || []) : [];
          const projectTasks = tasksRes.status === 'fulfilled' ? (tasksRes.value || []) : [];
          const projectMemberIdsByName = new Map();

          projMembers.forEach((m) => {
            const key = m.userId;
            const normalizedName = normalizeText(m.fullName || m.userName);

            if (memberMap.has(key)) {
              const existing = memberMap.get(key);
              existing.projectNames.push(proj.name);
              existing.projectCount = (existing.projectCount || 1) + 1;
            } else {
              memberMap.set(key, {
                userId:       m.userId,
                userName:     m.fullName || m.userName,
                email:        m.email,
                projectRole:  m.projectRole || m.role || 'TEAM_MEMBER',
                taskCount:    0,
                completedTasks: 0,
                pendingTasks:   0,
                projectNames: [proj.name],
                projectCount: 1,
              });
            }

            if (normalizedName) {
              if (!projectMemberIdsByName.has(normalizedName)) {
                projectMemberIdsByName.set(normalizedName, new Set());
              }
              projectMemberIdsByName.get(normalizedName).add(key);
            }
          });

          projectTasks.forEach((task) => {
            const assignedIds = new Set();
            const assigneeNames = Array.isArray(task.assigneeNames) ? task.assigneeNames : [];

            assigneeNames.forEach((name) => {
              const ids = projectMemberIdsByName.get(normalizeText(name));
              if (ids) {
                ids.forEach((id) => assignedIds.add(id));
              }
            });

            assignedIds.forEach((id) => {
              const member = memberMap.get(id);
              if (!member) return;

              member.taskCount += 1;
              if (isCompletedTask(task.status)) {
                member.completedTasks += 1;
              } else {
                member.pendingTasks += 1;
              }
            });
          });
        } catch { /* skip */ }
      }

      setMembers(
        Array.from(memberMap.values())
          .filter((m) => m.projectRole === 'TEAM_MEMBER' || m.projectRole === 'MEMBER')
          .sort((a, b) => b.taskCount - a.taskCount)
      );
    } catch (err) {
      toast.error(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const openStats = (member) => {
    setStatsTarget(member);
    setStatsModal(true);
    const pct = member.taskCount > 0 ? (member.completedTasks * 100) / member.taskCount : 0;
    setStatsData({
      totalProjects: member.projectCount,
      totalTasks: member.taskCount,
      completedTasks: member.completedTasks,
      pendingTasks: member.pendingTasks,
      overdueTasks: null,
      overallCompletionPercentage: pct,
    });
    setStatsLoading(false);
  };

  const filtered = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.userName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.projectNames?.some((n) => n.toLowerCase().includes(q))
    );
  });

  const maxTasks = Math.max(...filtered.map((m) => m.taskCount), 1);

  if (loading) return <LoadingSpinner text="Loading team..." />;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} style={{ color: '#6366f1' }} /> Team Members
          </h1>
          <p className="page-subtitle">{members.length} members across your active projects</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Members', value: members.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: Users },
          { label: 'Total Tasks Assigned', value: members.reduce((s, m) => s + m.taskCount, 0), color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: CheckSquare },
          { label: 'Completed Tasks', value: members.reduce((s, m) => s + m.completedTasks, 0), color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckSquare },
          { label: 'Pending Tasks', value: members.reduce((s, m) => s + m.pendingTasks, 0), color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">{stat.label}</p>
                <p className="stat-card-value">{stat.value}</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={22} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No members found" description="No team members match your search" />
      ) : (
        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filtered.map((member, i) => {
                const avatarC    = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const completionPct = member.taskCount > 0
                  ? Math.round((member.completedTasks / member.taskCount) * 100)
                  : 0;
                const barPct = completionPct;
                const barColor = member.taskCount === 0
                  ? '#9ca3af'
                  : completionPct >= 70
                    ? '#22c55e'
                    : completionPct >= 40
                      ? '#f59e0b'
                      : '#ef4444';
                const level = member.taskCount === 0 ? 'idle'
                  : member.taskCount >= maxTasks * 0.75 ? 'high' : 'normal';
                const levelColor = level === 'high' ? '#ef4444' : level === 'idle' ? '#9ca3af' : '#6366f1';
                return (
                  <div
                    key={member.userId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem 1.1rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-raised)', border: '1px solid var(--color-neutral)',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: avatarC, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                      {member.userName?.charAt(0)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.userName}</p>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.08rem 0.4rem', borderRadius: '99px', background: `${levelColor}15`, color: levelColor }}>
                          {level === 'high' ? 'Heavy Load' : level === 'idle' ? 'No Tasks' : 'Active'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
                        {member.email} · {member.projectRole?.replace('_', ' ')}
                      </p>

                      {/* Task bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${barPct}%`, borderRadius: '99px', background: barColor, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                          {member.completedTasks}/{member.taskCount} done
                        </span>
                      </div>
                    </div>

                    {/* Stats mini */}
                    <div style={{ display: 'flex', gap: '0.65rem', flexShrink: 0 }}>
                      {[
                        { label: 'Projects', value: member.projectCount, color: '#6366f1' },
                        { label: 'Tasks', value: member.taskCount, color: '#06b6d4' },
                        { label: 'Done', value: member.completedTasks, color: '#22c55e' },
                        { label: 'Pending', value: member.pendingTasks, color: '#f59e0b' },
                      ].map((s) => (
                        <div key={s.label} style={{ textAlign: 'center', minWidth: '45px' }}>
                          <p style={{ fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.value}</p>
                          <p style={{ fontSize: '0.63rem', color: 'var(--color-text-secondary)' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* View stats button */}
                    <button
                      onClick={() => openStats(member)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.85rem', flexShrink: 0 }}
                    >
                      <BarChart2 size={13} /> Stats
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      <Modal isOpen={statsModal} onClose={() => setStatsModal(false)} title="Member Performance" size="md">
        {statsLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><LoadingSpinner text="Loading..." /></div>
        ) : statsTarget && (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--color-neutral)' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem' }}>
                {statsTarget.userName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{statsTarget.userName}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{statsTarget.email}</p>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  {statsTarget.projectNames?.slice(0, 3).map((n, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '99px', background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.25rem' }}>
              {[
                { icon: FolderKanban, label: 'Projects',     value: statsData?.totalProjects  ?? statsTarget.projectCount, color: '#6366f1' },
                { icon: CheckSquare,  label: 'Total Tasks',  value: statsData?.totalTasks     ?? statsTarget.taskCount,    color: '#06b6d4' },
                { icon: Activity,     label: 'Completed',    value: statsData?.completedTasks ?? statsTarget.completedTasks, color: '#22c55e' },
                { icon: AlertTriangle,label: 'Pending',      value: (statsData?.pendingTasks != null)
                    ? statsData.pendingTasks
                    : statsTarget.pendingTasks,
                  color: '#f59e0b' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '0.85rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--color-text-secondary)' }}>{item.label}</p>
                    <p style={{ fontWeight: 700, fontSize: '1.15rem' }}>{item.value ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Completion bar */}
            {(() => {
              const rawPct = Number(
                statsData?.overallCompletionPercentage
                ?? (statsTarget.taskCount > 0 ? (statsTarget.completedTasks * 100) / statsTarget.taskCount : 0)
              );
              const pct = Number.isFinite(rawPct) ? Math.round(rawPct) : 0;
              const clamped = Math.min(Math.max(pct, 0), 100);
              const barColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#6366f1' : '#ef4444';
              const completedCount = Number(statsData?.completedTasks ?? statsTarget.completedTasks ?? 0);
              const totalCount = Number(statsData?.totalTasks ?? statsTarget.taskCount ?? 0);
              return (
                <div style={{ padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Target size={14} style={{ color: '#6366f1' }} /> Task Completion Rate
                    </span>
                    <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${clamped}%`, borderRadius: '99px', background: barColor, transition: 'width 0.9s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.35rem', textAlign: 'right' }}>
                    {completedCount}/{totalCount} tasks completed
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
