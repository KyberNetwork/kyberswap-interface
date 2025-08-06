import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useTokenPrices } from '@kyber/hooks';
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  Token,
  ZapRouteDetail,
  univ3Position,
} from '@kyber/schema';
import { fetchTokenInfo } from '@kyber/utils';
import { formatNumber, toString } from '@kyber/utils/number';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import { ZAP_SOURCE } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapState } from '@/types/index';
import { validateData } from '@/utils';

let fetchRouteInterval: ReturnType<typeof setInterval> | undefined;

const ZapContext = createContext<{
  tickLower: number | null;
  tickUpper: number | null;
  tokensIn: Token[];
  amountsIn: string;
  error: string;
  zapInfo: ZapRouteDetail | null;
  loading: boolean;
  slippage: number;
  priceLower: string | null;
  priceUpper: string | null;
  ttl: number;
  highlightDegenMode: boolean;
  showSetting: boolean;
  degenMode: boolean;
  tokenPrices: { [key: string]: number };
  snapshotState: ZapState | null;
  setTokensIn: (_value: Token[]) => void;
  setAmountsIn: (_value: string) => void;
  setTickLower: (_value: number) => void;
  setTickUpper: (_value: number) => void;
  setSlippage: (_val: number) => void;
  setTtl: (_val: number) => void;
  toggleSetting: (_highlightDegenMode?: boolean) => void;
  setShowSeting: (_val: boolean) => void;
  setDegenMode: (_val: boolean) => void;
  setManualSlippage: (_val: boolean) => void;
  setSnapshotState: (_val: ZapState | null) => void;
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
  slippage: 50,
  ttl: 20, // 20min
  showSetting: false,
  degenMode: false,
  tokenPrices: {},
  snapshotState: null,
  setTokensIn: (_value: Token[]) => {},
  setAmountsIn: (_value: string) => {},
  setTickLower: (_value: number) => {},
  setTickUpper: (_value: number) => {},
  setSlippage: (_val: number) => {},
  setTtl: (_val: number) => {},
  toggleSetting: (_highlightDegenMode?: boolean) => {},
  setShowSeting: (_val: boolean) => {},
  setDegenMode: (_val: boolean) => {},
  setManualSlippage: (_val: boolean) => {},
  setSnapshotState: (_val: ZapState | null) => {},
});

export const ZapContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    chainId,
    poolType,
    poolAddress,
    connectedAccount,
    wrappedNativeToken,
    positionId,
    initDepositTokens,
    initAmounts,
  } = useWidgetStore(
    useShallow(s => ({
      chainId: s.chainId,
      poolType: s.poolType,
      poolAddress: s.poolAddress,
      connectedAccount: s.connectedAccount,
      wrappedNativeToken: s.wrappedNativeToken,
      positionId: s.positionId,
      initDepositTokens: s.initDepositTokens,
      initAmounts: s.initAmounts,
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

  const account = connectedAccount?.address;
  const networkChainId = connectedAccount?.chainId;

  const [showSetting, setShowSeting] = useState(false);
  const [slippage, setSlippage] = useState(50);
  const [manualSlippage, setManualSlippage] = useState(false);
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

  const initializing = pool === 'loading' || !position;

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
    if (pool === 'loading' || manualSlippage) return;
    if (pool.category === 'stablePair' && isTokensStable) setSlippage(10);
    else if (pool.category === 'correlatedPair' && isTokensInPair) setSlippage(25);
    else {
      setSlippage(50);
    }
  }, [isTokensStable, pool, manualSlippage, isTokensInPair]);

  const { prices: tokenPrices } = useTokenPrices({
    addresses: tokensIn.map(token => token.address.toLowerCase()),
    chainId,
  });

  const priceLower = useMemo(() => {
    if (initializing || tickLower == null) return null;
    return formatNumber(+tickToPrice(tickLower, pool.token0.decimals, pool.token1.decimals, revertPrice));
  }, [pool, tickLower, revertPrice, initializing]);

  const priceUpper = useMemo(() => {
    if (initializing || tickUpper === null) return null;
    return formatNumber(+tickToPrice(tickUpper, pool.token0.decimals, pool.token1.decimals, revertPrice));
  }, [pool, tickUpper, revertPrice, initializing]);

  const error = useMemo(
    () =>
      validateData({
        account,
        chainId,
        networkChainId,
        zapApiError,
      }),
    [account, chainId, networkChainId, zapApiError],
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

  useEffect(() => {
    if (position) {
      const { success: isUniV3Position, data } = univ3Position.safeParse(position);

      if (isUniV3Position && data.tickUpper !== undefined && data.tickLower !== undefined) {
        setTickLower(data.tickLower);
        setTickUpper(data.tickUpper);
      }
    }
  }, [position]);

  // set tokens in
  useEffect(() => {
    if (tokensIn.length || !initDepositTokens || !initAmounts) return;

    const initTokensParsed = initDepositTokens.split(',');
    const initAmountsParsed = initAmounts.split(',').map(amount => toString(Number(amount)));

    if (initTokensParsed.length !== initAmountsParsed.length) return;

    const processTokensIn = async () => {
      const tokenPromises = initTokensParsed.map(async (tokenAddress: string) => {
        const tokenInfo = await fetchTokenInfo(tokenAddress.toLowerCase(), chainId);

        return tokenInfo?.[0];
      });

      const results = await Promise.all(tokenPromises);

      setTokensIn(results);
      setAmountsIn(initAmountsParsed.join(','));
    };

    processTokensIn();
  }, [chainId, initAmounts, initDepositTokens, tokensIn.length]);

  useEffect(() => {
    if (initializing || defaultRevertChecked) return;
    setDefaultRevertChecked(true);
    const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeToken?.address.toLowerCase();
    const isToken0Stable = pool.token0.isStable;
    const isToken1Stable = pool.token1.isStable;
    if ((isToken0Stable || (isToken0Native && !isToken1Stable)) && !revertPrice) toggleRevertPrice();
  }, [defaultRevertChecked, initializing, pool, revertPrice, toggleRevertPrice, wrappedNativeToken?.address]);

  useEffect(() => {
    if (initializing) return;

    const fetchRoute = async () => {
      setLoading(true);

      const params: { [key: string]: string | number | boolean } = {
        dex: poolType,
        'pool.id': poolAddress,
        'position.id': positionId,
        slippage,
      };

      let tmp = '';
      Object.keys(params).forEach(key => {
        tmp = `${tmp}&${key}=${params[key]}`;
      });

      fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/compound/route?${tmp.slice(1)}`, {
        headers: {
          'X-Client-Id': ZAP_SOURCE,
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
          setZapApiError(e.message || 'Something went wrong');
        })
        .finally(() => {
          setLoading(false);
        });
    };

    fetchRoute();
    fetchRouteInterval = setInterval(fetchRoute, 15_000);

    return () => {
      if (fetchRouteInterval) clearInterval(fetchRouteInterval);
    };
  }, [chainId, initializing, poolAddress, poolType, positionId, slippage]);

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
        tokenPrices,
        highlightDegenMode,
        setManualSlippage,
        snapshotState,
        setSnapshotState,
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
