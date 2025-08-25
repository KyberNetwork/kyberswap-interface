import { cn } from '@kyber/utils/tailwind-helpers';

import { useWidgetStore } from '@/stores/useWidgetStore';

export default function WarningMessage({ isWarning, message }: { isWarning: boolean; message: string }) {
  const { theme } = useWidgetStore();

  return (
    <div
      className={cn(
        'rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px]',
        isWarning ? 'text-warning' : 'text-error',
      )}
      style={{ background: isWarning ? `${theme.warning}33` : `${theme.error}33` }}
    >
      {message}
    </div>
  );
}
