import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FolderKanban, Search, Calendar, Users, MoreVertical,
  Edit, Trash2, UserPlus, Check, UserCheck, ChevronRight, Tag
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { usersApi } from '../../api/users';
import { dashboardApi } from '../../api/dashboard';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const getProgressColor = (pct) => {
  if (pct >= 100) return 'linear-gradient(90deg, #22c55e, #10b981)';
  if (pct >= 80)  return '#22c55e';
  if (pct >= 60)  return '#06b6d4';
  if (pct >= 40)  return '#6366f1';
  if (pct >= 20)  return '#f59e0b';
  return '#ef4444';
};

/** ── Tag definitions ── */
const ALL_TAGS = [
  { id: 'research',   label: 'Research',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { id: 'development',label: 'Development', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  { id: 'design',     label: 'Design',      color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { id: 'marketing',  label: 'Marketing',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { id: 'qa',         label: 'QA',          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
  { id: 'devops',     label: 'DevOps',      color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { id: 'planning',   label: 'Planning',    color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { id: 'support',    label: 'Support',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
];

const TAG_PREFIX = '[tags:';
const TAG_SUFFIX = ']';

/** Extract tags array from description string */
function parseTags(description = '') {
  const match = (description || '').match(/\[tags:([^\]]*)\]/);
  if (!match) return [];
  return match[1].split(',').map((t) => t.trim()).filter(Boolean);
}

/** Strip tag block from description */
function stripTags(description = '') {
  return (description || '').replace(/\s*\[tags:[^\]]*\]\s*/g, '').trim();
}

/** Inject tags into description */
function injectTags(description = '', tags = []) {
  const clean = stripTags(description);
  if (tags.length === 0) return clean;
  return `${clean} [tags:${tags.join(',')}]`.trim();
}

function TagChip({ tagId }) {
  const def = ALL_TAGS.find((t) => t.id === tagId);
  if (!def) return null;
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700,
      padding: '0.12rem 0.45rem', borderRadius: '99px',
      background: def.bg, color: def.color,
      border: `1px solid ${def.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {def.label}
    </span>
  );
}

function TagSelector({ selected, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
      {ALL_TAGS.map((tag) => {
        const isSelected = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              if (isSelected) {
                onChange(selected.filter((t) => t !== tag.id));
              } else {
                onChange([...selected, tag.id]);
              }
            }}
            style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.25rem 0.65rem', borderRadius: '99px',
              background: isSelected ? tag.bg : 'transparent',
              color: isSelected ? tag.color : 'var(--color-text-secondary)',
              border: `1.5px solid ${isSelected ? tag.color : 'var(--color-neutral)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            {isSelected && <Check size={11} />}
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [createTags, setCreateTags] = useState([]);
  const [createForm, setCreateForm] = useState({ name: '', description: '', startDate: '', endDate: '' });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: '', startDate: '', endDate: '', managerId: '' });
  const [editTags, setEditTags] = useState([]);

  // Progress cache
  const [progressMap, setProgressMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeMenu, setActiveMenu] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isAdmin = user?.role === 'ADMIN';

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsApi.list();
      setProjects(data || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const data = await usersApi.list();
      setAllUsers(data || []);
    } catch { /* non-admin may not access */ }
  }, []);

  const loadProgress = useCallback(async (projectList) => {
    if (!projectList || projectList.length === 0) return;
    try {
      const progressData = await dashboardApi.getProjectsProgress(projectList.length + 5);
      if (Array.isArray(progressData)) {
        const map = {};
        progressData.forEach((p) => { map[p.projectId] = p; });
        setProgressMap(map);
      }
    } catch { /* non-blocking */ }
  }, []);

  useEffect(() => {
    loadProjects();
    if (canManage) loadAllUsers();
  }, []);

  useEffect(() => {
    if (projects.length > 0) loadProgress(projects);
  }, [projects]);

  const toggleMember = (uid) => {
    setSelectedMemberIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const managerEligible = allUsers
    .filter((u) => u.role === 'MANAGER')
    .filter((u) => !managerSearch ||
      u.fullName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(managerSearch.toLowerCase())
    );

  const memberEligible = allUsers.filter((u) => {
    const isSelf = u.id === user.id;
    const isSelectedManager = u.id === Number(selectedManagerId);
    const matchesSearch = !memberSearch ||
      u.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(memberSearch.toLowerCase());
    // Only TEAM_MEMBER role — no admins, no managers
    return !isSelf && !isSelectedManager && matchesSearch && u.role === 'TEAM_MEMBER';
  });

  // ── CREATE ─────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fullDesc = injectTags(createForm.description, createTags);
      const payload = {
        name: createForm.name,
        description: fullDesc,
        startDate: createForm.startDate ? `${createForm.startDate}T00:00:00` : null,
        endDate: createForm.endDate ? `${createForm.endDate}T00:00:00` : null,
        managerId: selectedManagerId ? Number(selectedManagerId) : null,
      };
      const created = await projectsApi.create(payload);
      for (const uid of selectedMemberIds) {
        try { await projectsApi.addMember(created.id, uid); } catch { /* skip */ }
      }
      toast.success('Project created successfully!');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', startDate: '', endDate: '' });
      setSelectedManagerId('');
      setSelectedMemberIds([]);
      setMemberSearch('');
      setManagerSearch('');
      setCreateTags([]);
      loadProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
  };

  // ── EDIT ──────────────────────────────────
  const openEditModal = (project) => {
    setEditingProject(project);
    const cleanDesc = stripTags(project.description || '');
    const tags = parseTags(project.description || '');
    setEditForm({
      name: project.name,
      description: cleanDesc,
      status: project.status || 'PLANNING',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      managerId: '',
    });
    setEditTags(tags);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const fullDesc = injectTags(editForm.description, editTags);
      const payload = {
        name: editForm.name,
        description: fullDesc,
        status: editForm.status,
        startDate: editForm.startDate ? `${editForm.startDate}T00:00:00` : null,
        endDate: editForm.endDate ? `${editForm.endDate}T00:00:00` : null,
        managerId: editForm.managerId ? Number(editForm.managerId) : null,
      };
      await projectsApi.update(editingProject.id, payload);
      toast.success('Project updated successfully!');
      setShowEditModal(false);
      setEditingProject(null);
      loadProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to update project');
    }
  };

  // ── DELETE ───────────────────────────────
  const requestDelete = (project) => {
    setProjectToDelete(project);
    setActiveMenu(null);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await projectsApi.delete(projectToDelete.id);
      toast.success('Project deleted');
      setProjectToDelete(null);
      loadProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
    }
  };

  // ── Helpers ──────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressColor = (pct) => {
    if (pct >= 100) return '#22c55e';
    if (pct >= 60)  return '#6366f1';
    if (pct >= 30)  return '#f59e0b';
    return '#94a3b8';
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner text="Loading projects..." />;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all your projects</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => {
            setCreateForm({ name: '', description: '', startDate: '', endDate: '' });
            setSelectedManagerId('');
            setSelectedMemberIds([]);
            setMemberSearch('');
            setManagerSearch('');
            setCreateTags([]);
            setShowCreateModal(true);
          }}>
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
        </div>
        <div className="filter-group">
          {['ALL', 'PLANNING', 'ONGOING', 'COMPLETED', 'ON_HOLD'].map((status) => (
            <button
              key={status}
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description={searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
          action={canManage && !searchQuery && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Project
            </button>
          )}
        />
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const prog = progressMap[project.id];
            const pct = prog ? Math.min(prog.completionPercentage || 0, 100) : 0;
            const barColor = getProgressColor(pct);
            const projectTags = parseTags(project.description || '');
            const cleanDescription = stripTags(project.description || '');

            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Card header */}
                <div className="project-card-header">
                  <div className="project-card-icon"><FolderKanban size={20} /></div>
                  <div className="project-card-actions">
                    <StatusBadge status={project.status} />
                    {canManage && (
                      <div className="dropdown-wrapper">
                        <button className="icon-btn" onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === project.id ? null : project.id);
                        }}>
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === project.id && (
                          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button className="dropdown-item" onClick={() => openEditModal(project)}>
                              <Edit size={14} /> Edit
                            </button>
                            {isAdmin && (
                              <button className="dropdown-item danger" onClick={() => requestDelete(project)}>
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + description */}
                <h3 className="project-card-title">{project.name}</h3>
                <p className="project-card-description">{cleanDescription || 'No description'}</p>

                {/* Tags */}
                {projectTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.65rem' }}>
                    {projectTags.map((t) => <TagChip key={t} tagId={t} />)}
                  </div>
                )}

                {/* Manager row */}
                {project.managerName && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.78rem', color: 'var(--color-text-secondary)',
                    marginBottom: '0.65rem',
                  }}>
                    <UserCheck size={13} style={{ color: '#6366f1' }} />
                    <span style={{ fontWeight: 500 }}>Manager:</span>
                    <span>{project.managerName}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                      {prog ? `${prog.completedTasks}/${prog.totalTasks} tasks` : 'Loading...'}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: (pct >= 100 ? '#10b981' : barColor) }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: '5px', borderRadius: '99px', background: 'var(--color-neutral)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '99px', background: barColor, transition: 'width 0.6s ease' }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="project-card-meta">
                  <div className="project-card-meta-item">
                    <Users size={13} />
                    <span>{project.memberCount || 0} members</span>
                  </div>
                  <div className="project-card-meta-item">
                    <Calendar size={13} />
                    <span>{formatDate(project.endDate)}</span>
                  </div>
                </div>

                <div className="project-card-footer">
                  <span className="project-card-owner">Owner: {project.ownerName || '—'}</span>
                  <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Project" size="lg">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text" className="form-input no-icon"
              placeholder="Enter project name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea" rows={3}
              placeholder="Describe the project..."
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={14} style={{ color: '#6366f1' }} /> Project Tags
            </label>
            <TagSelector selected={createTags} onChange={setCreateTags} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input no-icon"
                value={createForm.startDate}
                onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input no-icon"
                value={createForm.endDate}
                onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })} />
            </div>
          </div>

          {/* Manager selection — Admin only — avatar-picker style */}
          {isAdmin && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={14} style={{ color: '#6366f1' }} />
                Assign Manager
                {selectedManagerId && (
                  <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#6366f1', marginLeft: '0.4rem' }}>
                    {managerEligible.find((u) => u.id === Number(selectedManagerId))?.fullName || allUsers.find((u) => u.id === Number(selectedManagerId))?.fullName || ''} selected
                  </span>
                )}
              </label>
              <input
                type="text"
                className="form-input no-icon"
                placeholder="Search managers..."
                value={managerSearch}
                onChange={(e) => setManagerSearch(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div className="member-picker">
                {/* No manager option */}
                <div
                  className={`member-picker-item ${!selectedManagerId ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedManagerId('');
                    setMemberSearch('');
                  }}
                  style={{ opacity: 0.7 }}
                >
                  <div className="member-picker-avatar" style={{ background: 'var(--color-neutral)', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>—</div>
                  <div className="member-picker-info">
                    <span className="member-picker-name">No manager assigned</span>
                    <span className="member-picker-email">Optional</span>
                  </div>
                  {!selectedManagerId && <Check size={16} className="member-picker-check" />}
                </div>
                {managerEligible.length === 0 && managerSearch ? (
                  <p style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No managers match your search</p>
                ) : managerEligible.length === 0 && !managerSearch ? (
                  <p style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>No managers found in the system</p>
                ) : (
                  managerEligible.map((u) => {
                    const isSelected = Number(selectedManagerId) === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`member-picker-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedManagerId(isSelected ? '' : String(u.id));
                          setSelectedMemberIds((prev) => prev.filter((id) => id !== u.id));
                        }}
                      >
                        <div className="member-picker-avatar">{u.fullName?.charAt(0)}</div>
                        <div className="member-picker-info">
                          <span className="member-picker-name">{u.fullName}</span>
                          <span className="member-picker-email">{u.email} · Manager</span>
                        </div>
                        {isSelected && <Check size={16} className="member-picker-check" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Team member selection — TEAM_MEMBER role only */}
          {allUsers.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <UserPlus size={14} style={{ marginRight: '0.4rem' }} />
                Add Team Members ({selectedMemberIds.length} selected)
              </label>
              <input
                type="text" className="form-input no-icon"
                placeholder="Search by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              />
              <div className="member-picker">
                {memberEligible.length === 0 ? (
                  <p style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                    {memberSearch ? 'No team members match your search' : 'No team members available to add'}
                  </p>
                ) : (
                  memberEligible.map((u) => {
                    const selected = selectedMemberIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className={`member-picker-item ${selected ? 'selected' : ''}`}
                        onClick={() => toggleMember(u.id)}
                      >
                        <div className="member-picker-avatar">{u.fullName?.charAt(0)}</div>
                        <div className="member-picker-info">
                          <span className="member-picker-name">{u.fullName}</span>
                          <span className="member-picker-email">{u.email} · Team Member</span>
                        </div>
                        {selected && <Check size={16} className="member-picker-check" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <form onSubmit={handleEdit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input type="text" className="form-input no-icon"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={14} style={{ color: '#6366f1' }} /> Project Tags
            </label>
            <TagSelector selected={editTags} onChange={setEditTags} />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input no-icon"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="PLANNING">🗂 Planning</option>
              <option value="ONGOING">⚡ In Progress</option>
              <option value="COMPLETED">✓ Completed</option>
              <option value="ON_HOLD">⏸ On Hold</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input no-icon"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-input no-icon"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
            </div>
          </div>

          {/* Change Manager — Admin only */}
          {isAdmin && managerEligible.length > 0 && (
            <div className="form-group">
              <label className="form-label">
                <UserCheck size={14} style={{ marginRight: '0.4rem', color: '#6366f1' }} />
                Change Manager
                {editingProject?.managerName && (
                  <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                    (current: {editingProject.managerName})
                  </span>
                )}
              </label>
              <select
                className="form-input no-icon"
                value={editForm.managerId}
                onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
              >
                <option value="">— Keep current manager —</option>
                {managerEligible.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title="Delete Project"
        size="sm"
      >
        <div>
          <p style={{ marginBottom: '0.5rem' }}>
            Are you sure you want to delete <strong>{projectToDelete?.name || 'this project'}</strong>?
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setProjectToDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-error)' }}
              onClick={handleDelete}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
