import { cn } from '@kyber/utils/tailwind-helpers';

import Loader from '@/assets/icons/loader.svg?react';

export default function Loading({ className, ...rest }: { className?: string }) {
  return <Loader className={cn('ks-ui-style w-4 h-4 animate-spin', className)} {...rest} />;
}
