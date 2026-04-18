import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(({
  label,
  options = [],
  error,
  icon: Icon,
  className = '',
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const baseClasses = "w-full px-4 py-2.5 rounded-lg border bg-white appearance-none text-[var(--color-text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent pr-10";
  const iconPadding = Icon ? "pl-10" : "";
  const borderClasses = error 
    ? "border-[var(--color-error)] focus:ring-[var(--color-error)]" 
    : "border-[var(--color-neutral-dark)] hover:border-[var(--color-primary)]";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none z-10">
            <Icon size={18} />
          </div>
        )}
        <select
          ref={ref}
          className={`${baseClasses} ${iconPadding} ${borderClasses} ${className}`}
          {...props}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-secondary)] z-10">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
