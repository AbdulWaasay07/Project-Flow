import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../api/constants';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import MemberDashboard from './MemberDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  const dashboards = {
    [ROLES.ADMIN]:       AdminDashboard,
    [ROLES.MANAGER]:     ManagerDashboard,
    [ROLES.TEAM_MEMBER]: MemberDashboard,
  };

  const DashboardComponent = dashboards[user?.role] || MemberDashboard;

  return <DashboardComponent />;
}
