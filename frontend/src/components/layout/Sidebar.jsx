import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart2,
} from 'lucide-react';
import { useState } from 'react';
import { ROLES } from '../../api/constants';

const menuItems = {
  common: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FolderKanban, label: 'Projects', path: '/projects' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  ],
  [ROLES.ADMIN]: [
    { icon: Users, label: 'Users', path: '/users' },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
    { icon: Activity, label: 'Activity Logs', path: '/activity-logs' },
  ],
  [ROLES.MANAGER]: [
    { icon: Users, label: 'Team Members', path: '/team' },
    { icon: Activity, label: 'Activity Logs', path: '/manager-activity' },
  ],
  [ROLES.TEAM_MEMBER]: [],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [...menuItems.common];
    if (user?.role && menuItems[user.role]) {
      items.push(...menuItems[user.role]);
    }
    return items;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">P</div>
            <span className="sidebar-logo-text">ProjectFlow</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle"
          style={collapsed ? { margin: '0 auto' } : {}}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {getMenuItems().map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
            style={collapsed ? { justifyContent: 'center' } : {}}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? 'active' : ''}`
          }
          style={collapsed ? { justifyContent: 'center' } : {}}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-logout"
          style={collapsed ? { justifyContent: 'center' } : {}}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
