import { formatTokenAmount } from '@kyber/utils/number';

import defaultTokenLogo from '@/assets/svg/question.svg?url';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { formatCurrency } from '@/utils';

const PositionLiquidity = () => {
  const pool = usePoolStore(s => s.pool);
  const position = usePositionStore(s => s.position);

  const initializing = pool === 'loading';
  const positionNotExist = position === 'loading' || !position || initializing;

  const amount0 = positionNotExist ? '0' : formatTokenAmount(position.amount0, pool.token0.decimals);
  const amount1 = positionNotExist ? '0' : formatTokenAmount(position.amount1, pool.token1.decimals);

  return (
    <div className="px-4 py-3 mt-4 border border-stroke rounded-md">
      <p className="text-subText mb-4 text-sm">{!initializing ? 'Your Position Liquidity' : 'Loading...'}</p>
      {!initializing && (
        <>
          <div className="flex justify-between">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool.token0.logo}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token0.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{amount0}</p>
              <p className="text-subText text-xs mt-1">
                {formatCurrency(parseFloat(amount0.replace(/,/g, '')) * (pool.token0.price || 0))}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex gap-2">
              <img
                className="w-4 h-4"
                src={pool?.token1.logo}
                alt="token0 logo"
                onError={({ currentTarget }) => {
                  currentTarget.onerror = null;
                  currentTarget.src = defaultTokenLogo;
                }}
              />
              <span className="relative top-[-4px]">{pool?.token1.symbol}</span>
            </div>
            <div className="text-right relative top-[-4px]">
              <p>{amount1}</p>
              <p className="text-subText text-xs mt-1">
                {formatCurrency(parseFloat(amount1.replace(/,/g, '')) * (pool.token1.price || 0))}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PositionLiquidity;
