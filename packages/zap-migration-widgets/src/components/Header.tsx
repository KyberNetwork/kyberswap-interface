import { MouseoverTooltip, Skeleton } from '@kyber/ui';

import ArrowLeft from '@/assets/icons/ic_left_arrow.svg';
import ArrowRight from '@/assets/icons/ic_right_arrow.svg';
import SettingIcon from '@/assets/icons/setting.svg';
import X from '@/assets/icons/x.svg';
import { PoolInfo, PoolInfoType } from '@/components/PoolInfo';
import Setting from '@/components/Setting';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export function Header({ onClose, onBack }: { onClose: () => void; onBack?: () => void }) {
  const { theme, rePositionMode } = useWidgetStore(['theme', 'rePositionMode']);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { targetPositionId } = usePositionStore(['targetPositionId']);
  const { degenMode, toggleSetting } = useZapStore(['degenMode', 'toggleSetting']);

  return (
    <div className="relative">
      <div className="flex items-center justify-between text-xl font-medium">
        {!sourcePool || !targetPool ? (
          <Skeleton className="w-[250px] sm:w-[400px] h-7" />
        ) : (
          <div className="flex items-center gap-2">
            {onBack && <ArrowLeft className="cursor-pointer text-subText hover:text-text" onClick={onBack} />}
            {rePositionMode
              ? 'Reposition'
              : targetPositionId
                ? 'Migrate to increase position liquidity'
                : 'Migrate liquidity'}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <MouseoverTooltip text={degenMode ? 'Degen Mode is turned on!' : ''}>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-full hover:opacity-60 setting"
              id="zap-migration-setting"
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
          <button onClick={onClose}>
            <X className="text-subText" />
          </button>
        </div>
      </div>

      {rePositionMode ? (
        <div className="text-sm text-subText italic">Your current position will be closed and a new one created.</div>
      ) : null}

      <div className="flex items-center gap-4 mt-6">
        <div className="flex-1">
          <PoolInfo type={PoolInfoType.Source} />
        </div>
        <div className="hidden md:block">
          <ArrowRight className="text-primary w-6 h-6" />
        </div>
        <div className="hidden md:flex md:flex-1">
          <PoolInfo type={PoolInfoType.Target} />
        </div>
      </div>

      <Setting />
    </div>
  );
}
