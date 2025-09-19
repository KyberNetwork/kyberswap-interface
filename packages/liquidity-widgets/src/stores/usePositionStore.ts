import { create } from 'zustand';
import { useShallow } from 'zustand/shallow';

import { Pool, PoolType, Position, univ2PoolNormalize, univ3PoolNormalize } from '@kyber/schema';
import { getUniv2PositionInfo, getUniv3PositionInfo } from '@kyber/utils';

interface PositionState {
  positionError: string;
  position: 'loading' | Position | null;
  firstLoad: boolean;
  getPosition: (props: getPositionProps) => void;
  reset: () => void;
}

const initState: Omit<PositionState, 'getPosition' | 'reset'> = {
  position: 'loading',
  positionError: '',
  firstLoad: true,
};

interface getPositionProps {
  chainId: number;
  positionId: string | undefined;
  poolType: PoolType;
  connectedAccount: {
    address?: string | undefined;
    chainId: number;
  };
  pool: Pool;
  setPositionId: (positionId: string) => void;
}

const usePositionRawStore = create<PositionState>((set, get) => ({
  ...initState,
  reset: () => set(initState),
  getPosition: async ({ pool, positionId, chainId, poolType, connectedAccount, setPositionId }: getPositionProps) => {
    const { success: isUniV3, data: univ3PoolInfo } = univ3PoolNormalize.safeParse(pool);
    const { success: isUniV2, data: univ2PoolInfo } = univ2PoolNormalize.safeParse(pool);

    const { firstLoad } = get();

    if (isUniV3) {
      if (!positionId) set({ position: null });
      else {
        const positionInfo = await getUniv3PositionInfo({
          poolType,
          positionId,
          chainId,
          tickCurrent: univ3PoolInfo.tick,
          sqrtPriceX96: univ3PoolInfo.sqrtPriceX96,
        });

        if (positionInfo.error) set({ positionError: positionInfo.error, position: null });
        else set({ position: positionInfo.position as Position });
      }

      return;
    }

    if (isUniV2) {
      if (positionId || (firstLoad && connectedAccount.address)) {
        const posId = positionId || connectedAccount.address || '';
        const positionInfo = await getUniv2PositionInfo({
          poolType,
          positionId: posId,
          chainId,
          poolAddress: univ2PoolInfo.address,
          reserve0: univ2PoolInfo.reserves[0],
          reserve1: univ2PoolInfo.reserves[1],
        });

        if (positionInfo.error) {
          set({ positionError: positionInfo.error, position: null });
          return;
        }

        set({ position: positionInfo.position as Position });
        if (!positionId && connectedAccount.address) setPositionId(connectedAccount.address);
      }

      return;
    }

    set({ positionError: 'Invalid pool type' });
  },
}));

type PositionStoreKeys = keyof ReturnType<typeof usePositionRawStore.getState>;

export const usePositionStore = <K extends PositionStoreKeys>(keys: K[]) => {
  return usePositionRawStore(
    useShallow(s =>
      keys.reduce(
        (acc, key) => {
          acc[key] = s[key];
          return acc;
        },
        {} as Pick<typeof s, K>,
      ),
    ),
  );
};
