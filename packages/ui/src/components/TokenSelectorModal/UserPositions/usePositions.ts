import { useCallback, useEffect, useMemo, useState } from 'react';

import { API_URLS, ChainId, EarnChain, EarnDex, Exchange } from '@kyber/schema';
import { enumToArrayOfValues } from '@kyber/utils';
import { isAddress } from '@kyber/utils/crypto';

import { EarnPosition, PositionStatus } from '@/components/TokenSelectorModal/types';

const earnSupportedChains = enumToArrayOfValues(EarnChain, 'number');
export const earnSupportedExchanges = enumToArrayOfValues(Exchange);

const sortPositions = (positions: EarnPosition[]) => {
  return positions.sort((a, b) => {
    // First sort by status: OUT_RANGE should come before IN_RANGE
    if (a.status === PositionStatus.OUT_RANGE && b.status === PositionStatus.IN_RANGE) {
      return -1; // a (OUT_RANGE) comes before b (IN_RANGE)
    }
    if (a.status === PositionStatus.IN_RANGE && b.status === PositionStatus.OUT_RANGE) {
      return 1; // b (OUT_RANGE) comes before a (IN_RANGE)
    }
    // If status is the same, sort by currentPositionValue (descending)
    return b.currentPositionValue - a.currentPositionValue;
  });
};

export default function usePositions({
  positionId,
  poolAddress,
  search,
  account,
  chainId,
}: {
  positionId?: string;
  poolAddress: string;
  search: string;
  account?: string;
  chainId: ChainId;
}) {
  const [userPositions, setUserPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const positions = useMemo(() => {
    const positions = positionId
      ? userPositions.filter((position: EarnPosition) =>
          position.pool.project !== EarnDex.DEX_UNISWAPV2
            ? position.tokenId !== positionId
            : position.pool.poolAddress !== poolAddress,
        )
      : userPositions;
    if (!search) return sortPositions(positions);

    return sortPositions(
      positions.filter((position: EarnPosition) => {
        const poolAddress = position.pool.poolAddress.toLowerCase();
        const token0Symbol = position.pool.tokenAmounts[0]?.token.symbol.toLowerCase();
        const token1Symbol = position.pool.tokenAmounts[1]?.token.symbol.toLowerCase();
        const token0Name = position.pool.tokenAmounts[0]?.token.name.toLowerCase();
        const token1Name = position.pool.tokenAmounts[1]?.token.name.toLowerCase();
        const token0Address = position.pool.tokenAmounts[0]?.token.address.toLowerCase();
        const token1Address = position.pool.tokenAmounts[1]?.token.address.toLowerCase();
        const positionId = position.tokenId;

        console.log('position', position);

        return isAddress(search)
          ? poolAddress.includes(search.toLowerCase()) ||
              token0Address.includes(search.toLowerCase()) ||
              token1Address.includes(search.toLowerCase())
          : token0Symbol.includes(search.toLowerCase()) ||
              token1Symbol.includes(search.toLowerCase()) ||
              token0Name.includes(search.toLowerCase()) ||
              token1Name.includes(search.toLowerCase()) ||
              positionId === search.toLowerCase();
      }),
    );
  }, [poolAddress, positionId, search, userPositions]);

  const handleGetUserPositions = useCallback(async () => {
    if (!account || !earnSupportedChains.includes(chainId)) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URLS.ZAP_EARN_API}/v1/userPositions` +
          '?' +
          new URLSearchParams({
            addresses: account,
            chainIds: chainId.toString(),
            protocols: earnSupportedExchanges.join(','),
            quoteSymbol: 'usd',
            offset: '0',
            orderBy: 'liquidity',
            orderASC: 'false',
            positionStatus: 'open',
          }).toString(),
      );
      const data = await response.json();
      if (data?.data?.positions) {
        setUserPositions(data.data.positions);
      }
    } catch (error) {
      console.log('fetch user positions error', error);
    } finally {
      setLoading(false);
    }
  }, [account, chainId]);

  useEffect(() => {
    handleGetUserPositions();
  }, [handleGetUserPositions]);

  return { positions, loading };
}
