import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message || 'Invalid credentials');
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
            Manage Projects
            <br />
            <span>Effortlessly</span>
          </h1>

          <p className="branding-description">
            Collaborate with your team, track delivery, and keep every project moving.
          </p>

          <div className="branding-features">
            {['Real-time collaboration', 'Task management', 'Team analytics'].map((feature) => (
              <div key={feature} className="branding-feature">
                <div className="branding-feature-dot" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <div className="auth-card auth-card-enhanced">
            <div className="auth-badge">Secure Sign In</div>

            <div className="auth-form-header">
              <h2 className="auth-title">Welcome back</h2>
              <p className="auth-subtitle">Sign in to continue to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group auth-form-group">
                <label className="form-label auth-form-label">Email Address</label>
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
                <label className="form-label auth-form-label">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input auth-input auth-input-with-toggle"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
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

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <span className="auth-form-note">Use your work account</span>
              </div>

              {(formError || error) && (
                <div className="error-message">
                  {formError || error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg auth-submit-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <p className="auth-security-note">
              <ShieldCheck size={14} />
              Encrypted and secure authentication
            </p>

            <p className="auth-footer">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-link">Create account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
