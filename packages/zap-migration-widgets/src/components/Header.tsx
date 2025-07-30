import { MouseoverTooltip, Skeleton } from '@kyber/ui';

import ArrowLeft from '@/assets/icons/ic_left_arrow.svg';
import SettingIcon from '@/assets/icons/setting.svg';
import X from '@/assets/icons/x.svg';
import { PoolInfo } from '@/components/PoolInfo';
import Setting from '@/components/Setting';
import { ChainId } from '@/schema';
import { usePoolsStore } from '@/stores/usePoolsStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useZapStateStore } from '@/stores/useZapStateStore';

export function Header({ onClose, onBack, chainId }: { onClose: () => void; onBack?: () => void; chainId: ChainId }) {
  const { pools, theme } = usePoolsStore();
  const { fromPosition, toPosition } = usePositionStore();
  const { degenMode, toggleSetting } = useZapStateStore();

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xl font-medium">
        {pools === 'loading' ? (
          <Skeleton className="w-[300px] h-7" />
        ) : (
          <div className="flex items-center gap-2">
            {onBack && <ArrowLeft className="cursor-pointer text-subText hover:text-text" onClick={onBack} />}
            Migrate {pools[0].token0.symbol}/{pools[0].token1.symbol} to {pools[1].token0.symbol}/
            {pools[1].token1.symbol}
          </div>
        )}
        <button onClick={onClose}>
          <X className="text-subText" />
        </button>
      </div>

      <div className="flex gap-4 md:!gap-12 mt-8">
        <div className="flex-1">
          <PoolInfo pool={pools === 'loading' ? 'loading' : pools[0]} chainId={chainId} position={fromPosition} />
        </div>
        <div className="flex md:flex-1 justify-between">
          <div className="hidden md:block">
            <PoolInfo pool={pools === 'loading' ? 'loading' : pools[1]} chainId={chainId} position={toPosition} />
          </div>
          <MouseoverTooltip text={degenMode ? 'Degen Mode is turned on!' : ''}>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-full bg-layer2 hover:opacity-60 setting"
              id="zapout-setting"
              role="button"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                toggleSetting();
              }}
              style={{
                background: degenMode ? theme.warning + '33' : undefined,
                color: degenMode ? theme.warning : undefined,
              }}
            >
              <SettingIcon />
            </div>
          </MouseoverTooltip>
        </div>
      </div>

      <Setting />
    </div>
  );
}
