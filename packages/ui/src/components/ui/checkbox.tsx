import * as React from 'react';

import { cn } from '@kyber/utils/tailwind-helpers';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, checked, onChange, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.checked);
      }
    };

    return (
      <label
        className={cn('flex items-center gap-2 cursor-pointer group', disabled && 'opacity-50 cursor-not-allowed')}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 border-2 rounded transition-all duration-200',
              'ks-ui-style',
              checked ? 'bg-primary border-primary' : 'bg-transparent border-gray-400',
            )}
          >
            {checked && (
              <svg
                className="absolute inset-0 w-full h-full text-white"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.5 10.5L9 13L13.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span className={cn('text-sm text-foreground transition-colors', disabled && '!text-subText')}>{label}</span>
        )}
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
