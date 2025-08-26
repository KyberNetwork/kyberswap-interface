import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useDebounce, useTokenBalances, useTokenPrices } from '@kyber/hooks';
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  POOL_CATEGORY,
  Token,
  ZERO_ADDRESS,
  ZapRouteDetail,
  univ3Position,
  univ3Types,
} from '@kyber/schema';
import { fetchTokens } from '@kyber/utils';
import { getTokenBalances, parseUnits } from '@kyber/utils/crypto';
import { formatNumber, formatWei } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import { ERROR_MESSAGE, getSlippageStorageKey } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapState } from '@/types/index';
import { parseTokensAndAmounts, validateData } from '@/utils';

const ZapContext = createContext<{
  tickLower: number | null;
  tickUpper: number | null;
  tokensIn: Token[];
  amountsIn: string;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  slippage?: number;
  priceLower: string | null;
  priceUpper: string | null;
  ttl: number;
  highlightDegenMode: boolean;
  showSetting: boolean;
  degenMode: boolean;
  tokenBalances: {
    [key: string]: bigint;
  };
  tokenPrices: { [key: string]: number };
  snapshotState: ZapState | null;
  slippageOpen: boolean;
  setTokensIn: (_value: Token[]) => void;
  setAmountsIn: (_value: string) => void;
  setTickLower: (_value: number) => void;
  setTickUpper: (_value: number) => void;
  setSlippage: (_val: number) => void;
  setTtl: (_val: number) => void;
  toggleSetting: (_highlightDegenMode?: boolean) => void;
  setShowSeting: (_val: boolean) => void;
  setDegenMode: (_val: boolean) => void;
  setSnapshotState: (_val: ZapState | null) => void;
  setSlippageOpen: (_val: boolean) => void;
}>({
  highlightDegenMode: false,
  tickLower: null,
  tickUpper: null,
  priceLower: null,
  priceUpper: null,
  tokensIn: [],
  amountsIn: '',
  error: '',
  zapInfo: null,
  loading: false,
  slippage: undefined,
  ttl: 20, // 20min
  showSetting: false,
  degenMode: false,
  tokenBalances: {},
  tokenPrices: {},
  snapshotState: null,
  slippageOpen: false,
  setTokensIn: (_value: Token[]) => {},
  setAmountsIn: (_value: string) => {},
  setTickLower: (_value: number) => {},
  setTickUpper: (_value: number) => {},
  setSlippage: (_val: number) => {},
  setTtl: (_val: number) => {},
  toggleSetting: (_highlightDegenMode?: boolean) => {},
  setShowSeting: (_val: boolean) => {},
  setDegenMode: (_val: boolean) => {},
  setSnapshotState: (_val: ZapState | null) => {},
  setSlippageOpen: (_val: boolean) => {},
});

export const ZapContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    chainId,
    source,
    aggregatorOptions,
    initDepositTokens,
    initAmounts,
    feeConfig,
    poolType,
    poolAddress,
    connectedAccount,
    nativeToken,
    wrappedNativeToken,
    positionId,
    initialTick,
  } = useWidgetStore(
    useShallow(s => ({
      chainId: s.chainId,
      source: s.source,
      aggregatorOptions: s.aggregatorOptions,
      initDepositTokens: s.initDepositTokens,
      initAmounts: s.initAmounts,
      feeConfig: s.feeConfig,
      poolType: s.poolType,
      poolAddress: s.poolAddress,
      connectedAccount: s.connectedAccount,
      nativeToken: s.nativeToken,
      wrappedNativeToken: s.wrappedNativeToken,
      positionId: s.positionId,
      initialTick: s.initialTick,
    })),
  );
  const { position } = usePositionStore(
    useShallow(s => ({
      position: s.position,
    })),
  );
  const { pool, revertPrice, toggleRevertPrice } = usePoolStore(
    useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice, toggleRevertPrice: s.toggleRevertPrice })),
  );

  const excludedSources = aggregatorOptions?.excludedSources?.join(',');
  const includedSources = aggregatorOptions?.includedSources?.join(',');
  const account = connectedAccount?.address;
  const networkChainId = connectedAccount?.chainId;
  const { feePcm, feeAddress } = feeConfig || {};

  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState<number | undefined>(undefined);
  const [ttl, setTtl] = useState(20);
  const [tickLower, setTickLower] = useState<number | null>(null);
  const [tickUpper, setTickUpper] = useState<number | null>(null);
  const [tokensIn, setTokensIn] = useState<Token[]>([]);
  const [amountsIn, setAmountsIn] = useState<string>('');
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [degenMode, setDegenMode] = useState(false);
  const [highlightDegenMode, setHighlightDegenMode] = useState(false);
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);
  const [slippageOpen, setSlippageOpen] = useState(false);

  const { balances } = useTokenBalances(
    chainId,
    tokensIn.map(item => item.address),
    account,
  );

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);
  const debounceAmountsIn = useDebounce(amountsIn, 300);

  const initializing = pool === 'loading';

  const isUniV3 = !initializing && univ3Types.includes(poolType as any);

  const isTokensStable = tokensIn.every(tk => tk.isStable);

  const isTokensInPair = tokensIn.every(tk => {
    const addr =
      tk.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
        ? NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase()
        : tk.address.toLowerCase();
    return (
      pool !== 'loading' && (pool.token0.address.toLowerCase() === addr || pool.token1.address.toLowerCase() === addr)
    );
  });

  useEffect(() => {
    if (pool === 'loading' || slippage) return;

    // First, try to load from localStorage
    if (pool.token0?.symbol && pool.token1?.symbol) {
      try {
        const storageKey = getSlippageStorageKey(pool.token0.symbol, pool.token1.symbol);
        const savedSlippage = localStorage.getItem(storageKey);
        if (savedSlippage) {
          const parsedSlippage = parseInt(savedSlippage, 10);
          if (!isNaN(parsedSlippage) && parsedSlippage > 0) {
            // Only set if it's different from current slippage
            if (parsedSlippage !== slippage) {
              setSlippage(parsedSlippage);
              return; // Exit early if we loaded from localStorage
            }
          }
        }
      } catch (error) {
        // Silently handle localStorage errors
        console.warn('Failed to load slippage from localStorage:', error);
      }
    }

    if (pool.category === POOL_CATEGORY.STABLE_PAIR && isTokensStable) setSlippage(1);
    else if (pool.category === POOL_CATEGORY.CORRELATED_PAIR && isTokensInPair) setSlippage(5);
    else setSlippage(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  const { prices: tokenPrices } = useTokenPrices({
    addresses: tokensIn.map(token => token.address.toLowerCase()),
    chainId,
  });

  const priceLower = useMemo(() => {
    if (initializing || tickLower == null) return null;
    return formatNumber(+tickToPrice(tickLower, pool.token0.decimals, pool.token1.decimals, revertPrice), 8);
  }, [pool, tickLower, revertPrice, initializing]);

  const priceUpper = useMemo(() => {
    if (initializing || tickUpper === null) return null;
    return formatNumber(+tickToPrice(tickUpper, pool.token0.decimals, pool.token1.decimals, revertPrice), 8);
  }, [pool, tickUpper, revertPrice, initializing]);

  const error = useMemo(
    () =>
      validateData({
        account,
        chainId,
        networkChainId,
        tokensIn,
        isUniV3,
        tickLower: tickLower || 0,
        tickUpper: tickUpper || 0,
        amountsIn: debounceAmountsIn,
        balances,
        zapApiError,
      }),
    [
      account,
      chainId,
      networkChainId,
      tokensIn,
      debounceAmountsIn,
      tickLower,
      tickUpper,
      zapApiError,
      balances,
      isUniV3,
    ],
  );

  const toggleSetting = (highlight?: boolean) => {
    setShowSeting(prev => !prev);
    if (highlight) {
      setHighlightDegenMode(true);
      setTimeout(() => {
        setHighlightDegenMode(false);
      }, 4000);
    }
  };

  // set tick if position exists
  useEffect(() => {
    if (position) {
      const { success: isUniV3Position, data } = univ3Position.safeParse(position);

      if (isUniV3Position && data.tickUpper !== undefined && data.tickLower !== undefined) {
        setTickLower(data.tickLower);
        setTickUpper(data.tickUpper);
      }
    }
  }, [position]);

  useEffect(() => {
    if (initialTick && !tickLower && !tickUpper) {
      setTickLower(initialTick.tickLower);
      setTickUpper(initialTick.tickUpper);
    }
  }, [initialTick, tickLower, tickUpper]);

  const setDefaultTokensIn = useCallback(async () => {
    if (!pool || initializing || tokensIn.length) return;

    // with params
    if (initDepositTokens) {
      const tokens = await fetchTokens(initDepositTokens?.split(',') || [], chainId);

      const listInitAmounts = initAmounts?.split(',') || [];
      const parseListAmountsIn: string[] = [];

      if (tokens.length) {
        tokens.forEach((_, index: number) => {
          parseListAmountsIn.push(listInitAmounts[index] || '');
        });
        setTokensIn(tokens as Token[]);
        setAmountsIn(parseListAmountsIn.join(','));
        return;
      }
    }

    // without wallet connect
    if (!account) {
      setTokensIn([nativeToken] as Token[]);
    }

    // with balance
    if (!initDepositTokens && account) {
      const tokensToSet = [];

      const token0Address = pool.token0.address.toLowerCase();
      const token1Address = pool.token1.address.toLowerCase();
      const pairBalance = await getTokenBalances({
        tokenAddresses: [token0Address, token1Address],
        chainId,
        account,
      });

      const token0Balance = formatWei(pairBalance[token0Address]?.toString() || '0', pool.token0.decimals);
      const token1Balance = formatWei(pairBalance[token1Address]?.toString() || '0', pool.token1.decimals);
      if (parseFloat(token0Balance) > 0) tokensToSet.push(pool.token0);
      if (parseFloat(token1Balance) > 0) tokensToSet.push(pool.token1);
      if (!tokensToSet.length) tokensToSet.push(nativeToken);

      setTokensIn(tokensToSet as Token[]);
    }
  }, [account, chainId, initAmounts, initDepositTokens, initializing, nativeToken, pool, tokensIn.length]);

  useEffect(() => {
    setDefaultTokensIn();
  }, [setDefaultTokensIn]);

  // check pair to revert
  useEffect(() => {
    if (initializing || defaultRevertChecked) return;
    setDefaultRevertChecked(true);
    const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeToken?.address.toLowerCase();
    const isToken0Stable = pool.token0.isStable;
    const isToken1Stable = pool.token1.isStable;
    if ((isToken0Stable || (isToken0Native && !isToken1Stable)) && !revertPrice) toggleRevertPrice();
  }, [defaultRevertChecked, initializing, pool, revertPrice, toggleRevertPrice, wrappedNativeToken?.address]);

  useEffect(() => {
    if (
      slippage !== undefined &&
      (isUniV3 ? debounceTickLower !== null && debounceTickUpper !== null : true) &&
      !initializing &&
      (!error ||
        error === zapApiError ||
        error === ERROR_MESSAGE.INSUFFICIENT_BALANCE ||
        error === ERROR_MESSAGE.CONNECT_WALLET ||
        error === ERROR_MESSAGE.WRONG_NETWORK)
    ) {
      let formattedAmountsInWeis = '';

      const {
        tokensIn: listValidTokensIn,
        amountsIn: listValidAmountsIn,
        tokenAddresses: validTokenInAddresses,
      } = parseTokensAndAmounts(tokensIn, amountsIn);

      try {
        formattedAmountsInWeis = listValidTokensIn
          .map((token: Token, index: number) => parseUnits(listValidAmountsIn[index] || '0', token.decimals).toString())
          .join(',');
      } catch (error) {
        console.log(error);
      }

      if (
        !validTokenInAddresses ||
        !formattedAmountsInWeis ||
        formattedAmountsInWeis === '0' ||
        formattedAmountsInWeis === '00'
      ) {
        setZapInfo(null);
        return;
      }

      setLoading(true);
      const params: { [key: string]: string | number | boolean } = {
        dex: poolType,
        'pool.id': poolAddress,
        'pool.token0': pool.token0.address,
        'pool.token1': pool.token1.address,
        'pool.fee': pool.fee * 10_000,
        ...(isUniV3 && debounceTickUpper !== null && debounceTickLower !== null && !positionId
          ? {
              'position.tickUpper': debounceTickUpper,
              'position.tickLower': debounceTickLower,
            }
          : { 'position.id': account || ZERO_ADDRESS }),
        tokensIn: validTokenInAddresses,
        amountsIn: formattedAmountsInWeis,
        slippage,
        ...(positionId ? { 'position.id': positionId } : {}),
        ...(feeAddress ? { feeAddress, feePcm } : {}),
        ...(includedSources ? { 'aggregatorOptions.includedSources': includedSources } : {}),
        ...(excludedSources ? { 'aggregatorOptions.excludedSources': excludedSources } : {}),
      };

      let tmp = '';
      Object.keys(params).forEach(key => {
        tmp = `${tmp}&${key}=${params[key]}`;
      });

      fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/in/route?${tmp.slice(1)}`, {
        headers: {
          'X-Client-Id': source,
        },
      })
        .then(res => res.json())
        .then(res => {
          if (res.data) {
            setZapApiError('');
            setZapInfo(res.data);
          } else {
            setZapInfo(null);
            setZapApiError(res.message || 'Something went wrong');
          }
        })
        .catch(e => {
          // setZapInfo(null);
          setZapApiError(e.message || 'Something went wrong');
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chainId,
    poolType,
    debounceTickLower,
    debounceTickUpper,
    feeAddress,
    feePcm,
    poolAddress,
    pool,
    slippage,
    positionId,
    includedSources,
    excludedSources,
    source,
    tokensIn,
    debounceAmountsIn,
    error,
    zapApiError,
  ]);

  return (
    <ZapContext.Provider
      value={{
        tickLower,
        tickUpper,
        tokensIn,
        setTokensIn,
        amountsIn,
        setAmountsIn,
        setTickLower,
        setTickUpper,
        error,
        zapInfo,
        loading,
        priceLower,
        priceUpper,
        slippage,
        setSlippage,
        ttl,
        setTtl,
        toggleSetting,
        setShowSeting,
        showSetting,
        degenMode,
        setDegenMode,
        tokenBalances: balances,
        tokenPrices,
        highlightDegenMode,
        snapshotState,
        setSnapshotState,
        slippageOpen,
        setSlippageOpen,
      }}
    >
      {children}
    </ZapContext.Provider>
  );
};

export const useZapState = () => {
  const context = useContext(ZapContext);
  if (context === undefined) {
    throw new Error('useZapState must be used within a ZapContextProvider');
  }
  return context;
};
