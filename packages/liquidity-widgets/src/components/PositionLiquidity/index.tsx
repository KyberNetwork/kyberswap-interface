import { Skeleton } from '@kyber/ui';
import { formatCurrency, formatTokenAmount } from '@kyber/utils/number';

import defaultTokenLogo from '@/assets/svg/question.svg?url';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';

const PositionLiquidity = () => {
  const pool = usePoolStore(s => s.pool);
  const position = usePositionStore(s => s.position);

  const initializing = pool === 'loading' || position === 'loading';
  const positionNotExist = position === 'loading' || !position || initializing;

  const amount0 = positionNotExist ? '0' : formatTokenAmount(position.amount0, pool.token0.decimals, 6);
  const amount1 = positionNotExist ? '0' : formatTokenAmount(position.amount1, pool.token1.decimals, 6);

  return (
    <div className="px-4 py-3 mt-4 border border-stroke rounded-md">
      <p className="text-subText mb-4 text-sm">Your Position Liquidity</p>
      <div className="flex justify-between">
        {initializing ? (
          <Skeleton className="w-32 h-5" />
        ) : (
          <div className="flex items-center gap-2">
            <img
              className="w-4 h-4"
              src={pool.token0.logo}
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <span>{amount0}</span>
            <span>{pool?.token0.symbol}</span>
          </div>
        )}
        {initializing ? (
          <Skeleton className="w-14 h-5" />
        ) : (
          <p className="text-subText text-xs">
            {formatCurrency(parseFloat(amount0.replace(/,/g, '')) * (pool.token0.price || 0))}
          </p>
        )}
      </div>
      <div className="flex justify-between mt-2">
        {initializing ? (
          <Skeleton className="w-32 h-5" />
        ) : (
          <div className="flex items-center gap-2">
            <img
              className="w-4 h-4"
              src={pool?.token1.logo}
              alt="token0 logo"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = defaultTokenLogo;
              }}
            />
            <span>{amount1}</span>
            <span>{pool?.token1.symbol}</span>
          </div>
        )}
        {initializing ? (
          <Skeleton className="w-14 h-5" />
        ) : (
          <p className="text-subText text-xs">
            {formatCurrency(parseFloat(amount1.replace(/,/g, '')) * (pool.token1.price || 0))}
          </p>
        )}
      </div>
    </div>
  );
};

export default PositionLiquidity;
