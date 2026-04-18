import { useState, useEffect } from 'react';
import {
  Users, Search, Shield, Ban, CheckCircle, MoreVertical,
  FolderKanban, CheckSquare, AlertTriangle, Target, Activity, BarChart2, Edit, User, Mail, Lock
} from 'lucide-react';
import { usersApi } from '../../api/users';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import { dashboardApi } from '../../api/dashboard';
import { useToast } from '../../components/ui/Toast';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

export default function UsersPage() {
  const toast    = useToast();
  const [users, setUsers]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchQuery, setSearchQuery]   = useState('');
  const [roleFilter, setRoleFilter]     = useState('ALL');
  const [activeMenu, setActiveMenu]     = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [newRole, setNewRole]             = useState('');

  /* stats modal */
  const [showStatsModal, setShowStatsModal]   = useState(false);
  const [statsUser, setStatsUser]             = useState(null);
  const [statsData, setStatsData]             = useState(null);
  const [statsLoading, setStatsLoading]       = useState(false);

  /* edit user modal */
  const [showEditModal, setShowEditModal]     = useState(false);
  const [editingUser, setEditingUser]         = useState(null);
  const [editName, setEditName]               = useState('');
  const [editEmail, setEditEmail]             = useState('');
  const [editPassword, setEditPassword]       = useState('');
  const [editSaving, setEditSaving]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.allSettled([usersApi.list(), projectsApi.list()]);
        if (u.status === 'fulfilled') setUsers(u.value || []);
        if (p.status === 'fulfilled') setProjects(p.value || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersApi.list();
      setUsers(data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load users');
    }
  };

  const handleBlock = async (userId) => {
    try { await usersApi.block(userId); toast.success('User blocked'); loadUsers(); }
    catch (err) { toast.error(err.message || 'Failed to block user'); }
    setActiveMenu(null);
  };

  const handleUnblock = async (userId) => {
    try { await usersApi.unblock(userId); toast.success('User unblocked'); loadUsers(); }
    catch (err) { toast.error(err.message || 'Failed to unblock user'); }
    setActiveMenu(null);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await usersApi.changeRole(selectedUser.id, newRole);
      toast.success('Role updated');
      setShowRoleModal(false);
      loadUsers();
    } catch (err) { toast.error(err.message || 'Failed to change role'); }
  };

  const openRoleModal = (u) => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); setActiveMenu(null); };

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditName(u.fullName || '');
    setEditEmail(u.email || '');
    setEditPassword('');
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;
    try {
      setEditSaving(true);
      const payload = {
        fullName: editName.trim(),
        email: editEmail.trim(),
      };
      if (editPassword.trim()) {
        payload.newPassword = editPassword;
      }

      const updatedUser = await usersApi.update(editingUser.id, payload);
      toast.success('User details updated');
      setShowEditModal(false);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                fullName: updatedUser?.fullName || payload.fullName,
                email: updatedUser?.email || payload.email,
              }
            : u
        )
      );
      setEditPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  /**
   * Open stats modal — try backend first; if that fails,
   * compute stats client-side from projects + tasks we already have.
   */
  const openStatsModal = async (u) => {
    setStatsUser(u);
    setShowStatsModal(true);
    setStatsLoading(true);
    setStatsData(null);
    setActiveMenu(null);

    try {
      // Call the real backend endpoint: GET /api/dashboard/user/{id}
      const data = await dashboardApi.getUserStats(u.id);
      setStatsData(data);
    } catch {
      // Backend endpoint failed — compute from project tasks as fallback
      try {
        let totalTasks = 0, completedTasks = 0, overdueTasks = 0;
        const now = new Date();
        for (const proj of projects) {
          try {
            const tasks = await tasksApi.getByProject(proj.id);
            (tasks || []).forEach((t) => {
              if (!t.assigneeIds?.includes(u.id)) return;
              totalTasks++;
              if (t.status === 'DONE' || t.status === 'COMPLETED') completedTasks++;
              else if (t.dueDate && new Date(t.dueDate) < now) overdueTasks++;
            });
          } catch { /* skip */ }
        }
        const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        setStatsData({ totalProjects: projects.length, totalTasks, completedTasks, overdueTasks, overallCompletionPercentage: pct });
      } catch {
        setStatsData({ _error: true });
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchesRole   = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    total:  users.length,
    admin:   users.filter((u) => u.role === 'ADMIN').length,
    manager: users.filter((u) => u.role === 'MANAGER').length,
    member:  users.filter((u) => u.role === 'TEAM_MEMBER').length,
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Manage roles, access, and view member performance</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Users',   value: counts.total,   color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: Users },
          { label: 'Admins',        value: counts.admin,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: Shield },
          { label: 'Managers',      value: counts.manager, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: Users },
          { label: 'Team Members',  value: counts.member,  color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: Users },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">{s.label}</p>
                <p className="stat-card-value">{s.value}</p>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input type="text" placeholder="Search by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="filter-search-input" />
        </div>
        <div className="filter-group">
          {['ALL', 'ADMIN', 'MANAGER', 'TEAM_MEMBER'].map((role) => (
            <button key={role} className={`filter-chip ${roleFilter === role ? 'active' : ''}`} onClick={() => setRoleFilter(role)}>
              {role === 'ALL' ? 'All' : role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try a different search or filter" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="activity-avatar">{u.fullName?.charAt(0)}</div>
                        <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.status || 'ACTIVE'} /></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="dropdown-wrapper">
                        <button className="icon-btn" onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}>
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === u.id && (
                          <div className="dropdown-menu">
                            <button className="dropdown-item" onClick={() => openStatsModal(u)}>
                              <BarChart2 size={14} /> View Stats
                            </button>
                            <button className="dropdown-item" onClick={() => openEditModal(u)}>
                              <Edit size={14} /> Edit Details
                            </button>
                            <button className="dropdown-item" onClick={() => openRoleModal(u)}>
                              <Shield size={14} /> Change Role
                            </button>
                            {u.status === 'BLOCKED' ? (
                              <button className="dropdown-item" onClick={() => handleUnblock(u.id)}>
                                <CheckCircle size={14} /> Unblock
                              </button>
                            ) : (
                              <button className="dropdown-item danger" onClick={() => handleBlock(u.id)}>
                                <Ban size={14} /> Block
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Change Role Modal ── */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change User Role" size="sm">
        <div className="modal-form">
          <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
            Changing role for <strong>{selectedUser?.fullName}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">New Role</label>
            <select className="form-input no-icon" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="TEAM_MEMBER">Team Member</option>
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setShowRoleModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleChangeRole}>Update Role</button>
          </div>
        </div>
      </Modal>

      {/* ── User Stats Modal ── */}
      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Member Performance Stats" size="md">
        {statsLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <LoadingSpinner text="Loading stats..." />
          </div>
        ) : statsData?._error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <BarChart2 size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p>Stats could not be retrieved for this user.</p>
          </div>
        ) : statsUser && statsData && (
          <div style={{ padding: '0.5rem 0' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)', marginBottom: '1.25rem' }}>
              <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.3rem' }}>
                {statsUser.fullName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{statsUser.fullName}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{statsUser.email}</p>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '99px', marginTop: '0.3rem', display: 'inline-block', background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
                  {statsUser.role?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.25rem' }}>
              {[
                { icon: FolderKanban, label: 'Projects',     value: statsData.totalProjects,  color: '#6366f1' },
                { icon: CheckSquare,  label: 'Total Tasks',  value: statsData.totalTasks,     color: '#06b6d4' },
                { icon: Activity,     label: 'Completed',    value: statsData.completedTasks, color: '#22c55e' },
                { icon: AlertTriangle,label: 'Overdue',      value: statsData.overdueTasks,   color: '#ef4444' },
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
              const pct = statsData.overallCompletionPercentage
                ?? (statsData.totalTasks > 0 ? Math.round((statsData.completedTasks / statsData.totalTasks) * 100) : 0);
              const clamped  = Math.min(pct, 100);
              const barColor = pct >= 70 ? '#22c55e' : pct >= 40 ? '#6366f1' : '#ef4444';
              return (
                <div style={{ padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Target size={14} style={{ color: '#6366f1' }} /> Overall Task Completion
                    </span>
                    <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${clamped}%`, borderRadius: '99px', background: barColor, transition: 'width 0.9s ease' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem', textAlign: 'right' }}>
                    {statsData.completedTasks ?? '—'} of {statsData.totalTasks ?? '—'} tasks completed
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* ── Edit User Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Details" size="sm">
        <form className="modal-form" onSubmit={handleEditUser}>
          {editingUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral)', marginBottom: '1.25rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                {editingUser.fullName?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{editingUser.fullName}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {editingUser.email} · {editingUser.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input
                type="text"
                className="form-input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                minLength={2}
                placeholder="Enter full name"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                placeholder="Enter email"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">New Password (optional)</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
