import { Bell, CheckCheck, X, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';

const POLL_INTERVAL = 60_000;

/** Read profile-pic / avatar-colour from localStorage (set in SettingsPage) */
function useLocalAvatar() {
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('profilePic') || null);
  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem('avatarColor') || '#6366f1');
  useEffect(() => {
    const onStorage = () => {
      setProfilePic(localStorage.getItem('profilePic') || null);
      setAvatarColor(localStorage.getItem('avatarColor') || '#6366f1');
    };
    window.addEventListener('storage', onStorage);
    // Also poll every 2s (same-tab updates don't fire the storage event)
    const id = setInterval(onStorage, 2000);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(id); };
  }, []);
  return { profilePic, avatarColor };
}

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { profilePic, avatarColor } = useLocalAvatar();
  const [notifications, setNotifications]       = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu]   = useState(false);
  const dropdownRef   = useRef(null);
  const profileRef    = useRef(null);
  const pollRef       = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  /* ── load + poll ── */
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadNotifications();
    pollRef.current = setInterval(loadNotifications, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadNotifications]);

  /* close both dropdowns on outside click */
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  /* ── mark single as read ── */
  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n)));
    try { await notificationsApi.markAsRead(id); }
    catch { setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false, read: false } : n))); }
  };

  /* ── mark all read ── */
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
    try { await notificationsApi.markAllAsRead(); }
    catch { await loadNotifications(); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  /* ── time helper ── */
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const avatarLetter = user?.fullName?.charAt(0).toUpperCase() || '?';

  /** Reusable avatar widget */
  const AvatarImg = ({ size = 36 }) => profilePic ? (
    <img src={profilePic} alt="avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${avatarColor}` }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {avatarLetter}
    </div>
  );

  return (
    <header className="header">
      <div className="header-actions">

        {/* ── Notification bell ── */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button
            className="header-action-btn"
            onClick={() => { setShowNotifications((v) => !v); setShowProfileMenu(false); }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="header-badge notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h3>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 700, background: '#6366f1', color: '#fff', padding: '0.1rem 0.45rem', borderRadius: '99px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button className="notification-mark-all" onClick={handleMarkAllRead} title="Mark all as read">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className="notification-dropdown-body">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={32} /><p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 12).map((n) => {
                    const isRead = n.isRead || n.read;
                    return (
                      <div
                        key={n.id}
                        className={`notification-item ${!isRead ? 'unread' : ''}`}
                        onClick={() => !isRead && handleMarkRead(n.id)}
                        style={{ cursor: !isRead ? 'pointer' : 'default' }}
                      >
                        <div className="notification-dot" style={{ opacity: isRead ? 0 : 1, transition: 'opacity 0.25s' }} />
                        <div className="notification-content">
                          <p className="notification-title" style={{ fontWeight: isRead ? 400 : 600 }}>{n.title || n.message}</p>
                          {n.title && n.message && <p className="notification-message">{n.message}</p>}
                          <p className="notification-time">{formatTime(n.createdAt)}</p>
                        </div>
                        {!isRead && (
                          <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                            title="Dismiss"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* ── Profile dropdown ── */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfileMenu((v) => !v); setShowNotifications(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-md)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-light)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            title="Account menu"
          >
            <AvatarImg size={36} />
            <div className="header-user-info">
              <p className="header-user-name">{user?.fullName}</p>
              <p className="header-user-role">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--color-text-secondary)',
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--color-bg-primary)', border: '1px solid var(--color-neutral)',
              borderRadius: 'var(--radius-md)', boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
              minWidth: '200px', zIndex: 1200, overflow: 'hidden',
              animation: 'fadeIn 0.12s ease',
            }}>
              {/* User info header */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-neutral)', background: 'var(--color-neutral-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AvatarImg size={40} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '0.4rem 0' }}>
                <button
                  onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    width: '100%', padding: '0.65rem 1rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.875rem', color: 'var(--color-text-primary)',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-neutral-light)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <User size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
                  Profile & Settings
                </button>

                <div style={{ height: '1px', background: 'var(--color-neutral)', margin: '0.3rem 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    width: '100%', padding: '0.65rem 1rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.875rem', color: '#ef4444',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={15} style={{ flexShrink: 0 }} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
