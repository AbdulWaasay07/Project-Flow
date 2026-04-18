export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  TEAM_MEMBER: 'TEAM_MEMBER',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.TEAM_MEMBER]: 'Team Member',
};

export const PROJECT_STATUSES = {
  PLANNING: 'PLANNING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
};

export const TASK_STATUSES = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
};

export const TASK_PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};
