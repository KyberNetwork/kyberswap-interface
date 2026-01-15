import { useCallback, useEffect, useMemo, useState } from 'react';

import { API_URLS, ChainId, EarnChain, Exchange } from '@kyber/schema';
import { enumToArrayOfValues } from '@kyber/utils';

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

    return 0;
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
  poolAddress?: string;
  search: string;
  account?: string;
  chainId: ChainId;
}) {
  const [userPositions, setUserPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const positions = useMemo(() => {
    const positions = positionId
      ? userPositions.filter((position: EarnPosition) =>
          position.pool.protocol.type !== Exchange.DEX_UNISWAPV2
            ? position.tokenId.toString() !== positionId
            : position.pool.address !== poolAddress,
        )
      : userPositions;
    return sortPositions(positions);
  }, [poolAddress, positionId, userPositions]);

  const handleGetUserPositions = useCallback(async () => {
    if (!account || !earnSupportedChains.includes(chainId)) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {
        wallet: account,
        chainIds: chainId.toString(),
        statuses: 'PositionStatusInRange,PositionStatusOutRange',
        sorts: 'valueUsd:desc',
      };
      if (search) {
        params.keyword = search;
      }
      const response = await fetch(`${API_URLS.ZAP_EARN_API}/v1/positions?${new URLSearchParams(params).toString()}`);
      const data = await response.json();
      if (data?.data?.positions) {
        setUserPositions(data.data.positions);
      }
    } catch (error) {
      console.log('fetch user positions error', error);
    } finally {
      setLoading(false);
    }
  }, [account, chainId, search]);

  useEffect(() => {
    handleGetUserPositions();
  }, [handleGetUserPositions]);

  return { positions, loading };
}
