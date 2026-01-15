import { useCallback, useState } from 'react';

import { cn } from '@kyber/utils/tailwind-helpers';

import CircleCheckBig from './assets/svg/circle-check-big.svg?react';
import IconCopy from './assets/svg/copy.svg?react';

const COPY_TIMEOUT = 2000;

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
