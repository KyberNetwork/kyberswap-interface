import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useShallow } from 'zustand/shallow';

import { useTokenBalances, useTokenPrices } from '@kyber/hooks';
import { API_URLS, CHAIN_ID_TO_CHAIN, Token, ZERO_ADDRESS, ZapRouteDetail, univ3Types } from '@kyber/schema';
import { parseUnits } from '@kyber/utils/crypto';

import { ERROR_MESSAGE } from '@/constants';
import useInitialTokensIn from '@/hooks/useInitialTokensIn';
import useSlippageManager from '@/hooks/useSlippageManager';
import useTickPrice from '@/hooks/useTickPrice';
import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { ZapState } from '@/types/index';
import { parseTokensAndAmounts, validateData } from '@/utils';

interface UiState {
  showSetting: boolean;
  slippageOpen: boolean;
  highlightDegenMode: boolean;
  degenMode: boolean;
}

const defaultUiState = {
  showSetting: false,
  slippageOpen: false,
  highlightDegenMode: false,
  degenMode: false,
};

const defaultZapState = {
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
  tokenBalances: {},
  tokenPrices: {},
  snapshotState: null,
  uiState: defaultUiState,
  setTokensIn: (_value: Token[]) => {},
  setAmountsIn: (_value: string) => {},
  setTickLower: (_value: number) => {},
  setTickUpper: (_value: number) => {},
  setSlippage: (_val: number) => {},
  setTtl: (_val: number) => {},
  toggleSetting: (_highlightDegenMode?: boolean) => {},
  setSnapshotState: (_val: ZapState | null) => {},
  setUiState: (_val: UiState | ((_prev: UiState) => UiState)) => {},
};

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
  tokenBalances: {
    [key: string]: bigint;
  };
  tokenPrices: { [key: string]: number };
  snapshotState: ZapState | null;
  uiState: UiState;
  setTokensIn: (_value: Token[]) => void;
  setAmountsIn: (_value: string) => void;
  setTickLower: (_value: number) => void;
  setTickUpper: (_value: number) => void;
  setSlippage: (_val: number) => void;
  setTtl: (_val: number) => void;
  toggleSetting: (_highlightDegenMode?: boolean) => void;
  setSnapshotState: (_val: ZapState | null) => void;
  setUiState: (_val: UiState | ((_prev: UiState) => UiState)) => void;
}>(defaultZapState);

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

  const [uiState, setUiState] = useState(defaultUiState);
  const [ttl, setTtl] = useState(20);
  const [zapInfo, setZapInfo] = useState<ZapRouteDetail | null>(null);
  const [zapApiError, setZapApiError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false);
  const [snapshotState, setSnapshotState] = useState<ZapState | null>(null);

  const initializing = pool === 'loading';
  const isUniV3 = !initializing && univ3Types.includes(poolType as any);
  const { token0, token1 } = initializing ? { token0: undefined, token1: undefined } : pool;

  const { tokensIn, amountsIn, setTokensIn, setAmountsIn, debounceAmountsIn } = useInitialTokensIn({
    pool,
    chainId,
    initDepositTokens,
    initAmounts,
    account,
    nativeToken,
  });

  const { balances } = useTokenBalances(
    chainId,
    tokensIn.map(item => item.address),
    account,
  );

  const {
    tickLower,
    tickUpper,
    setTickLower,
    setTickUpper,
    debounceTickLower,
    debounceTickUpper,
    priceLower,
    priceUpper,
  } = useTickPrice({
    token0,
    token1,
    revertPrice,
    position,
    initialTick,
  });
  const { slippage, setSlippage } = useSlippageManager({ pool, tokensIn, chainId });
  const { prices: tokenPrices } = useTokenPrices({
    addresses: tokensIn.map(token => token.address.toLowerCase()),
    chainId,
  });

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

  const toggleSetting = useCallback((highlight?: boolean) => {
    setUiState(prev => ({ ...prev, showSetting: !prev.showSetting }));
    if (highlight) {
      setUiState(prev => ({ ...prev, highlightDegenMode: true }));
      setTimeout(() => {
        setUiState(prev => ({ ...prev, highlightDegenMode: false }));
      }, 4000);
    }
  }, []);

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
          const errorMessage = e instanceof Error ? e.message : 'Something went wrong';
          setZapApiError(errorMessage);
          console.error('Zap API error:', e);
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
        uiState,
        setUiState,
        tokenBalances: balances,
        tokenPrices,
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
