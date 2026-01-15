import { PI_LEVEL } from '@kyber/utils';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export const WarningMsg = () => {
  const { theme } = useZapOutContext(s => s);
  const { route } = useZapOutUserState();
  const { zapImpact } = useZapRoute();

  return (
    <>
      {route && zapImpact.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            zapImpact.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: zapImpact.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {zapImpact.msg}
        </div>
      )}
    </>
  );
};
