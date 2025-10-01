import { PI_LEVEL } from '@kyber/utils';

import { useSwapPI } from '@/components/SwapImpact';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export const WarningMsg = () => {
  const { theme } = useZapOutContext(s => s);
  const { route } = useZapOutUserState();
  const { zapPiRes } = useSwapPI();

  return (
    <>
      {route && zapPiRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            zapPiRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: zapPiRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {zapPiRes.msg}
        </div>
      )}
    </>
  );
};
