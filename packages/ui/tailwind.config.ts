import type { Config } from 'tailwindcss';

import sharedConfig from '@kyber/tailwind-config';

const config: Pick<Config, 'presets' | 'content' | 'darkMode' | 'theme' | 'safelist'> = {
  darkMode: ['class'],
  content: ['./src/**/*.tsx'],
  presets: [sharedConfig],
  safelist: [
    // === CLASSES PASSED TO UI COMPONENTS ===

    // TokenLogo classes
    'border-[2px]',
    'border-layer1',
    '-ml-[6px]',
    'h-5',
    'w-5',
    'h-[18px]',
    'w-[18px]',
    '-ml-2',
    'relative',
    '-left-[6px]',
    '-bottom-[6px]',
    'sm:h-5',
    'sm:w-5',

    // Skeleton classes - dimensions
    'w-[300px]',
    'h-7',
    'w-[400px]',
    'w-[100px]',
    'w-[200px]',
    'w-14',
    'h-4',
    'w-32',
    'h-5',
    'w-20',
    'w-24',
    'mt-1',
    'w-16',
    'w-full',
    'h-full',
    'w-10',
    'ml-2',
    'h-3',
    'w-6',
    'mt-2',
    'w-[200px]',
    'h-3.5',
    'w-[60px]',
    'w-8',
    'h-2.5',
    'h-6',
    'w-[150px]',
    'w-[120px]',
    'mt-3',

    // Button classes
    'flex-1',
    '!border-none',
    '!text-icon',
    'ks-primary-btn',
    'absolute',
    '-bottom-14',
    'left-0',

    // MouseoverTooltip classes
    'top-16',
    'right-6',
    'max-sm:absolute',

    // ScrollArea classes
    'custom-scrollbar',
    '!mt-0',
    'h-[360px]',
    'mt-4',

    // Accordion classes
    'transition-all',
    '[&[data-state=open]>svg]:rotate-180',
    'data-[state=closed]:animate-accordion-up',
    'data-[state=open]:animate-accordion-down',
    'px-5',
    'py-4',
    'bg-black',
    'bg-opacity-[0.2]',
    'rounded-b-md',
    'flex',
    'gap-3',
    'justify-between',
    'flex-wrap',
    'px-4',
    'pb-4',
    'pt-0',
    'border',
    'border-stroke',
    '!border-t-0',
    'mt-2',

    // === CORE TAILWIND CLASSES ===

    // Common border utilities
    'border-0',
    'border-2',
    'border-4',
    'border-t',
    'border-r',
    'border-b',
    'border-l',

    // Common margin/padding utilities
    'ml-1',
    'ml-2',
    'ml-3',
    'ml-4',
    'ml-6',
    'ml-8',
    '-ml-1',
    '-ml-3',
    '-ml-4',
    '-ml-6',
    '-ml-8',
    'mr-1',
    'mr-2',
    'mr-3',
    'mr-4',
    'mr-6',
    'mr-8',
    '-mr-1',
    '-mr-2',
    '-mr-3',
    '-mr-4',
    '-mr-6',
    '-mr-8',
    'mt-0',
    'mt-2',
    'mt-5',
    'mt-6',
    'mb-1',
    'mb-2',
    'mb-3',
    'mb-4',
    'px-1',
    'px-2',
    'px-3',
    'px-4',
    'px-6',
    'px-8',
    'py-1',
    'py-2',
    'py-3',
    'py-4',
    'py-6',
    'p-1',
    'p-2',
    'p-3',
    'p-4',
    'p-5',
    'p-6',
    'p-8',

    // Common display utilities
    'block',
    'inline-block',
    'inline',
    'inline-flex',
    'grid',
    'hidden',

    // Common position utilities
    'static',
    'fixed',
    'sticky',

    // Common flexbox utilities
    'flex-row',
    'flex-col',
    'items-center',
    'items-start',
    'items-end',
    'justify-center',
    'justify-start',
    'justify-end',
    'justify-between',
    'gap-1',
    'gap-2',
    'gap-4',
    'gap-5',
    'gap-6',
    'gap-8',

    // Common rounded utilities
    'rounded',
    'rounded-full',
    'rounded-md',
    'rounded-lg',
    'rounded-sm',

    // Theme colors
    'border-layer2',
    'border-accent',
    'border-warning',
    'border-error',
    'border-success',
    'border-blue',
    'border-primary',
    'border-interactive',
    'border-text',
    'border-subText',

    'bg-layer1',
    'bg-layer2',
    'bg-accent',
    'bg-interactive',
    'bg-warning',
    'bg-error',
    'bg-success',
    'bg-blue',
    'bg-primary',
    'bg-transparent',

    'text-text',
    'text-subText',
    'text-textRevert',
    'text-accent',
    'text-warning',
    'text-error',
    'text-success',
    'text-blue',
    'text-primary',
    'text-interactive',

    // Responsive variants
    'sm:block',
    'sm:flex',
    'sm:hidden',
    'sm:!hidden',
    'max-sm:absolute',

    // Hover/focus states
    'hover:bg-accent',
    'hover:text-accent',
    'hover:border-accent',
    'focus:border-success',
    'focus:text-text',

    // Animation classes
    'animate-spin',
    'duration-700',
    'ease-linear',
    'repeat-infinite',
    'transition-colors',
    'transition-all',

    'h-auto',
    'border-dotted',
    'w-[14px]',
    'h-[14px]',
    'cursor-pointer',
    'hover:text-text',
    'right-5',
    'sm:right-6',
    'rounded-b-none',
  ],
  theme: {
    extend: {
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
};

export default config;
