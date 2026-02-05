import { useCallback, useEffect, useMemo, useState } from "react";

import { API_URLS, EarnChain, Exchange } from "@kyber/schema";
import { enumToArrayOfValues } from "@kyber/utils";

import { EarnPosition, PositionStatus } from "@/types";

const earnSupportedChains = enumToArrayOfValues(EarnChain, "number");
export const earnSupportedExchanges = enumToArrayOfValues(Exchange);

const sortPositions = (positions: EarnPosition[]) => {
  return positions.sort((a, b) => {
    // First sort by status: OUT_RANGE should come before IN_RANGE
    if (
      a.status === PositionStatus.OUT_RANGE &&
      b.status === PositionStatus.IN_RANGE
    ) {
      return -1;
    }
    if (
      a.status === PositionStatus.IN_RANGE &&
      b.status === PositionStatus.OUT_RANGE
    ) {
      return 1;
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
  filterExchanges,
  skipOutRangeSort = false,
}: {
  positionId?: string;
  poolAddress?: string;
  search: string;
  account?: string;
  chainId?: number; // Optional - when not provided, fetches positions from all supported chains
  filterExchanges?: Exchange[];
  skipOutRangeSort?: boolean;
}) {
  const [userPositions, setUserPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Track if we've completed the initial fetch
  const [hasFetched, setHasFetched] = useState(false);

  const positions = useMemo(() => {
    const positions = positionId
      ? userPositions.filter((position: EarnPosition) =>
          position.pool.protocol.type !== Exchange.DEX_UNISWAPV2
            ? position.tokenId.toString() !== positionId
            : position.pool.address !== poolAddress,
        )
      : userPositions;
    // Skip out-range sorting for smart-exit variant (keep API's valueUsd:desc order)
    return skipOutRangeSort ? positions : sortPositions(positions);
  }, [poolAddress, positionId, userPositions, skipOutRangeSort]);

  const handleGetUserPositions = useCallback(async () => {
    // If chainId is provided, check if it's supported; if not provided, fetch all chains
    if (
      !account ||
      (chainId !== undefined && !earnSupportedChains.includes(chainId))
    ) {
      setHasFetched(true);
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string> = {
        wallet: account,
        statuses: "PositionStatusInRange,PositionStatusOutRange",
        sorts: "valueUsd:desc",
      };
      // Only add chainIds param if specific chain is requested, otherwise fetch all supported chains
      if (chainId !== undefined) {
        params.chainIds = chainId.toString();
      } else {
        params.chainIds = earnSupportedChains.join(",");
      }
      if (search) {
        params.keyword = search;
      }
      // Filter by protocols at API level for better performance
      if (filterExchanges && filterExchanges.length > 0) {
        params.protocols = filterExchanges.join(",");
      }
      const response = await fetch(
        `${API_URLS.ZAP_EARN_API}/v1/positions?${new URLSearchParams(params).toString()}`,
      );
      const data = await response.json();
      if (data?.data?.positions) {
        setUserPositions(data.data.positions);
      }
    } catch (error) {
      console.log("fetch user positions error", error);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [account, chainId, search, filterExchanges]);

  useEffect(() => {
    handleGetUserPositions();
  }, [handleGetUserPositions]);

  // Show loading state if currently fetching OR if we haven't fetched yet (and have account)
  // When chainId is not provided (all chains mode), always allow showing loading state
  const isLoading =
    loading ||
    (!hasFetched &&
      !!account &&
      (chainId === undefined || earnSupportedChains.includes(chainId)));

  return { positions, loading: isLoading };
}
