import { useSwapPI } from '@/components/SwapImpact';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';
import { PI_LEVEL } from '@/utils';

export const WarningMsg = () => {
  const { theme } = useZapOutContext(s => s);
  const { route } = useZapOutUserState();
  const { swapPiRes, zapPiRes } = useSwapPI();

  return (
    <>
      {route && swapPiRes.piRes.level !== PI_LEVEL.NORMAL && (
        <div
          className={`rounded-md text-xs py-3 px-4 mt-4 font-normal leading-[18px] ${
            swapPiRes.piRes.level === PI_LEVEL.HIGH ? 'text-warning' : 'text-error'
          }`}
          style={{
            backgroundColor: swapPiRes.piRes.level === PI_LEVEL.HIGH ? `${theme.warning}33` : `${theme.error}33`,
          }}
        >
          {swapPiRes.piRes.msg}
        </div>
      )}

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
