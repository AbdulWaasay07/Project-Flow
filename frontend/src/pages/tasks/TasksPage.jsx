import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, CheckSquare, Calendar, Users, MessageSquare,
  Trash2, LayoutGrid, List, Check, Paperclip, Upload,
  X, Download, FileText, Image, Film, File,
} from 'lucide-react';
import { tasksApi }       from '../../api/tasks';
import { projectsApi }    from '../../api/projects';
import { commentsApi }    from '../../api/comments';
import { attachmentsApi } from '../../api/attachments';
import { useAuthFile, downloadAuthFile } from '../../hooks/useAuthFile';
import { useToast }       from '../../components/ui/Toast';
import { useAuth }        from '../../context/AuthContext';
import Modal              from '../../components/ui/Modal';
import StatusBadge        from '../../components/ui/StatusBadge';
import LoadingSpinner     from '../../components/ui/LoadingSpinner';
import EmptyState         from '../../components/ui/EmptyState';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const fileUrl  = (filename) => `${API_BASE}/attachments/files/${filename}`;

/* ── helpers ── */
const STATUSES = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

const STATUS_META = {
  TODO:        { label: 'To Do',       color: '#6b7280', accent: 'rgba(107,114,128,0.15)' },
  IN_PROGRESS: { label: 'In Progress', color: '#6366f1', accent: 'rgba(99,102,241,0.15)'  },
  REVIEW:      { label: 'Review',      color: '#f59e0b', accent: 'rgba(245,158,11,0.15)'  },
  DONE:        { label: 'Done',        color: '#22c55e', accent: 'rgba(34,197,94,0.15)'   },
};

const PRIORITY_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444' };

/* ── file-type icon ── */
const FileIcon = ({ mime }) => {
  if (!mime) return <File size={14} />;
  if (mime.startsWith('image/')) return <Image size={14} style={{ color: '#06b6d4' }} />;
  if (mime.startsWith('video/')) return <Film size={14} style={{ color: '#8b5cf6' }} />;
  return <FileText size={14} style={{ color: '#6366f1' }} />;
};

/* ── Single attachment row — fetches file with JWT auth ── */
function AttachmentCard({ att, onDelete }) {
  const isImage        = att.fileType?.startsWith('image/');
  const { blobUrl }    = useAuthFile(isImage ? att.fileUrl : null); // only fetch blob for images

  const handleDownload = async (e) => {
    e.stopPropagation();
    try { await downloadAuthFile(att.fileUrl, att.filename); }
    catch { /* toast handled in hook */ }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
      background: 'var(--color-surface-raised)', border: '1px solid var(--color-neutral)',
    }}>
      {/* Thumbnail — blob URL has auth baked in */}
      {isImage ? (
        <div
          onClick={handleDownload}
          title="Click to download"
          style={{ flexShrink: 0, cursor: 'pointer' }}
        >
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

      <button className="icon-btn" title="Download" onClick={handleDownload}>
        <Download size={14} />
      </button>
      <button className="icon-btn" title="Remove" onClick={() => onDelete(att.id)}>
        <X size={14} />
      </button>
    </div>
  );
}

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ══════════════════════════════════════════════ */
export default function TasksPage() {
  const { user } = useAuth();
  const toast    = useToast();

  const [tasks,          setTasks]          = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [viewMode,       setViewMode]       = useState('kanban');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [projectFilter,  setProjectFilter]  = useState('ALL');

  /* create modal */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData,        setFormData]        = useState({
    title: '', description: '', projectId: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [],
  });
  /* files to upload AFTER task creation */
  const [pendingFiles, setPendingFiles]   = useState([]);
  const createFileRef                    = useRef(null);

  /* detail modal */
  const [selectedTask,      setSelectedTask]      = useState(null);
  const [showDetailModal,   setShowDetailModal]   = useState(false);
  const [comments,          setComments]          = useState([]);
  const [newComment,        setNewComment]         = useState('');
  const [attachments,       setAttachments]       = useState([]);
  const [uploadingFile,     setUploadingFile]     = useState(false);
  const [taskToDelete,      setTaskToDelete]      = useState(null);
  const detailFileRef                            = useRef(null);

  /* drag state (no library needed — HTML5 DnD API) */
  const dragTask   = useRef(null);
  const [dragOver, setDragOver] = useState(null); // column status being hovered

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  /* ── load ── */
  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadTasks(projects); }, [projects]);

  const loadTasks = async (projectList) => {
    try {
      setLoading(true);
      const allTasks = [];
      const list = projectList || projects;
      for (const p of list) {
        try {
          const t = await tasksApi.getByProject(p.id);
          if (t) allTasks.push(...t.map((task) => ({ ...task, projectId: p.id })));
        } catch { /* skip */ }
      }
      setTasks(allTasks);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try { setProjects((await projectsApi.list()) || []); } catch { /* ok */ }
  };

  /* ── task create ── */
  const handleProjectChange = async (projectId) => {
    setFormData({ ...formData, projectId, assigneeIds: [] });
    if (projectId) {
      try { setProjectMembers((await projectsApi.getMembers(projectId)) || []); }
      catch { setProjectMembers([]); }
    } else setProjectMembers([]);
  };

  const toggleAssignee = (uid) =>
    setFormData((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(uid)
        ? f.assigneeIds.filter((id) => id !== uid)
        : [...f.assigneeIds, uid],
    }));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await tasksApi.create({
        title:       formData.title,
        description: formData.description,
        projectId:   Number(formData.projectId),
        priority:    formData.priority,
        dueDate:     formData.dueDate ? `${formData.dueDate}T00:00:00` : null,
      });
      if (formData.assigneeIds.length > 0) await tasksApi.assignUsers(created.id, formData.assigneeIds);

      /* Upload any pending files */
      for (const file of pendingFiles) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('taskId', created.id);
          await attachmentsApi.upload(fd);
        } catch { /* non-fatal */ }
      }

      toast.success('Task created!');
      setShowCreateModal(false);
      setPendingFiles([]);
      setProjectMembers([]);
      setFormData({ title: '', description: '', projectId: '', priority: 'MEDIUM', dueDate: '', assigneeIds: [] });
      loadTasks(projects);
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    }
  };

  /* ── kanban drag-and-drop ── */
  const onDragStart = (e, task) => {
    dragTask.current = task;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.45';
  };

  const onDragEnd = (e) => {
    e.currentTarget.style.opacity = '';
    setDragOver(null);
  };

  const onDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(status);
  };

  const onDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOver(null);
    const task = dragTask.current;
    dragTask.current = null;
    if (!task || task.status === targetStatus) return;

    /* Optimistic update */
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: targetStatus } : t));
    try {
      await tasksApi.changeStatus(task.id, targetStatus);
      toast.success(`Moved to ${STATUS_META[targetStatus].label}`);
    } catch (err) {
      /* rollback */
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status } : t));
      toast.error(err.message || 'Failed to update status');
    }
  };

  /* ── status change from detail modal ── */
  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : prev);
    try {
      await tasksApi.changeStatus(taskId, newStatus);
      toast.success('Status updated!');
    } catch (err) {
      loadTasks();
      toast.error(err.message || 'Failed to update status');
    }
  };

  const requestDeleteTask = (task) => {
    setTaskToDelete(task);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    try {
      await tasksApi.delete(taskId);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTaskToDelete(null);
      if (selectedTask?.id === taskId) { setShowDetailModal(false); setSelectedTask(null); }
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
  };

  /* ── detail open ── */
  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
    setComments([]);
    setAttachments([]);
    try { setComments((await commentsApi.getByTask(task.id)) || []); } catch { /* ok */ }
    try { setAttachments((await attachmentsApi.getByTask(task.id)) || []); } catch { /* ok */ }
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

  /* ── file upload inside detail modal ── */
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

  /* ── derived ── */
  const filtered = tasks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) &&
      (priorityFilter === 'ALL' || t.priority === priorityFilter) &&
      (projectFilter  === 'ALL' || String(t.projectId) === projectFilter)
    );
  });

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, filtered.filter((t) => t.status === s)]));

  if (loading) return <LoadingSpinner text="Loading tasks..." />;

  /* ════════════════════ JSX ════════════════════ */
  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Drag cards to change status &amp; upload files to any task</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}><LayoutGrid size={16} /></button>
            <button className={`view-toggle-btn ${viewMode === 'list'   ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
          </div>
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filters-bar">
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input type="text" placeholder="Search tasks..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="filter-search-input" />
        </div>
        <select className="form-input no-icon" style={{ width: 'auto', minWidth: '160px' }}
          value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="ALL">All Projects</option>
          {projects.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
        <div className="filter-group">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
            <button key={p} className={`filter-chip ${priorityFilter === p ? 'active' : ''}`}
              onClick={() => setPriorityFilter(p)}>{p === 'ALL' ? 'All' : p}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found"
          description={searchQuery ? 'Try a different search' : 'Create your first task'}
          action={canManage && !searchQuery && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Create Task
            </button>
          )}
        />
      ) : viewMode === 'kanban' ? (

        /* ── Kanban Board ── */
        <div className="kanban-board">
          {STATUSES.map((status) => {
            const meta     = STATUS_META[status];
            const isOver   = dragOver === status;
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: meta.color, display: 'inline-block', boxShadow: `0 0 6px ${meta.color}80` }} />
                    <h3 style={{ color: meta.color, margin: 0 }}>{meta.label}</h3>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '99px', background: meta.accent, color: meta.color, minWidth: '24px', textAlign: 'center' }}>
                    {byStatus[status].length}
                  </span>
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
                      title="Drag to move · Click to open"
                      style={{ cursor: 'grab', position: 'relative' }}
                    >
                      {/* Status stripe — colour by status not priority */}
                      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', borderRadius: '8px 0 0 8px', background: STATUS_META[task.status]?.color || '#6b7280' }} />

                      <div className="kanban-card-header" style={{ paddingLeft: '6px' }}>
                        <StatusBadge status={task.priority} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', userSelect: 'none' }}>⠿</span>
                          {canManage && (
                            <button
                              className="icon-btn"
                              style={{ color: 'var(--color-danger)', padding: '2px', opacity: 0.7 }}
                              title="Delete task"
                              onClick={(e) => { e.stopPropagation(); requestDeleteTask(task); }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="kanban-card-title" style={{ paddingLeft: '6px' }}>{task.title}</p>
                      <p className="kanban-card-project" style={{ paddingLeft: '6px' }}>{task.projectName}</p>
                      <div className="kanban-card-meta" style={{ paddingLeft: '6px' }}>
                        <span><Calendar size={12} /> {formatDate(task.dueDate)}</span>
                        {task.assigneeNames?.length > 0 && <span><Users size={12} /> {task.assigneeNames.length}</span>}
                        {task.attachmentCount > 0 && <span><Paperclip size={12} /> {task.attachmentCount}</span>}
                      </div>
                    </div>
                  ))}

                  {/* Drop target hint when column empty */}
                  {byStatus[status].length === 0 && (
                    <div style={{
                      border: `2px dashed ${meta.color}40`, borderRadius: 'var(--radius-md)',
                      padding: '1.5rem', textAlign: 'center', color: meta.color,
                      opacity: isOver ? 0.85 : 0.35, transition: 'opacity 0.15s',
                      fontSize: '0.8rem', pointerEvents: 'none',
                    }}>
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (

        /* ── List View ── */
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th><th>Project</th><th>Status</th><th>Priority</th>
                  <th>Due Date</th><th>Assignees</th><th>Files</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => openTaskDetail(task)}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td>{task.projectName}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td><StatusBadge status={task.priority} /></td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td>{task.assigneeNames?.join(', ') || '—'}</td>
                    <td>
                      {task.attachmentCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                          <Paperclip size={12} /> {task.attachmentCount}
                        </span>
                      )}
                    </td>
                    <td>
                      {canManage && (
                        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); requestDeleteTask(task); }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              onClick={handleDelete}
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════════════════════════════════
          Task Detail Modal
      ══════════════════════════════════════ */}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedTask(null); }} title="Task Details" size="lg">
        {selectedTask && (
          <div className="task-detail">
            <div className="task-detail-top">
              <h3 className="task-detail-title">{selectedTask.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <StatusBadge status={selectedTask.status} />
                <StatusBadge status={selectedTask.priority} />
              </div>
            </div>
            <p className="task-detail-description">{selectedTask.description || 'No description provided.'}</p>

            <div className="task-detail-info">
              <div className="task-detail-info-item"><span className="label">Project</span><span className="value">{selectedTask.projectName}</span></div>
              <div className="task-detail-info-item"><span className="label">Due Date</span><span className="value">{formatDate(selectedTask.dueDate)}</span></div>
              <div className="task-detail-info-item"><span className="label">Assignees</span><span className="value">{selectedTask.assigneeNames?.join(', ') || 'Unassigned'}</span></div>
            </div>

            {/* Status buttons */}
            <div className="task-detail-status-change">
              <span className="label">Change Status:</span>
              <div className="status-buttons">
                {STATUSES.map((s) => {
                  const m = STATUS_META[s];
                  return (
                    <button
                      key={s}
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

            {/* ── Attachments Section ── */}
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Paperclip size={16} style={{ color: '#6366f1' }} /> Attachments ({attachments.length})
                </h4>
                <div>
                  <input ref={detailFileRef} type="file" multiple hidden onChange={handleDetailFileUpload} />
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.8rem' }}
                    onClick={() => detailFileRef.current?.click()}
                    disabled={uploadingFile}
                  >
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
                          <span className="comment-time">{formatDateTime(c.createdAt)}</span>
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

      {/* ══════════════════════════════════════
          Create Task Modal
      ══════════════════════════════════════ */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setPendingFiles([]); }} title="Create New Task">
        <form onSubmit={handleCreate} className="modal-form">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input type="text" className="form-input no-icon" placeholder="Enter task title"
              value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          <div className="form-group">
            <label className="form-label">Project *</label>
            <select className="form-input no-icon" value={formData.projectId} onChange={(e) => handleProjectChange(e.target.value)} required>
              <option value="">Select a project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Describe the task..." rows={3}
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input no-icon" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option><option value="URGENT">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input no-icon" value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
            </div>
          </div>

          {/* Assignees */}
          {formData.projectId && (
            <div className="form-group">
              <label className="form-label">
                <Users size={14} style={{ marginRight: '0.4rem' }} />
                {projectMembers.length === 0 ? 'Assign To (no members yet)' : `Assign To (${formData.assigneeIds.length} selected)`}
              </label>
              {projectMembers.length > 0 && (
                <div className="member-picker">
                  {projectMembers
                    .filter((m) => m.userId !== user.id) /* never self-assign */
                    .map((m) => {
                    const selected = formData.assigneeIds.includes(m.userId);
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
              )}
            </div>
          )}

          {/* ── File Upload (pre-attach) ── */}
          <div className="form-group">
            <label className="form-label"><Paperclip size={14} style={{ marginRight: '0.4rem' }} /> Attach Files (optional)</label>
            <div
              style={{
                border: '2px dashed var(--color-neutral)', borderRadius: 'var(--radius-md)',
                padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onClick={() => createFileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = Array.from(e.dataTransfer.files || []);
                setPendingFiles((prev) => [...prev, ...dropped]);
              }}
            >
              <input ref={createFileRef} type="file" multiple hidden onChange={(e) => {
                setPendingFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
                e.target.value = '';
              }} />
              <Upload size={20} style={{ color: '#6366f1', margin: '0 auto 0.35rem' }} />
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Click or drag & drop files here
              </p>
            </div>

            {/* Preview pending files */}
            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem' }}>
                {pendingFiles.map((f, i) => {
                  const isImg = f.type?.startsWith('image/');
                  const objUrl = isImg ? URL.createObjectURL(f) : null;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral)', fontSize: '0.82rem' }}>
                      {isImg ? (
                        <img
                          src={objUrl}
                          alt={f.name}
                          onLoad={() => URL.revokeObjectURL(objUrl)}
                          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                        />
                      ) : (
                        <FileIcon mime={f.type} />
                      )}
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>{(f.size / 1024).toFixed(1)} KB</span>
                      <button type="button" className="icon-btn" onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}><X size={12} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setShowCreateModal(false); setPendingFiles([]); }}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
