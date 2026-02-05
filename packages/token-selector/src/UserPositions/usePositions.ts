import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { API_URLS, EarnChain, Exchange } from "@kyber/schema";
import { enumToArrayOfValues } from "@kyber/utils";

import { EarnPosition, PositionStatus } from "@/types";

const DEBOUNCE_DELAY = 300;
const PAGE_SIZE = 10;

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
  filterChains,
  skipOutRangeSort = false,
}: {
  positionId?: string;
  poolAddress?: string;
  search: string;
  account?: string;
  chainId?: number; // Optional - when not provided, fetches positions from all supported chains
  filterExchanges?: Exchange[];
  filterChains?: number[]; // Optional - when provided, only fetch positions from these chains
  skipOutRangeSort?: boolean;
}) {
  const [userPositions, setUserPositions] = useState<EarnPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  // Track if we've completed the initial fetch
  const [hasFetched, setHasFetched] = useState(false);
  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Track current fetch params to detect changes
  const currentParamsRef = useRef<string>("");

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

  const fetchPositions = useCallback(
    async (pageNum: number, isLoadMore = false) => {
      // If chainId is provided, check if it's supported; if not provided, fetch all chains
      if (
        !account ||
        (chainId !== undefined && !earnSupportedChains.includes(chainId))
      ) {
        setHasFetched(true);
        return;
      }

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params: Record<string, string> = {
          wallet: account,
          statuses: "PositionStatusInRange,PositionStatusOutRange",
          sorts: "valueUsd:desc",
          page: pageNum.toString(),
          pageSize: PAGE_SIZE.toString(),
        };
        // Determine which chains to fetch:
        // 1. If specific chainId is provided, use that chain only
        // 2. If filterChains is provided, use those chains
        // 3. Otherwise, fetch all supported chains
        if (chainId !== undefined) {
          params.chainIds = chainId.toString();
        } else if (filterChains && filterChains.length > 0) {
          params.chainIds = filterChains.join(",");
        } else {
          params.chainIds = earnSupportedChains.join(",");
        }
        if (debouncedSearch) {
          params.keyword = debouncedSearch;
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
          const newPositions = data.data.positions;

          if (isLoadMore) {
            setUserPositions((prev) => [...prev, ...newPositions]);
          } else {
            setUserPositions(newPositions);
          }

          // Check if there are more pages
          const pagination = data.data.pagination;
          if (pagination) {
            setHasMore(pagination.page < pagination.totalPages);
          } else {
            // Fallback: if we got fewer items than page size, no more pages
            setHasMore(newPositions.length >= PAGE_SIZE);
          }
        }
      } catch (error) {
        console.log("fetch user positions error", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setHasFetched(true);
      }
    },
    [account, chainId, debouncedSearch, filterExchanges, filterChains],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPositions(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchPositions]);

  // Debounce search term
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [search]);

  // Reset and fetch when params change (except page)
  useEffect(() => {
    const paramsKey = `${account}-${chainId}-${debouncedSearch}-${filterExchanges?.join(",")}-${filterChains?.join(",")}`;
    if (currentParamsRef.current !== paramsKey) {
      currentParamsRef.current = paramsKey;
      setPage(1);
      setHasMore(true);
      setUserPositions([]);
      fetchPositions(1, false);
    }
  }, [account, chainId, debouncedSearch, filterExchanges, filterChains, fetchPositions]);

  // Show loading state if currently fetching OR if we haven't fetched yet (and have account)
  // When chainId is not provided (all chains mode), always allow showing loading state
  const isLoading =
    loading ||
    (!hasFetched &&
      !!account &&
      (chainId === undefined || earnSupportedChains.includes(chainId)));

  return {
    positions,
    loading: isLoading,
    loadingMore,
    hasMore,
    loadMore,
  };
}
