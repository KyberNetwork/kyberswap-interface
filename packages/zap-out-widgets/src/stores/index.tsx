import { createContext, useContext, useEffect, useRef } from 'react';

import { createStore, useStore } from 'zustand';

import { PoolType, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema';
import { ChainId, Pool, Position, Theme } from '@kyber/schema';
import { getPoolInfo, getPoolPrice, getUniv2PositionInfo, getUniv3PositionInfo } from '@kyber/utils';

import { useZapOutUserState } from '@/stores/state';

export interface ZapOutProps {
  theme?: Theme;
  poolAddress: string;
  poolType: PoolType;
  positionId: string;
  chainId: ChainId;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;
  source: string;
  referral?: string;
}

interface ZapOutState extends ZapOutProps {
  theme: Theme;
  pool: Pool | null;
  poolPrice: number | null;
  revertPrice: boolean;
  position: Position | null;
  errorMsg: string;
  widgetError: string;
  getPool: () => void;
  getPosition: (pool: Pool) => void;
  toggleRevertPrice: () => void;
  setWidgetError: (error: string) => void;
}

interface InnerZapOutProps extends ZapOutProps {
  theme: Theme;
}

type ZapOutProviderState = React.PropsWithChildren<InnerZapOutProps>;

const createZapOutStore = (initProps: InnerZapOutProps) => {
  return createStore<ZapOutState>()((set, get) => ({
    ...initProps,
    theme: initProps.theme,
    pool: null,
    poolPrice: null,
    revertPrice: false,
    position: null,
    errorMsg: '',
    widgetError: '',
    getPool: async () => {
      const { poolAddress, chainId, poolType, getPosition } = get();

      const poolInfo = await getPoolInfo({ poolAddress, chainId, poolType });

      if (poolInfo.error || !poolInfo.pool) {
        set({ errorMsg: poolInfo.error });
        return;
      }
      set({ pool: poolInfo.pool as Pool });

      const revertPrice = get().revertPrice;
      const price = getPoolPrice({ pool: poolInfo.pool as Pool, revertPrice });
      if (price !== null) set({ poolPrice: price });

      const { buildData } = useZapOutUserState.getState();

      if (buildData) return;
      getPosition(poolInfo.pool as Pool);
    },
    getPosition: async (pool: Pool) => {
      const { positionId, poolType, chainId } = get();
      if (!positionId || !pool) return;

      const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
      const { success: isUniV2, data: univ2PoolInfo } = univ2PoolNormalize.safeParse(pool);

      if (isUniV3) {
        const positionInfo = await getUniv3PositionInfo({
          poolType,
          positionId,
          chainId,
          tickCurrent: univ3PoolInfo.tick,
          sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
        });

        if (positionInfo.error) set({ errorMsg: positionInfo.error, position: null });
        else {
          set({ position: positionInfo.position as Position });
        }

        return;
      }

      if (isUniV2) {
        const positionInfo = await getUniv2PositionInfo({
          poolType,
          positionId,
          chainId,
          poolAddress: univ2PoolInfo.address,
          reserve0: univ2PoolInfo.reserves[0],
          reserve1: univ2PoolInfo.reserves[1],
        });

        if (positionInfo.error) set({ errorMsg: positionInfo.error, position: null });
        else set({ position: positionInfo.position as Position });

        return;
      }

      set({ errorMsg: 'Invalid pool type' });
    },
    toggleRevertPrice: () => set(state => ({ revertPrice: !state.revertPrice })),
    setWidgetError: (error: string) => set({ widgetError: error }),
  }));
};

type ZapOutStore = ReturnType<typeof createZapOutStore>;

const ZapOutContext = createContext<ZapOutStore | null>(null);

export function ZapOutProvider({ children, ...props }: ZapOutProviderState) {
  const store = useRef(createZapOutStore(props)).current;

  // Update store when props change
  useEffect(() => {
    store.setState({
      ...props,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const { resetState } = useZapOutUserState();

  useEffect(() => {
    resetState();
    // get Pool and position then update store here
    store.getState().getPool();
    // store.getState().getPosition();
    const i = setInterval(() => {
      store.getState().getPool();
      // store.getState().getPosition();
    }, 15_000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ZapOutContext.Provider value={store}>{children}</ZapOutContext.Provider>;
}

export function useZapOutContext<T>(selector: (state: ZapOutState) => T): T {
  const store = useContext(ZapOutContext);
  if (!store) throw new Error('Missing BearContext.Provider in the tree');
  return useStore(store, selector);
}
