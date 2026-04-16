import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckSquare, Calendar, Edit, Trash2, Plus,
  UserPlus, UserMinus, MessageSquare, Check, Search,
  Paperclip, Upload, Download, X, FileText, Image, Film, File,
} from 'lucide-react';
import { projectsApi }   from '../../api/projects';
import { tasksApi }      from '../../api/tasks';
import { usersApi }      from '../../api/users';
import { commentsApi }   from '../../api/comments';
import { attachmentsApi } from '../../api/attachments';
import { useAuthFile, downloadAuthFile } from '../../hooks/useAuthFile';
import { useToast }      from '../../components/ui/Toast';
import { useAuth }       from '../../context/AuthContext';
import Modal             from '../../components/ui/Modal';
import StatusBadge       from '../../components/ui/StatusBadge';
import LoadingSpinner    from '../../components/ui/LoadingSpinner';

/* ── Kanban column config ── */
const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const STATUS_META = {
  TODO:        { label: 'To Do',       color: '#6b7280', accent: 'rgba(107,114,128,0.15)' },
  IN_PROGRESS: { label: 'In Progress', color: '#6366f1', accent: 'rgba(99,102,241,0.15)'  },
  REVIEW:      { label: 'Review',      color: '#f59e0b', accent: 'rgba(245,158,11,0.15)'  },
  DONE:        { label: 'Done',        color: '#22c55e', accent: 'rgba(34,197,94,0.15)'   },
};
const PRIORITY_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444' };

/* ── File icon helper ── */
const FileIcon = ({ mime }) => {
  if (!mime) return <File size={14} />;
  if (mime.startsWith('image/')) return <Image size={14} style={{ color: '#06b6d4' }} />;
  if (mime.startsWith('video/')) return <Film size={14} style={{ color: '#8b5cf6' }} />;
  return <FileText size={14} style={{ color: '#6366f1' }} />;
};

/* ── Authenticated attachment card ── */
function AttachmentCard({ att, onDelete }) {
  const isImage    = att.fileType?.startsWith('image/');
  const { blobUrl } = useAuthFile(isImage ? att.fileUrl : null);

  const handleDownload = async (e) => {
    e.stopPropagation();
    await downloadAuthFile(att.fileUrl, att.filename);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface-raised)', border: '1px solid var(--color-neutral)',
    }}>
      {isImage ? (
        <div onClick={handleDownload} title="Download" style={{ flexShrink: 0, cursor: 'pointer' }}>
          {blobUrl
            ? <img src={blobUrl} alt={att.filename} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
            : <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image size={16} style={{ color: '#06b6d4' }} /></div>
          }
        </div>
      ) : (
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileIcon mime={att.fileType} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.filename}</p>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
          by {att.uploaderName} · {new Date(att.uploadedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <button className="icon-btn" title="Download" onClick={handleDownload}><Download size={14} /></button>
      <button className="icon-btn" title="Remove" style={{ color: 'var(--color-danger)' }} onClick={() => onDelete(att.id)}><X size={14} /></button>
    </div>
  );
}

const fmt  = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtT = (d) => d ? new Date(d).toLocaleString('en-US',  { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ════════════════════ MAIN COMPONENT ════════════════════ */
export default function ProjectDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const toast      = useToast();

  const [project, setProject] = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  /* member management */
  const [allUsers,          setAllUsers]          = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearch,       setMemberSearch]       = useState('');

  /* task create */
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskForm,            setTaskForm]            = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [] });
  const [pendingFiles,        setPendingFiles]        = useState([]);
  const createFileRef = useRef(null);

  /* task detail */
  const [selectedTask,      setSelectedTask]      = useState(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [comments,          setComments]          = useState([]);
  const [newComment,        setNewComment]        = useState('');
  const [attachments,       setAttachments]       = useState([]);
  const [uploadingFile,     setUploadingFile]     = useState(false);
  const [taskToDelete,      setTaskToDelete]      = useState(null);
  const detailFileRef = useRef(null);

  /* drag & drop */
  const dragTask = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  /* ── loaders ── */
  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setProject(await projectsApi.getById(id));
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally  { setLoading(false); }
  }, [id]);

  const loadTasks = useCallback(async () => {
    try { setTasks((await tasksApi.getByProject(id)) || []); } catch { /* ok */ }
  }, [id]);

  const loadAllUsers = useCallback(async () => {
    try { setAllUsers((await usersApi.list()) || []); } catch { /* ok */ }
  }, []);

  useEffect(() => {
    loadProject();
    loadTasks();
    if (canManage) loadAllUsers();
  }, [id]);

  /* ── member helpers ── */
  const projectMembers = project?.members || [];

  const nonMembers = allUsers
    .filter((u) => !project?.members?.some((m) => m.userId === u.id))
    .filter((u) => {
      const q = memberSearch.toLowerCase();
      const matches = u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const isSelf  = u.id === user.id;
      const allowed = user.role === 'MANAGER' ? u.role === 'TEAM_MEMBER' : true;
      return matches && !isSelf && allowed;
    });

  const handleAddMember = async (userId) => {
    try { await projectsApi.addMember(id, userId); toast.success('Member added!'); loadProject(); }
    catch (err) { toast.error(err.message || 'Failed to add member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await projectsApi.removeMember(id, userId); toast.success('Member removed'); loadProject(); }
    catch (err) { toast.error(err.message || 'Failed to remove member'); }
  };

  /* ── task create ── */
  const toggleAssignee = (uid) =>
    setTaskForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(uid)
        ? f.assigneeIds.filter((i) => i !== uid)
        : [...f.assigneeIds, uid],
    }));

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const created = await tasksApi.create({
        title:       taskForm.title,
        description: taskForm.description,
        projectId:   Number(id),
        priority:    taskForm.priority,
        dueDate:     taskForm.dueDate ? `${taskForm.dueDate}T00:00:00` : null,
      });
      if (taskForm.assigneeIds.length > 0) await tasksApi.assignUsers(created.id, taskForm.assigneeIds);
      /* upload pending files */
      for (const file of pendingFiles) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('taskId', created.id);
          await attachmentsApi.upload(fd);
        } catch { /* non-fatal */ }
      }
      toast.success('Task created!');
      setShowCreateTaskModal(false);
      setPendingFiles([]);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [] });
      loadTasks();
    } catch (err) { toast.error(err.message || 'Failed to create task'); }
  };

  /* ── task detail open ── */
  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
    setComments([]);
    setAttachments([]);
    try { setComments((await commentsApi.getByTask(task.id)) || []);    } catch { /* ok */ }
    try { setAttachments((await attachmentsApi.getByTask(task.id)) || []); } catch { /* ok */ }
  };

  /* ── status change (from modal buttons) ── */
  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : prev);
    try {
      await tasksApi.changeStatus(taskId, newStatus);
      toast.success('Status updated!');
    } catch (err) {
      loadTasks();
      toast.error('Failed to update status');
    }
  };

  /* ── task delete ── */
  const requestDeleteTask = (task) => {
    setTaskToDelete(task);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    try {
      await tasksApi.delete(taskId);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTaskToDelete(null);
      setShowTaskDetailModal(false);
      setSelectedTask(null);
    } catch (err) { toast.error('Failed to delete task'); }
  };

  /* ── comments ── */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentsApi.add(selectedTask.id, newComment);
      setNewComment('');
      setComments((await commentsApi.getByTask(selectedTask.id)) || []);
    } catch { toast.error('Failed to add comment'); }
  };

  const handleDeleteComment = async (cId) => {
    try {
      await commentsApi.delete(selectedTask.id, cId);
      setComments((prev) => prev.filter((c) => c.id !== cId));
    } catch { toast.error('Failed to delete comment'); }
  };

  /* ── file upload in detail modal ── */
  const handleDetailFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFile(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('taskId', selectedTask.id);
        const res = await attachmentsApi.upload(fd);
        setAttachments((prev) => [...prev, res]);
      }
      toast.success(`${files.length} file(s) uploaded`);
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setUploadingFile(false); e.target.value = ''; }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await attachmentsApi.delete(attId);
      setAttachments((prev) => prev.filter((a) => a.id !== attId));
      toast.success('File removed');
    } catch { toast.error('Failed to remove file'); }
  };

  /* ── kanban drag & drop ── */
  const onDragStart = (e, task) => {
    dragTask.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.45';
  };
  const onDragEnd   = (e) => { e.currentTarget.style.opacity = ''; setDragOver(null); };
  const onDragOver  = (e, status) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(status); };

  const onDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOver(null);
    const task = dragTask.current;
    dragTask.current = null;
    if (!task || task.status === targetStatus) return;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: targetStatus } : t));
    try {
      await tasksApi.changeStatus(task.id, targetStatus);
      toast.success(`Moved to ${STATUS_META[targetStatus].label}`);
    } catch (err) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
      toast.error('Failed to update status');
    }
  };

  /* ── derived ── */
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s)]));

  if (loading) return <LoadingSpinner text="Loading project..." />;
  if (!project) return null;

  /* ════════════════════ JSX ════════════════════ */
  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/projects')}>
        <ArrowLeft size={18} /> Back to Projects
      </button>

      {/* ── Project header ── */}
      <div className="project-detail-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 className="page-title">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="page-subtitle">{project.description || 'No description provided'}</p>
          <div className="project-detail-meta">
            <span><Users size={14} /> {project.memberCount || 0} members</span>
            <span><Calendar size={14} /> {fmt(project.startDate)} → {fmt(project.endDate)}</span>
            <span>Owner: {project.ownerName}</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {['overview', 'tasks', 'members'].map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'tasks'   && <span className="tab-badge">{tasks.length}</span>}
            {tab === 'members' && <span className="tab-badge">{projectMembers.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
          {[
            { label: 'Total Tasks',  value: tasks.length,                cls: 'tertiary' },
            { label: 'In Progress',  value: byStatus.IN_PROGRESS.length, cls: 'primary'  },
            { label: 'In Review',    value: byStatus.REVIEW.length,      cls: 'warning'  },
            { label: 'Completed',    value: byStatus.DONE.length,        cls: 'success'  },
          ].map(({ label, value, cls }) => (
            <div key={label} className="stat-card">
              <div className="stat-card-header">
                <div>
                  <p className="stat-card-label">{label}</p>
                  <p className="stat-card-value">{value}</p>
                </div>
                <div className={`stat-card-icon ${cls}`}><CheckSquare size={24} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          Tasks Tab — Kanban with DnD + Delete
      ══════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div style={{ marginTop: '1.5rem' }}>
          {canManage && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => {
                setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [] });
                setPendingFiles([]);
                setShowCreateTaskModal(true);
              }}>
                <Plus size={18} /> Add Task
              </button>
            </div>
          )}

          <div className="kanban-board">
            {STATUSES.map((status) => {
              const meta   = STATUS_META[status];
              const isOver = dragOver === status;
              return (
                <div
                  key={status}
                  className="kanban-column"
                  onDragOver={(e) => onDragOver(e, status)}
                  onDrop={(e) => onDrop(e, status)}
                  onDragLeave={() => setDragOver(null)}
                  style={{
                    outline: isOver ? `2px dashed ${meta.color}` : '2px dashed transparent',
                    outlineOffset: '3px',
                    background: isOver ? meta.accent : undefined,
                    transition: 'outline 0.15s, background 0.15s',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div className="kanban-column-header" style={{ borderLeft: `3px solid ${meta.color}`, paddingLeft: '0.5rem' }}>
                    <h3 style={{ color: meta.color }}>{meta.label}</h3>
                    <span className="kanban-count">{byStatus[status].length}</span>
                  </div>

                  <div className="kanban-cards">
                    {byStatus[status].map((task) => (
                      <div
                        key={task.id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => openTaskDetail(task)}
                        style={{ cursor: 'grab', position: 'relative' }}
                        title="Drag to move · Click to open"
                      >
                        {/* Priority stripe */}
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', borderRadius: '8px 0 0 8px', background: PRIORITY_COLOR[task.priority] || '#6b7280' }} />

                        <div className="kanban-card-header" style={{ paddingLeft: '6px' }}>
                          <StatusBadge status={task.priority} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', userSelect: 'none' }}>⠿</span>
                          <button
                              className="icon-btn"
                              style={{ color: 'var(--color-danger)', padding: '2px', opacity: 0.7 }}
                              title="Delete task"
                              onClick={(e) => { e.stopPropagation(); requestDeleteTask(task); }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className="kanban-card-title" style={{ paddingLeft: '6px' }}>{task.title}</p>
                        <div className="kanban-card-meta" style={{ paddingLeft: '6px' }}>
                          <span><Calendar size={12} /> {fmt(task.dueDate)}</span>
                          {task.assigneeNames?.length > 0 && <span><Users size={12} /> {task.assigneeNames.length}</span>}
                        </div>
                      </div>
                    ))}

                    {byStatus[status].length === 0 && (
                      <div style={{
                        border: `2px dashed ${meta.color}40`, borderRadius: 'var(--radius-md)',
                        padding: '1.5rem', textAlign: 'center', color: meta.color,
                        opacity: isOver ? 0.85 : 0.35, fontSize: '0.8rem', pointerEvents: 'none',
                      }}>
                        Drop here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div style={{ marginTop: '1.5rem' }}>
          {canManage && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => { setMemberSearch(''); setShowAddMemberModal(true); }}>
                <UserPlus size={18} /> Add Member
              </button>
            </div>
          )}
          <div className="card">
            <div className="card-content">
              {projectMembers.length === 0 ? (
                <p style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>No members yet</p>
              ) : (
                <div className="team-list">
                  {projectMembers.map((m) => (
                    <div key={m.userId} className="team-member">
                      <div className="team-member-info">
                        <div className="team-member-avatar">
                          <div className="team-member-avatar-img">{m.fullName?.charAt(0)}</div>
                        </div>
                        <div>
                          <p className="team-member-name">{m.fullName}</p>
                          <p className="team-member-role">{m.email} · {m.projectRole}</p>
                        </div>
                      </div>
                      {canManage && m.userId !== project.ownerId && (
                        <button className="icon-btn" style={{ color: 'var(--color-danger)' }} title="Remove member" onClick={() => handleRemoveMember(m.userId)}>
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          Add Member Modal
      ══════════════════════════════════════ */}
      <Modal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Add Member" size="sm">
        <div className="modal-form">
          <div className="filter-search" style={{ marginBottom: '0.75rem' }}>
            <Search size={16} className="filter-search-icon" />
            <input type="text" className="filter-search-input" placeholder="Search users..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
          </div>
          {nonMembers.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '1rem' }}>All users are already members</p>
          ) : (
            <div className="team-list">
              {nonMembers.map((u) => (
                <div key={u.id} className="team-member" style={{ cursor: 'pointer' }} onClick={() => handleAddMember(u.id)}>
                  <div className="team-member-info">
                    <div className="team-member-avatar"><div className="team-member-avatar-img">{u.fullName?.charAt(0)}</div></div>
                    <div><p className="team-member-name">{u.fullName}</p><p className="team-member-role">{u.email}</p></div>
                  </div>
                  <UserPlus size={16} style={{ color: 'var(--color-primary)' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          Create Task Modal (with file upload)
      ══════════════════════════════════════ */}
      <Modal isOpen={showCreateTaskModal} onClose={() => { setShowCreateTaskModal(false); setPendingFiles([]); }} title="Create Task" size="lg">
        <form onSubmit={handleCreateTask} className="modal-form">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input type="text" className="form-input no-icon" placeholder="Enter task title"
              value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe the task..." rows={3}
              value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input no-icon" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input no-icon" value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>

          {/* Assignees */}
          {projectMembers.length > 0 && (
            <div className="form-group">
              <label className="form-label"><Users size={14} style={{ marginRight: '0.4rem' }} />Assign To ({taskForm.assigneeIds.length} selected)</label>
              <div className="member-picker">
                {projectMembers
                  .filter((m) => user.role === 'ADMIN' || m.userId !== user.id)
                  .filter((m) => user.role !== 'MANAGER' || m.projectRole !== 'ADMIN') /* managers cannot assign admins */
                  .map((m) => {
                  const selected = taskForm.assigneeIds.includes(m.userId);
                  return (
                    <div key={m.userId} className={`member-picker-item ${selected ? 'selected' : ''}`} onClick={() => toggleAssignee(m.userId)}>
                      <div className="member-picker-avatar">{m.fullName?.charAt(0)}</div>
                      <div className="member-picker-info">
                        <span className="member-picker-name">{m.fullName}</span>
                        <span className="member-picker-email">{m.projectRole}</span>
                      </div>
                      {selected && <Check size={16} className="member-picker-check" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* File upload */}
          <div className="form-group">
            <label className="form-label"><Paperclip size={14} style={{ marginRight: '0.4rem' }} />Attach Files (optional)</label>
            <input
              id="detail-create-task-file-input"
              ref={createFileRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                if (selected.length > 0) setPendingFiles((p) => [...p, ...selected]);
                e.target.value = '';
              }}
            />
            <label
              htmlFor="detail-create-task-file-input"
              style={{ display: 'block', border: '2px dashed var(--color-neutral)', borderRadius: 'var(--radius-md)', padding: '1rem', textAlign: 'center', cursor: 'pointer' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files || []);
                if (dropped.length > 0) setPendingFiles((p) => [...p, ...dropped]);
              }}
            >
              <Upload size={20} style={{ color: '#6366f1', margin: '0 auto 0.35rem', display: 'block' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>Click or drag &amp; drop</p>
            </label>
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem' }}>
                {pendingFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral)', fontSize: '0.82rem' }}>
                    <FileIcon mime={f.type} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                    <button type="button" className="icon-btn" onClick={(e) => { e.preventDefault(); setPendingFiles((p) => p.filter((_, idx) => idx !== i)); }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setShowCreateTaskModal(false); setPendingFiles([]); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════
          Task Detail Modal (with attachments)
      ══════════════════════════════════════ */}
      <Modal isOpen={showTaskDetailModal} onClose={() => { setShowTaskDetailModal(false); setSelectedTask(null); }} title="Task Details" size="lg">
        {selectedTask && (
          <div className="task-detail">
            <div className="task-detail-top">
              <h3 className="task-detail-title">{selectedTask.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <StatusBadge status={selectedTask.status} />
                <StatusBadge status={selectedTask.priority} />
                {canManage && (
                  <button className="icon-btn" style={{ color: 'var(--color-danger)' }} title="Delete task" onClick={() => requestDeleteTask(selectedTask)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <p className="task-detail-description">{selectedTask.description || 'No description provided.'}</p>

            <div className="task-detail-info">
              <div className="task-detail-info-item"><span className="label">Due Date</span><span className="value">{fmt(selectedTask.dueDate)}</span></div>
              <div className="task-detail-info-item"><span className="label">Assignees</span><span className="value">{selectedTask.assigneeNames?.join(', ') || 'Unassigned'}</span></div>
            </div>

            {/* Status change */}
            <div className="task-detail-status-change">
              <span className="label">Change Status:</span>
              <div className="status-buttons">
                {STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  return (
                    <button key={s}
                      className={`status-change-btn ${selectedTask.status === s ? 'active' : ''}`}
                      style={selectedTask.status === s ? { background: m.accent, color: m.color, borderColor: m.color } : {}}
                      onClick={() => handleStatusChange(selectedTask.id, s)}
                      disabled={selectedTask.status === s}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Attachments ── */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Paperclip size={16} style={{ color: '#6366f1' }} /> Attachments ({attachments.length})
                </h4>
                <div>
                  <input ref={detailFileRef} type="file" multiple hidden onChange={handleDetailFileUpload} />
                  <button className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                    onClick={() => detailFileRef.current?.click()} disabled={uploadingFile}>
                    {uploadingFile ? 'Uploading…' : <><Upload size={13} /> Upload File</>}
                  </button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', border: '2px dashed var(--color-neutral)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                  <Paperclip size={22} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.4rem' }} />
                  No files attached yet — click "Upload File" to add one.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachments.map((att) => (
                    <AttachmentCard key={att.id} att={att} onDelete={handleDeleteAttachment} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Comments ── */}
            <div className="task-detail-comments">
              <h4><MessageSquare size={16} /> Comments ({comments.length})</h4>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-header">
                        <div className="comment-avatar">{c.authorName?.charAt(0)}</div>
                        <div>
                          <span className="comment-author">{c.authorName}</span>
                          <span className="comment-time">{fmtT(c.createdAt)}</span>
                        </div>
                        <button className="icon-btn comment-delete" onClick={() => handleDeleteComment(c.id)}><Trash2 size={12} /></button>
                      </div>
                      <p className="comment-text">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input-wrapper">
                <input type="text" className="form-input no-icon" placeholder="Write a comment..."
                  value={newComment} onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                <button className="btn btn-primary" onClick={handleAddComment} disabled={!newComment.trim()}>Send</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        title="Delete Task"
        size="sm"
      >
        <div>
          <p style={{ marginBottom: '0.5rem' }}>
            Are you sure you want to delete <strong>{taskToDelete?.title || 'this task'}</strong>?
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setTaskToDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--color-error)' }}
              onClick={handleDeleteTask}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
