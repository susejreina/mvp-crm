import { forwardRef, type SelectHTMLAttributes, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** If passed, renders visible <label> */
  label?: string;
  /** Use when you DON'T want visible <label> but still accessibility */
  ariaLabel?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, ariaLabel, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const reactId = useId();
    const selectId = id ?? `sel-${reactId}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;

    const selectClasses = [
      'block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900 bg-white',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="w-full">
        {label ? (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        ) : null}

        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          aria-label={ariaLabel ?? label}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;