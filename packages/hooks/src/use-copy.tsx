import { useCallback, useState } from 'react';

import { cn } from '@kyber/utils/tailwind-helpers';

const COPY_TIMEOUT = 2000;

const IconCopy = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
    <g>
      <path
        d="M15 20H5V7C5 6.45 4.55 6 4 6C3.45 6 3 6.45 3 7V20C3 21.1 3.9 22 5 22H15C15.55 22 16 21.55 16 21C16 20.45 15.55 20 15 20ZM20 16V4C20 2.9 19.1 2 18 2H9C7.9 2 7 2.9 7 4V16C7 17.1 7.9 18 9 18H18C19.1 18 20 17.1 20 16ZM18 16H9V4H18V16Z"
        fill="currentcolor"
      />
    </g>
  </svg>
);

const CircleCheckBig = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

export function useCopy({
  text,
  copyClassName,
  successClassName,
}: {
  text: string;
  copyClassName?: string;
  successClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, COPY_TIMEOUT);
  }, [text]);

  return !copied ? (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'inline-flex items-center justify-center border-none bg-transparent outline-none cursor-pointer',
        copyClassName,
      )}
    >
      <IconCopy className={cn('w-[14px] h-[14px] text-subText hover:text-text')} />
    </button>
  ) : (
    <CircleCheckBig className={cn('w-[14px] h-[14px] text-accent', successClassName)} />
  );
}
