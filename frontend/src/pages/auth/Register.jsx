import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'TEAM_MEMBER', label: 'Team Member', description: 'Work on assigned tasks' },
  { value: 'MANAGER', label: 'Manager', description: 'Lead team and projects' },
  { value: 'ADMIN', label: 'Administrator', description: 'Manage organization settings' },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Too weak', color: '#ef4444' };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' };
  if (score === 3) return { score, label: 'Good', color: '#3B7DDB' };
  return { score, label: 'Strong', color: '#10b981' };
};

export default function Register() {
  const navigate = useNavigate();
  const { register, error } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TEAM_MEMBER',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const passwordChecks = [
    { label: 'At least 8 characters', valid: formData.password.length >= 8 },
    { label: 'Mix uppercase and lowercase', valid: /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) },
    { label: 'Contains a number', valid: /\d/.test(formData.password) },
    { label: 'Passwords match', valid: !!formData.password && formData.password === formData.confirmPassword },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-branding">
        <div className="auth-branding-gradient" />
        <div className="auth-branding-content">
          <div className="logo">
            <div className="logo-icon">
              <Sparkles size={24} />
            </div>
            <span className="logo-text">ProjectFlow</span>
          </div>

          <h1 className="branding-title">
            Start Managing
            <br />
            <span>Today</span>
          </h1>

          <p className="branding-description">
            Join your team workspace in minutes and keep projects moving with clarity.
          </p>

          <div className="branding-features">
            {['Fast onboarding', 'Role-based access', 'Simple collaboration'].map((feature) => (
              <div key={feature} className="branding-feature">
                <div className="branding-feature-dot" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrapper auth-form-wrapper-wide">
          <div className="auth-card auth-card-enhanced">
            <div className="auth-badge">Create Your Account</div>

            <div className="auth-form-header">
              <h2 className="auth-title">Get started</h2>
              <p className="auth-subtitle">Set up your account and choose your role</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group auth-form-group">
                <label className="form-label auth-form-label">Full Name *</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    className="form-input auth-input"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="form-group auth-form-group">
                <label className="form-label auth-form-label">Email Address *</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    className="form-input auth-input"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group auth-form-group">
                <label className="form-label auth-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Shield size={14} /> Account Role
                </label>
                <div className="role-selector">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={`role-chip ${formData.role === role.value ? 'active' : ''}`}
                      onClick={() => handleRoleSelect(role.value)}
                    >
                      <span className="role-chip-title">{role.label}</span>
                      <span className="role-chip-desc">{role.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-input-grid">
                <div className="form-group auth-form-group">
                  <label className="form-label auth-form-label">Password *</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-input auth-input auth-input-with-toggle"
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group auth-form-group">
                  <label className="form-label auth-form-label">Confirm Password *</label>
                  <div className="input-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      className="form-input auth-input auth-input-with-toggle"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-header">
                    <span>Password strength</span>
                    <strong style={{ color: passwordStrength.color }}>{passwordStrength.label}</strong>
                  </div>
                  <div className="password-strength-track">
                    <div
                      className="password-strength-fill"
                      style={{ width: `${(passwordStrength.score / 4) * 100}%`, background: passwordStrength.color }}
                    />
                  </div>
                </div>
              )}

              {formData.password && (
                <div className="password-requirements">
                  <p className="password-requirements-title">Password checklist</p>
                  <ul>
                    {passwordChecks.map((check) => (
                      <li key={check.label} className={check.valid ? 'valid' : ''}>
                        {check.valid ? <Check size={12} /> : <span style={{ width: 12 }} />} {check.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(formError || error) && (
                <div className="error-message">
                  {formError || error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg auth-submit-btn" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="auth-security-note">
              <ShieldCheck size={14} />
              Your account and data are protected
            </p>

            <p className="auth-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
