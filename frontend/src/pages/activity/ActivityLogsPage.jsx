import { useState, useEffect } from 'react';
import { Activity, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { activityLogsApi } from '../../api/activityLogs';
import { projectsApi } from '../../api/projects';
import { useToast } from '../../components/ui/Toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const ACTION_FILTERS = [
  { key: 'ALL',    label: 'All Actions' },
  { key: 'CREATE', label: '🟢 Created'  },
  { key: 'UPDATE', label: '🔵 Updated'  },
  { key: 'DELETE', label: '🔴 Deleted'  },
  { key: 'OTHER',  label: '🟡 Other'    },
];

const getActionColor = (action) => {
  if (!action) return 'var(--color-text-secondary)';
  const a = action.toLowerCase();
  if (a.includes('create')) return '#22c55e';
  if (a.includes('delete')) return '#ef4444';
  if (a.includes('update') || a.includes('change') || a.includes('assign')) return '#6366f1';
  return '#f59e0b';
};

const matchesActionFilter = (action = '', filter) => {
  if (filter === 'ALL') return true;
  const a = action.toLowerCase();
  if (filter === 'CREATE') return a.includes('create') || a.includes('creat');
  if (filter === 'DELETE') return a.includes('delete') || a.includes('delet');
  if (filter === 'UPDATE') return a.includes('update') || a.includes('change') || a.includes('assign');
  return !a.includes('creat') && !a.includes('delet') && !a.includes('updat') && !a.includes('chang') && !a.includes('assign');
};

export default function ActivityLogsPage() {
  const toast = useToast();
  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [projects, setProjects]         = useState([]);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery]   = useState('');
  const pageSize = 20;

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { loadLogs(); }, [page, selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.list();
      setProjects(data || []);
    } catch { /* skip */ }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      let data;
      if (selectedProject !== 'ALL') {
        data = await activityLogsApi.getByProject(selectedProject, page, pageSize);
      } else {
        data = await activityLogsApi.list(page, pageSize);
      }

      if (data && data.content) {
        setLogs(data.content);
        setTotalPages(data.totalPages || 0);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalPages(1);
      } else {
        setLogs([]);
      }
    } catch (err) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = matchesActionFilter(log.action, actionFilter);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (
      (log.userName || '').toLowerCase().includes(q) ||
      (log.userEmail || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q) ||
      (log.projectName || '').toLowerCase().includes(q) ||
      (log.taskTitle || '').toLowerCase().includes(q)
    );
    return matchesAction && matchesSearch;
  });

  if (loading && logs.length === 0) return <LoadingSpinner text="Loading activity logs..." />;

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} style={{ color: '#6366f1' }} /> Activity Logs
          </h1>
          <p className="page-subtitle">Audit trail of all system actions</p>
        </div>

        {/* Project filter */}
        <select
          className="form-input no-icon"
          style={{ width: '220px' }}
          value={selectedProject}
          onChange={(e) => { setSelectedProject(e.target.value); setPage(0); setActionFilter('ALL'); setSearchQuery(''); }}
        >
          <option value="ALL">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-search">
          <Search size={18} className="filter-search-icon" />
          <input
            type="text"
            placeholder="Search by user, action, project, task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search-input"
          />
        </div>
        <div className="filter-group">
          {ACTION_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-chip ${actionFilter === f.key ? 'active' : ''}`}
              onClick={() => setActionFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity logs"
          description={
            actionFilter !== 'ALL' || searchQuery || selectedProject !== 'ALL'
              ? 'No logs match your current filters'
              : 'System actions will appear here once users start performing actions'
          }
        />
      ) : (
        <div className="card">
          {/* Count badge */}
          <div style={{ padding: '0.75rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} style={{ color: 'var(--color-text-secondary)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              Showing <strong>{filteredLogs.length}</strong>{filteredLogs.length !== logs.length ? ` of ${logs.length}` : ''} log{filteredLogs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="activity-timeline">
            {filteredLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot" style={{ backgroundColor: getActionColor(log.action) }} />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-user">{log.userName || log.userEmail}</span>
                    <span className="timeline-action" style={{ color: getActionColor(log.action) }}>{log.action}</span>
                  </div>
                  {log.details && <p className="timeline-details">{log.details}</p>}
                  <div className="timeline-meta">
                    {log.projectName && <span className="timeline-project">📁 {log.projectName}</span>}
                    {log.taskTitle && <span className="timeline-task">✅ {log.taskTitle}</span>}
                    <span className="timeline-time">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={page === 0}
                onClick={() => { setPage((p) => p - 1); setActionFilter('ALL'); setSearchQuery(''); }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="pagination-info">Page {page + 1} of {totalPages}</span>
              <button
                className="pagination-btn"
                disabled={page >= totalPages - 1}
                onClick={() => { setPage((p) => p + 1); setActionFilter('ALL'); setSearchQuery(''); }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
