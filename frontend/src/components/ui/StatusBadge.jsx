const statusConfig = {
  // Project statuses
  PLANNING: { label: 'Planning', className: 'pending' },
  ONGOING: { label: 'Ongoing', className: 'in-progress' },
  COMPLETED: { label: 'Completed', className: 'completed' },
  ON_HOLD: { label: 'On Hold', className: 'delayed' },
  // Task statuses
  TODO: { label: 'To Do', className: 'pending' },
  IN_PROGRESS: { label: 'In Progress', className: 'in-progress' },
  REVIEW: { label: 'In Review', className: 'ahead' },
  DONE: { label: 'Done', className: 'completed' },
  // Priority
  LOW: { label: 'Low', className: 'low' },
  MEDIUM: { label: 'Medium', className: 'medium' },
  HIGH: { label: 'High', className: 'high' },
  URGENT: { label: 'Urgent', className: 'high' },
  // User status
  ACTIVE: { label: 'Active', className: 'active' },
  BLOCKED: { label: 'Blocked', className: 'delayed' },
};

export default function StatusBadge({ status, type = 'status' }) {
  const config = statusConfig[status] || { label: status, className: 'pending' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}
