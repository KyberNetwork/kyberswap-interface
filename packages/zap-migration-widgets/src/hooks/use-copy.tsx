import { useCallback, useState } from 'react';

import { cn } from '@kyber/utils/tailwind-helpers';

import CheckIcon from '@/assets/icons/circle-check.svg';
import CopyIcon from '@/assets/icons/copy.svg';

const COPY_TIMEOUT = 2000;
let hideCopied: ReturnType<typeof setTimeout>;

export default function useCopy({
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

    clearTimeout(hideCopied);
    hideCopied = setTimeout(() => {
      setCopied(false);
    }, COPY_TIMEOUT);
  }, [text]);

  return !copied ? (
    <CopyIcon
      className={cn('w-[14px] h-[14px] text-subText hover:text-text cursor-pointer', copyClassName)}
      onClick={copy}
    />
  ) : (
    <CheckIcon className={cn('w-[14px] h-[14px] text-accent', successClassName)} />
  );
}
