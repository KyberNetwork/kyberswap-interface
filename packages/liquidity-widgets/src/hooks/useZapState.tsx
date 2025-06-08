import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useDebounce, useTokenBalances, useTokenPrices } from '@kyber/hooks';
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  Token,
  ZERO_ADDRESS,
  univ3Position,
  univ3Types,
  univ4Types,
} from '@kyber/schema';
import { parseUnits } from '@kyber/utils/crypto';
import { tickToPrice } from '@kyber/utils/uniswapv3';

import { ERROR_MESSAGE } from '@/constants';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useTokenStore } from '@/stores/useTokenStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapRouteDetail } from '@/types/zapRoute';
import { formatNumber, formatWei, parseTokensAndAmounts, validateData } from '@/utils';

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
  balanceTokens: {
    [key: string]: bigint;
  };
  tokenPrices: { [key: string]: number };
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
  balanceTokens: {},
  tokenPrices: {},
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
    })),
  );
  const { positionId, position } = usePositionStore(
    useShallow(s => ({
      positionId: s.positionId,
      position: s.position,
    })),
  );
  const { pool, revertPrice, setRevertPrice } = usePoolStore(
    useShallow(s => ({ pool: s.pool, revertPrice: s.revertPrice, setRevertPrice: s.setRevertPrice })),
  );
  const { tokens, importedTokens } = useTokenStore(
    useShallow(s => ({
      tokens: s.tokens,
      importedTokens: s.importedTokens,
    })),
  );

  const allTokens = useMemo(() => [...tokens, ...importedTokens], [tokens, importedTokens]);
  const excludedSources = aggregatorOptions?.excludedSources?.join(',');
  const includedSources = aggregatorOptions?.includedSources?.join(',');
  const account = connectedAccount?.address;
  const networkChainId = connectedAccount?.chainId;
  const { feePcm, feeAddress } = feeConfig || {};

  const { balances } = useTokenBalances(
    chainId,
    allTokens.map(item => item.address),
    account,
  );

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

  const debounceTickLower = useDebounce(tickLower, 300);
  const debounceTickUpper = useDebounce(tickUpper, 300);
  const debounceAmountsIn = useDebounce(amountsIn, 300);

  const initializing = pool === 'loading';

  const isUniV3 = !initializing && univ3Types.includes(poolType as any);
  const isUniV4 = univ4Types.includes(poolType);

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
    addresses: tokensIn.map(token =>
      token.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase() || isUniV4
        ? token.address.toLowerCase()
        : NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase(),
    ),
    chainId,
  });

  const nativeToken = useMemo(
    () => ({
      address: NATIVE_TOKEN_ADDRESS,
      decimals: NETWORKS_INFO[chainId].wrappedToken?.decimals,
      symbol: NETWORKS_INFO[chainId].wrappedToken.symbol.slice(1) || '',
      logo: NETWORKS_INFO[chainId].nativeLogo,
    }),
    [chainId],
  );
  const wrappedNativeToken = NETWORKS_INFO[chainId].wrappedToken;

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

  useEffect(() => {
    if (position) {
      const { success: isUniV3Position, data } = univ3Position.safeParse(position);

      if (isUniV3Position && data.tickUpper !== undefined && data.tickLower !== undefined) {
        setTickLower(data.tickLower);
        setTickUpper(data.tickUpper);
      }
    }
  }, [position]);

  // set default tokens in
  useEffect(() => {
    if (!pool || initializing || tokensIn.length) return;

    // with params
    if (initDepositTokens && allTokens.length) {
      const listInitTokens = initDepositTokens
        .split(',')
        .map((address: string) => allTokens.find(token => token.address.toLowerCase() === address.toLowerCase()))
        .filter(item => !!item);
      const listInitAmounts = initAmounts?.split(',') || [];
      const parseListAmountsIn: string[] = [];

      if (listInitTokens.length) {
        listInitTokens.forEach((_, index: number) => {
          parseListAmountsIn.push(listInitAmounts[index] || '');
        });
        setTokensIn(listInitTokens as Token[]);
        setAmountsIn(parseListAmountsIn.join(','));
        return;
      }
    }

    // without wallet connect
    if (!account) {
      setTokensIn([nativeToken] as Token[]);
    }

    // with balance
    const isToken0Native = pool?.token0.address.toLowerCase() === wrappedNativeToken.address.toLowerCase();
    const isToken1Native = pool?.token1.address.toLowerCase() === wrappedNativeToken.address.toLowerCase();

    const token0Address = isToken0Native ? NATIVE_TOKEN_ADDRESS : pool.token0.address.toLowerCase();
    const token1Address = isToken1Native ? NATIVE_TOKEN_ADDRESS : pool.token1.address.toLowerCase();

    if (!initDepositTokens && token0Address in balances && token1Address in balances) {
      const tokensToSet = [];

      const token0 = isToken0Native ? nativeToken : pool.token0;
      const token1 = isToken1Native ? nativeToken : pool.token1;

      const token0Balance = formatWei(
        balances[isToken0Native ? NATIVE_TOKEN_ADDRESS : pool.token0.address.toLowerCase()]?.toString() || '0',
        token0?.decimals,
      );
      const token1Balance = formatWei(
        balances[isToken1Native ? NATIVE_TOKEN_ADDRESS : pool.token1.address.toLowerCase()]?.toString() || '0',
        token1?.decimals,
      );
      if (parseFloat(token0Balance) > 0) tokensToSet.push(token0);
      if (parseFloat(token1Balance) > 0) tokensToSet.push(token1);
      if (!tokensToSet.length) tokensToSet.push(nativeToken);

      setTokensIn(tokensToSet as Token[]);
    }
  }, [
    pool,
    tokensIn,
    nativeToken,
    chainId,
    balances,
    initDepositTokens,
    allTokens,
    initAmounts,
    account,
    wrappedNativeToken.address,
    initializing,
  ]);

  useEffect(() => {
    if (initializing || defaultRevertChecked) return;
    setDefaultRevertChecked(true);
    const isToken0Native = pool.token0.address.toLowerCase() === wrappedNativeToken.address.toLowerCase();
    const isToken0Stable = pool.token0.isStable;
    const isToken1Stable = pool.token1.isStable;
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevertPrice(true);
  }, [defaultRevertChecked, initializing, pool, setRevertPrice, wrappedNativeToken.address]);

  useEffect(() => {
    if (
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
        balanceTokens: balances,
        tokenPrices,
        highlightDegenMode,
        setManualSlippage,
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
