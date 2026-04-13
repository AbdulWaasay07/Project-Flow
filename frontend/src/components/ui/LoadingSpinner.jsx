export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: { spinner: 'w-6 h-6 border-2', text: 'text-sm' },
    md: { spinner: 'w-10 h-10 border-3', text: 'text-base' },
    lg: { spinner: 'w-14 h-14 border-4', text: 'text-lg' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${s.spinner}`}></div>
      {text && <p className={`loading-text ${s.text}`}>{text}</p>}
    </div>
  );
}
