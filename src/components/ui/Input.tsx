import { forwardRef, type InputHTMLAttributes, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** If passed, renders visible <label> */
  label?: string;
  /** Use when you DON'T want visible <label> (placeholder-only), but still accessibility */
  ariaLabel?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, ariaLabel, error, helperText, className = '', id, ...props }, ref) => {
    // useId prevents SSR/CSR mismatch (no more Math.random())
    const reactId = useId();
    const inputId = id ?? `in-${reactId}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const inputClasses = [
      'block w-full rounded-md border px-3 py-2.5 text-sm text-gray-900',
      'placeholder-gray-600', // darker placeholder
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
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          // If no visible label, we still have accessible name
          aria-label={ariaLabel ?? label}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
          {...props}
        />

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

Input.displayName = 'Input';

export default Input;
