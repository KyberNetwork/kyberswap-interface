import { useEffect, useState } from 'react';

import { formatTokenAmount } from '@kyber/utils/number';

import useZapRoute from '@/hooks/useZapRoute';
import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export default function useOnSuccess({ txHash, txStatus }: { txHash: string; txStatus: string }) {
  const { onSuccess, pool, positionId, position } = useZapOutContext(s => s);
  const { mode, tokenOut, liquidityOut } = useZapOutUserState();
  const { refund, removeLiquidity, earnedFee } = useZapRoute();

  const [onSuccessTriggered, setOnSuccessTriggered] = useState(false);

  useEffect(() => {
    if (!txHash || txStatus !== 'success' || !onSuccess || onSuccessTriggered || !pool || !position) return;

    setOnSuccessTriggered(true);

    const tokensOut =
      mode === 'zapOut' && tokenOut
        ? [
            {
              symbol: tokenOut.symbol,
              amount: String(refund.refunds[0]?.amount || 0),
              logoUrl: tokenOut.logo,
            },
          ]
        : [
            {
              symbol: pool.token0.symbol,
              amount: formatTokenAmount(removeLiquidity.removedAmount0 + earnedFee.earnedFee0, pool.token0.decimals, 6),
              logoUrl: pool.token0.logo,
            },
            {
              symbol: pool.token1.symbol,
              amount: formatTokenAmount(removeLiquidity.removedAmount1 + earnedFee.earnedFee1, pool.token1.decimals, 6),
              logoUrl: pool.token1.logo,
            },
          ];

    onSuccess({
      txHash,
      positionId,
      pool: {
        address: pool.address,
        fee: pool.fee,
      },
      token0: {
        address: pool.token0.address,
        symbol: pool.token0.symbol,
        logo: pool.token0.logo || '',
      },
      token1: {
        address: pool.token1.address,
        symbol: pool.token1.symbol,
        logo: pool.token1.logo || '',
      },
      mode: mode as 'zapOut' | 'withdrawOnly',
      tokensOut,
    });
  }, [
    txHash,
    txStatus,
    onSuccess,
    onSuccessTriggered,
    pool,
    position,
    positionId,
    mode,
    tokenOut,
    refund,
    removeLiquidity,
    earnedFee,
    liquidityOut,
  ]);
}
