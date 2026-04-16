import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckSquare,
  FolderKanban,
  LineChart as LineChartIcon,
  PieChart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RePie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import { dashboardApi } from '../../api/dashboard';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const C = {
  primary: '#EBA020',
  primarySoft: 'rgba(235, 160, 32, 0.22)',
  info: '#3B7DDB',
  infoSoft: 'rgba(59, 125, 219, 0.18)',
  success: '#10b981',
  successSoft: 'rgba(16, 185, 129, 0.18)',
  warning: '#f59e0b',
  warningSoft: 'rgba(245, 158, 11, 0.2)',
  danger: '#ef4444',
  dangerSoft: 'rgba(239, 68, 68, 0.18)',
  neutral: '#64748b',
  neutralSoft: '#d1cfc9',
  surface: '#ffffff',
  surfaceAlt: '#f5f4f1',
  border: '#E8E6E0',
  text: '#1C2333',
  textMuted: '#64748b',
};

const STATUS_META = {
  PLANNING: { label: 'Planning', color: '#c9891a' },
  ONGOING: { label: 'In Progress', color: '#3B7DDB' },
  IN_PROGRESS: { label: 'In Progress', color: '#3B7DDB' },
  COMPLETED: { label: 'Completed', color: '#10b981' },
  ON_HOLD: { label: 'On Hold', color: '#64748b' },
};

const TASK_STATUS_META = {
  TODO: { label: 'To Do', color: '#c9891a' },
  OPEN: { label: 'Open', color: '#5a94e6' },
  IN_PROGRESS: { label: 'In Progress', color: '#3B7DDB' },
  REVIEW: { label: 'Review', color: '#EBA020' },
  DONE: { label: 'Done', color: '#10b981' },
  COMPLETED: { label: 'Completed', color: '#10b981' },
  BLOCKED: { label: 'Blocked', color: '#ef4444' },
};

const PRIORITY_META = {
  LOW: { label: 'Low', color: '#5a94e6' },
  MEDIUM: { label: 'Medium', color: '#3B7DDB' },
  HIGH: { label: 'High', color: '#EBA020' },
  URGENT: { label: 'Urgent', color: '#ef4444' },
};

const STATUS_ORDER = ['PLANNING', 'ONGOING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
const TASK_STATUS_ORDER = ['TODO', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE', 'COMPLETED'];
const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const SECTION_CARD_STYLE = {
  border: `1px solid ${C.border}`,
  borderRadius: '14px',
  background: C.surface,
  boxShadow: '0 10px 28px rgba(15,23,42,0.06)',
};

const CHART_SURFACE_STYLE = {
  background: C.surfaceAlt,
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  padding: '0.45rem 0.5rem',
};

const TOOLTIP_STYLE = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: '12px',
  boxShadow: '0 14px 30px rgba(15,23,42,0.14)',
  padding: '0.55rem 0.7rem',
  minWidth: '170px',
};

const LEGEND_STYLE = {
  wrapperStyle: { fontSize: '0.78rem', color: C.textMuted, paddingTop: '0.45rem' },
};

const normalize = (value) => (value || '').toString().trim().toUpperCase();

const isDoneTask = (status) => {
  const s = normalize(status);
  return s === 'DONE' || s === 'COMPLETED';
};

const formatLabel = (value) =>
  (value || '')
    .toString()
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const shorten = (value, max = 22) => {
  if (!value) return '—';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const buildWeeklyTrend = (tasks) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const buckets = [];
  for (let i = 5; i >= 0; i -= 1) {
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - (i * 7));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    buckets.push({
      week: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      start,
      end,
      added: 0,
      completed: 0,
    });
  }

  tasks.forEach((task) => {
    const createdAt = toDate(task.createdAt);
    if (createdAt) {
      const bucket = buckets.find((b) => createdAt >= b.start && createdAt <= b.end);
      if (bucket) bucket.added += 1;
    }

    const updatedAt = toDate(task.updatedAt);
    if (updatedAt && isDoneTask(task.status)) {
      const bucket = buckets.find((b) => updatedAt >= b.start && updatedAt <= b.end);
      if (bucket) bucket.completed += 1;
    }
  });

  let cumulativeAdded = 0;
  let cumulativeCompleted = 0;
  return buckets.map((bucket) => {
    cumulativeAdded += bucket.added;
    cumulativeCompleted += bucket.completed;
    return {
      week: bucket.week,
      added: bucket.added,
      completed: bucket.completed,
      cumulativeAdded,
      cumulativeCompleted,
    };
  });
};

const Section = ({ title, subtitle, icon: Icon, iconColor, action, children }) => (
  <div className="card" style={SECTION_CARD_STYLE}>
    <div
      className="card-header"
      style={{
        padding: '1rem 1.15rem',
        borderBottom: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}
    >
      <div>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {Icon && <Icon size={18} style={{ color: iconColor || C.primary }} />}
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: C.textMuted, marginTop: '0.1rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    <div className="card-content" style={{ padding: '1.1rem 1.15rem 1.2rem' }}>
      {children}
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};
  const title = point.fullName || point.label || label;

  return (
    <div style={TOOLTIP_STYLE}>
      {title && (
        <p
          style={{
            marginBottom: '0.45rem',
            color: C.textMuted,
            fontSize: '0.73rem',
            fontWeight: 700,
          }}
        >
          {title}
        </p>
      )}

      {payload.map((item, idx) => (
        <div
          key={`${item.name}-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: idx === payload.length - 1 ? 0 : '0.2rem',
            fontSize: '0.78rem',
            color: C.text,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.color || item.fill || C.primary,
                flexShrink: 0,
              }}
            />
            {item.name}
          </span>
          <strong>{Number(item.value).toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [adminStats, setAdminStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [projectStatusDist, setProjectStatusDist] = useState([]);
  const [taskStatusDist, setTaskStatusDist] = useState([]);
  const [taskPriorityDist, setTaskPriorityDist] = useState([]);
  const [projectPerformance, setProjectPerformance] = useState([]);
  const [teamWorkloadData, setTeamWorkloadData] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);
  const [completionSplit, setCompletionSplit] = useState([]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      const [dashRes, projRes] = await Promise.allSettled([
        dashboardApi.getAdminDashboard(),
        projectsApi.list(),
      ]);

      const dash = dashRes.status === 'fulfilled' ? dashRes.value : null;
      const projs = projRes.status === 'fulfilled' ? (projRes.value || []) : [];

      setAdminStats(dash);
      setProjects(projs);

      const projectStatusCount = projs.reduce((acc, project) => {
        const status = normalize(project.status || 'PLANNING');
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const projectStatusData = Object.entries(projectStatusCount)
        .sort(([a], [b]) => {
          const ai = STATUS_ORDER.indexOf(a);
          const bi = STATUS_ORDER.indexOf(b);
          const rankA = ai === -1 ? 999 : ai;
          const rankB = bi === -1 ? 999 : bi;
          return rankA - rankB;
        })
        .map(([status, value]) => ({
          status,
          name: STATUS_META[status]?.label || formatLabel(status),
          value,
          color: STATUS_META[status]?.color || C.primary,
        }));
      setProjectStatusDist(projectStatusData);

      const taskResponses = await Promise.allSettled(
        projs.map((project) => tasksApi.getByProject(project.id))
      );

      const tasks = taskResponses.flatMap((res, idx) => {
        if (res.status !== 'fulfilled' || !Array.isArray(res.value)) return [];

        const project = projs[idx];
        return res.value.map((task) => ({
          ...task,
          projectId: task.projectId ?? project.id,
          projectName: task.projectName || project.name,
        }));
      });
      setAllTasks(tasks);

      const doneTasksCount = tasks.filter((task) => isDoneTask(task.status)).length;
      const openTasksCount = Math.max(0, tasks.length - doneTasksCount);
      setCompletionSplit([
        { name: 'Completed', value: doneTasksCount, color: C.success },
        { name: 'Open', value: openTasksCount, color: C.primarySoft },
      ]);

      const taskStatusCount = tasks.reduce((acc, task) => {
        const status = normalize(task.status || 'TODO');
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const taskStatusData = Object.entries(taskStatusCount)
        .sort(([a], [b]) => {
          const ai = TASK_STATUS_ORDER.indexOf(a);
          const bi = TASK_STATUS_ORDER.indexOf(b);
          const rankA = ai === -1 ? 999 : ai;
          const rankB = bi === -1 ? 999 : bi;
          return rankA - rankB;
        })
        .map(([status, value]) => ({
          status,
          name: TASK_STATUS_META[status]?.label || formatLabel(status),
          value,
          color: TASK_STATUS_META[status]?.color || C.info,
        }));
      setTaskStatusDist(taskStatusData);

      const priorityCount = tasks.reduce((acc, task) => {
        if (!task.priority) return acc;
        const priority = normalize(task.priority);
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      const priorityData = PRIORITY_ORDER
        .filter((priority) => priorityCount[priority])
        .map((priority) => ({
          priority,
          name: PRIORITY_META[priority]?.label || formatLabel(priority),
          value: priorityCount[priority],
          color: PRIORITY_META[priority]?.color || C.info,
        }));
      setTaskPriorityDist(priorityData);

      const tasksByProjectId = tasks.reduce((acc, task) => {
        const projectId = String(task.projectId ?? '');
        if (!projectId) return acc;
        if (!acc.has(projectId)) acc.set(projectId, []);
        acc.get(projectId).push(task);
        return acc;
      }, new Map());

      const now = new Date();
      const performance = projs.map((project) => {
        const projectTasks = tasksByProjectId.get(String(project.id)) || [];
        const total = projectTasks.length;
        const done = projectTasks.filter((task) => isDoneTask(task.status)).length;
        const pending = Math.max(0, total - done);
        const overdue = projectTasks.filter((task) => {
          const due = toDate(task.dueDate);
          return due && due < now && !isDoneTask(task.status);
        }).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
          id: project.id,
          status: normalize(project.status || 'PLANNING'),
          fullName: project.name || 'Untitled Project',
          name: shorten(project.name || 'Untitled Project'),
          total,
          done,
          pending,
          overdue,
          pct,
        };
      });
      setProjectPerformance(performance);

      const workload = (dash?.teamWorkload || [])
        .filter((member) => member?.userName)
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 8)
        .map((member) => ({
          name: shorten(member.userName.split(' ')[0], 12),
          fullName: member.userName,
          tasks: member.taskCount,
        }));
      setTeamWorkloadData(workload);

      setWeeklyTrend(buildWeeklyTrend(tasks));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) return <LoadingSpinner text="Building reports…" />;

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((task) => isDoneTask(task.status)).length;
  const openTasks = Math.max(0, totalTasks - doneTasks);
  const overdueTasks = allTasks.filter((task) => {
    const due = toDate(task.dueDate);
    return due && due < new Date() && !isDoneTask(task.status);
  }).length;
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const activeProjects = projects.filter((project) => {
    const status = normalize(project.status);
    return status !== 'COMPLETED' && status !== 'ON_HOLD';
  }).length;
  const projectsAtRisk = projectPerformance.filter((project) => project.overdue > 0).length;
  const avgTasksPerMember = teamWorkloadData.length > 0
    ? Math.round(totalTasks / teamWorkloadData.length)
    : 0;

  const projectCompletionChartData = projectPerformance
    .filter((project) => project.total > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  const tableRows = [...projectPerformance].sort((a, b) => (
    b.pct - a.pct || b.total - a.total || a.fullName.localeCompare(b.fullName)
  ));

  const kpis = [
    {
      icon: FolderKanban,
      label: 'Projects',
      value: projects.length,
      sub: `${activeProjects} active`,
      color: C.primary,
      bg: C.primarySoft,
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      value: totalTasks,
      sub: `${openTasks} open`,
      color: C.info,
      bg: C.infoSoft,
    },
    {
      icon: TrendingUp,
      label: 'Completion',
      value: `${completionPct}%`,
      sub: `${doneTasks} done`,
      color: C.success,
      bg: C.successSoft,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      value: overdueTasks,
      sub: `${projectsAtRisk} projects affected`,
      color: C.danger,
      bg: C.dangerSoft,
    },
    {
      icon: Users,
      label: 'Team Members',
      value: adminStats?.totalMembers ?? adminStats?.teamWorkload?.length ?? '—',
      sub: `${avgTasksPerMember} avg tasks/member`,
      color: C.primary,
      bg: C.primarySoft,
    },
    {
      icon: Zap,
      label: 'In Progress',
      value: allTasks.filter((task) => normalize(task.status) === 'IN_PROGRESS').length,
      sub: 'currently active',
      color: C.warning,
      bg: C.warningSoft,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.1rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={26} style={{ color: C.primary }} /> Analytics & Reports
        </h1>
        <p className="page-subtitle">
          Professional overview for project delivery, team performance, and risk tracking.
        </p>
      </div>

      <div
        className="card"
        style={{
          ...SECTION_CARD_STYLE,
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(235,160,32,0.14) 0%, rgba(59,125,219,0.14) 55%, #f5f4f1 100%)',
        }}
      >
        <div
          className="card-content"
          style={{
            padding: '1rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={{ fontSize: '0.75rem', color: C.textMuted, marginBottom: '0.2rem', fontWeight: 600 }}>
              Executive Summary
            </p>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: C.text }}>
              {completionPct}% completion across {projects.length} projects
            </p>
            <p style={{ fontSize: '0.78rem', color: C.textMuted }}>
              {openTasks} open tasks · {overdueTasks} overdue · {activeProjects} active projects
            </p>
          </div>
          <button className="card-link" onClick={() => navigate('/projects')}>
            View Projects →
          </button>
        </div>
      </div>

      <div
        className="stats-grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="stat-card"
            style={{
              border: `1px solid ${C.border}`,
              boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
              borderRadius: '14px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${kpi.color}, ${kpi.bg})`,
              }}
            />
            <div className="stat-card-header">
              <div>
                <p className="stat-card-label">{kpi.label}</p>
                <p className="stat-card-value" style={{ color: kpi.color }}>{kpi.value}</p>
                <p style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: '0.1rem' }}>{kpi.sub}</p>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <kpi.icon size={19} style={{ color: kpi.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="content-grid" style={{ marginBottom: '1.5rem' }}>
        <Section
          title="Project Status Distribution"
          subtitle={`${projects.length} projects by lifecycle status`}
          icon={FolderKanban}
          iconColor={C.primary}
        >
          {projectStatusDist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No project data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={290}>
                <RePie>
                  <Pie
                    data={projectStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={108}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {projectStatusDist.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Legend {...LEGEND_STYLE} />
                </RePie>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section
          title="Task Status Breakdown"
          subtitle={`${totalTasks} tasks grouped by current status`}
          icon={PieChart}
          iconColor={C.success}
        >
          {taskStatusDist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No task data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={290}>
                <RePie>
                  <Pie
                    data={taskStatusDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={108}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {taskStatusDist.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Legend {...LEGEND_STYLE} />
                </RePie>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      <div className="content-grid" style={{ marginBottom: '1.5rem' }}>
        <Section
          title="Task Completion Snapshot"
          subtitle="Completed vs open tasks"
          icon={Target}
          iconColor={C.info}
        >
          {totalTasks === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No task data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={250}>
                <RePie>
                  <Pie
                    data={completionSplit}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={104}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {completionSplit.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Legend {...LEGEND_STYLE} />
                </RePie>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', marginTop: '0.65rem' }}>
                <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.55rem 0.65rem', background: C.surface }}>
                  <p style={{ fontSize: '0.72rem', color: C.textMuted }}>Completed</p>
                  <p style={{ fontWeight: 700, color: C.success }}>{doneTasks}</p>
                </div>
                <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '0.55rem 0.65rem', background: C.surface }}>
                  <p style={{ fontSize: '0.72rem', color: C.textMuted }}>Open</p>
                  <p style={{ fontWeight: 700, color: C.warning }}>{openTasks}</p>
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Task Priority Analysis"
          subtitle="Distribution by urgency level"
          icon={AlertTriangle}
          iconColor={C.warning}
        >
          {taskPriorityDist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No priority data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskPriorityDist} layout="vertical" margin={{ top: 8, right: 14, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: C.textMuted }} />
                  <YAxis dataKey="name" type="category" width={72} tick={{ fontSize: 11, fill: C.textMuted }} />
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Bar dataKey="value" name="Tasks" radius={[0, 7, 7, 0]} maxBarSize={24}>
                    {taskPriorityDist.map((entry) => (
                      <Cell key={entry.priority} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      <div className="content-grid" style={{ marginBottom: '1.5rem' }}>
        <Section
          title="Project Completion Rate"
          subtitle="Top projects by completion percentage"
          icon={Target}
          iconColor={C.info}
          action={<button className="card-link" onClick={() => navigate('/projects')}>View All →</button>}
        >
          {projectCompletionChartData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No project task data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={projectCompletionChartData} margin={{ top: 10, right: 18, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} angle={-28} textAnchor="end" interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: C.textMuted }} unit="%" />
                  <ReferenceLine y={80} stroke={C.success} strokeDasharray="4 4" />
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Bar dataKey="pct" name="Completion %" radius={[7, 7, 0, 0]} maxBarSize={44}>
                    {projectCompletionChartData.map((project) => (
                      <Cell
                        key={project.id}
                        fill={
                          project.pct >= 80 ? C.success
                            : project.pct >= 50 ? C.primary
                              : project.pct >= 25 ? C.warning
                                : C.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section
          title="Team Workload"
          subtitle="Task assignments per team member (top 8)"
          icon={Users}
          iconColor={C.primary}
        >
          {teamWorkloadData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No workload data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={teamWorkloadData} margin={{ top: 10, right: 18, left: 0, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} angle={-25} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Bar dataKey="tasks" name="Assigned Tasks" radius={[7, 7, 0, 0]} fill={C.primary} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Section
          title="Weekly Throughput Trend"
          subtitle="Tasks created vs completed during the last 6 weeks"
          icon={LineChartIcon}
          iconColor={C.success}
        >
          {weeklyTrend.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.2rem', color: C.textMuted }}>No trend data</div>
          ) : (
            <div style={CHART_SURFACE_STYLE}>
              <ResponsiveContainer width="100%" height={285}>
                <LineChart data={weeklyTrend} margin={{ top: 10, right: 18, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: C.textMuted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.textMuted }} />
                  <Tooltip content={<ChartTooltip />} isAnimationActive={false} wrapperStyle={{ transition: 'none' }} />
                  <Legend {...LEGEND_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="added"
                    name="Added"
                    stroke={C.primary}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: C.primary }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke={C.success}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: C.success }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      <div className="card" style={SECTION_CARD_STYLE}>
        <div
          className="card-header"
          style={{
            padding: '1rem 1.15rem',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={18} style={{ color: C.primary }} /> Project Performance Table
          </h2>
          <button className="card-link" onClick={() => navigate('/projects')}>View All →</button>
        </div>
        <div className="card-content" style={{ padding: '1rem 1.15rem 1.2rem' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Done</th>
                  <th>Pending</th>
                  <th>Completion</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((project) => {
                  const statusMeta = STATUS_META[project.status] || { label: formatLabel(project.status), color: C.neutral };
                  const progressColor = project.pct >= 80
                    ? C.success
                    : project.pct >= 50
                      ? C.primary
                      : project.pct >= 25
                        ? C.warning
                        : C.danger;

                  return (
                    <tr key={project.id}>
                      <td style={{ fontWeight: 500 }}>{project.fullName}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.12rem 0.5rem',
                            borderRadius: '99px',
                            background: `${statusMeta.color}20`,
                            color: statusMeta.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td>{project.total}</td>
                      <td style={{ color: C.success, fontWeight: 600 }}>{project.done}</td>
                      <td style={{ color: C.warning, fontWeight: 600 }}>{project.pending}</td>
                      <td style={{ color: progressColor, fontWeight: 700 }}>{project.pct}%</td>
                      <td style={{ minWidth: '145px' }}>
                        <div style={{ height: '7px', borderRadius: '99px', background: C.neutralSoft, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${project.pct}%`,
                              background: progressColor,
                              borderRadius: '99px',
                              transition: 'width 0.4s',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: C.textMuted, padding: '2rem' }}>
                      No project data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
