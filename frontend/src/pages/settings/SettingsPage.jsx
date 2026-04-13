import { useState, useRef } from 'react';
import { User, Lock, Save, Camera, Check } from 'lucide-react';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ROLE_LABELS } from '../../api/constants';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b',
  '#10b981', '#ef4444', '#ec4899', '#14b8a6',
];

export default function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  /* Avatar colour picker */
  const [avatarColor, setAvatarColor] = useState(() => {
    return localStorage.getItem('avatarColor') || AVATAR_COLORS[0];
  });
  const [pendingColor, setPendingColor] = useState(avatarColor);

  /* Profile picture */
  const [profilePic, setProfilePic] = useState(() => localStorage.getItem('profilePic') || null);
  const fileInputRef = useRef(null);

  const handlePicChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be < 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setProfilePic(dataUrl);
      localStorage.setItem('profilePic', dataUrl);
      toast.success('Profile picture updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePic = () => {
    setProfilePic(null);
    localStorage.removeItem('profilePic');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Profile picture removed');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword && newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      setSaving(true);
      const payload = { fullName };
      if (newPassword) payload.newPassword = newPassword;
      await usersApi.updateProfile(payload);
      // Save avatar colour
      localStorage.setItem('avatarColor', pendingColor);
      setAvatarColor(pendingColor);
      // Update stored user name
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.fullName = fullName;
      localStorage.setItem('user', JSON.stringify(storedUser));
      toast.success('Profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const avatarInitial = fullName?.charAt(0)?.toUpperCase() || user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account settings and profile</p>
      </div>

      <div className="settings-grid">
        {/* ── Profile Card ── */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Profile Information</h2>
          </div>
          <div className="card-content">

            {/* Avatar section */}
            <div className="settings-profile-header">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Avatar display */}
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover',
                      border: `3px solid ${avatarColor}`, boxShadow: `0 0 0 3px ${avatarColor}22` }}
                  />
                ) : (
                  <div
                    style={{ width: '80px', height: '80px', borderRadius: '50%', background: avatarColor,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '2rem',
                      boxShadow: `0 0 0 3px ${avatarColor}33`, transition: 'background 0.25s' }}
                  >
                    {avatarInitial}
                  </div>
                )}
                {/* Camera button */}
                <button
                  type="button"
                  title="Change profile picture"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: '#6366f1', border: '2px solid var(--color-surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                  <Camera size={13} color="#fff" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePicChange} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{user?.fullName}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
                <span className="status-badge active" style={{ marginTop: '0.35rem', display: 'inline-block' }}>
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
                {profilePic && (
                  <button
                    type="button"
                    onClick={handleRemovePic}
                    style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Avatar colour picker */}
            {!profilePic && (
              <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Avatar Colour
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c} type="button"
                      onClick={() => setPendingColor(c)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c,
                        border: pendingColor === c ? '3px solid var(--color-text)' : '3px solid transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform 0.15s, border 0.15s',
                        transform: pendingColor === c ? 'scale(1.15)' : '',
                      }}
                    >
                      {pendingColor === c && <Check size={13} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text" className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required minLength={2}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-wrapper">
                  <input
                    type="email" className="form-input no-icon"
                    value={user?.email || ''} disabled style={{ opacity: 0.6 }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                  Email cannot be changed
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--color-neutral)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Change Password</h3>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password" className="form-input"
                      placeholder="Leave blank to keep current"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password" className="form-input"
                      placeholder="Confirm new password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Account Details</h2>
          </div>
          <div className="card-content">
            <div className="settings-info-list">
              <div className="settings-info-item">
                <span className="settings-info-label">User ID</span>
                <span className="settings-info-value">{user?.id}</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Role</span>
                <span className="settings-info-value">{ROLE_LABELS[user?.role] || user?.role}</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Email</span>
                <span className="settings-info-value">{user?.email}</span>
              </div>
              <div className="settings-info-item">
                <span className="settings-info-label">Full Name</span>
                <span className="settings-info-value">{user?.fullName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
