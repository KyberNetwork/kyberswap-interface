import { createContext, useContext, useEffect, useRef } from 'react';

import { createStore, useStore } from 'zustand';

import { fetchTokenPrice } from '@kyber/utils';
import { encodeUint256, getFunctionSelector } from '@kyber/utils/crypto';
import {
  MAX_TICK,
  MIN_TICK,
  decodeAlgebraV1Position,
  decodePosition,
  decodeUniswapV4PositionInfo,
  getPositionAmounts,
  nearestUsableTick,
} from '@kyber/utils/uniswapv3';

import { DEXES_INFO, NATIVE_TOKEN_ADDRESS, NETWORKS_INFO, PATHS } from '@/constants';
import {
  ChainId,
  Pool,
  PoolType,
  Position,
  Token,
  Univ2PoolType,
  Univ3PoolType,
  algebraTypes,
  poolResponse,
  univ2Pool,
  univ3Pool,
  univ4Types,
} from '@/schema';
import { useZapOutUserState } from '@/stores/state';
import { Theme } from '@/theme';

export interface ZapOutProps {
  theme?: Theme;
  poolAddress: string;
  poolType: PoolType;
  positionId: string;
  chainId: ChainId;

  connectedAccount: {
    address?: string | undefined; // check if account is connected
    chainId: number; // check if wrong network
  };

  // Widget Actions
  onClose: () => void;
  onConnectWallet: () => void;
  onSwitchChain: () => void;
  onSubmitTx: (txData: { from: string; to: string; value: string; data: string; gasLimit: string }) => Promise<string>;

  source: string; // for tracking volume
  referral?: string;
}

interface ZapOutState extends ZapOutProps {
  theme: Theme;
  pool: 'loading' | Pool;
  position: 'loading' | Position;
  errorMsg: string;

  getPool: () => void;
}

interface InnerZapOutProps extends ZapOutProps {
  theme: Theme;
}

type ZapOutProviderState = React.PropsWithChildren<InnerZapOutProps>;

const createZapOutStore = (initProps: InnerZapOutProps) => {
  return createStore<ZapOutState>()((set, get) => ({
    ...initProps,
    theme: initProps.theme,
    pool: 'loading' as 'loading' | Pool,
    position: 'loading' as 'loading' | Position,
    errorMsg: '',

    getPool: async () => {
      const { poolAddress, chainId, poolType, positionId } = get();

      const res = await fetch(`${PATHS.ZAP_EARN_API}/v1/pools?chainId=${chainId}&address=${poolAddress}`).then(res =>
        res.json(),
      );

      const { success, data, error } = poolResponse.safeParse({
        poolType,
        ...res,
      });

      const firstLoad = get().pool === 'loading';
      if (!success) {
        firstLoad && set({ errorMsg: `Can't get pool info ${error.toString()}` });
        console.error("Can't get pool info", error);
        return;
      }
      const pool = data.data;
      if (!pool) {
        firstLoad && set({ errorMsg: `Can't get pool info, address: ${pool}` });
        return;
      }

      const isUniV4 = univ4Types.includes(poolType);

      const staticExtra = 'staticExtra' in pool && pool.staticExtra ? JSON.parse(pool.staticExtra) : null;

      const isToken0Native = isUniV4 && staticExtra && staticExtra?.['0x0']?.[0];
      const isToken1Native = isUniV4 && staticExtra && staticExtra?.['0x0']?.[1];

      const token0Address = isToken0Native ? NATIVE_TOKEN_ADDRESS.toLowerCase() : pool.tokens[0].address;
      const token1Address = isToken1Native ? NATIVE_TOKEN_ADDRESS.toLowerCase() : pool.tokens[1].address;

      // check category pair
      const pairCheck = await fetch(
        `${PATHS.TOKEN_API}/v1/public/category/pair?chainId=${chainId}&tokenIn=${token0Address}&tokenOut=${token1Address}`,
      ).then(res => res.json());
      const cat = pairCheck?.data?.category || 'commonPair';

      const prices = await fetchTokenPrice({
        addresses: [token0Address.toLowerCase(), token1Address.toLowerCase()],
        chainId,
      });

      const token0Price = prices[token0Address.toLowerCase()]?.PriceBuy || 0;
      const token1Price = prices[token1Address.toLowerCase()]?.PriceBuy || 0;

      const tokens: {
        address: string;
        logoURI?: string;
        name: string;
        symbol: string;
        decimals: number;
      }[] = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${token0Address},${token1Address}`,
      )
        .then(res => res.json())
        .then(res => res?.data?.tokens || [])
        .catch(() => []);

      let token0 = tokens.find(tk => tk.address.toLowerCase() === token0Address.toLowerCase());
      let token1 = tokens.find(tk => tk.address.toLowerCase() === token1Address.toLowerCase());

      if (!token0 || !token1) {
        const tokensToImport = [];
        if (!token0)
          tokensToImport.push({
            chainId: chainId.toString(),
            address: token0Address,
          });
        if (!token1)
          tokensToImport.push({
            chainId: chainId.toString(),
            address: token1Address,
          });

        const res = await fetch(`https://ks-setting.kyberswap.com/api/v1/tokens/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tokens: tokensToImport }),
        }).then(res => res.json());

        if (!token0)
          token0 = res?.data?.tokens?.find(
            (item: { data: Token }) => item.data.address.toLowerCase() === token0Address.toLowerCase(),
          )?.data;
        if (!token1)
          token1 = res?.data?.tokens?.find(
            (item: { data: Token }) => item.data.address.toLowerCase() === token1Address.toLowerCase(),
          )?.data;

        if (!token0 || !token1) {
          set({ errorMsg: `Can't get token info` });
          return;
        }
      }

      const { success: isUniV3, data: poolUniv3 } = univ3Pool.safeParse(pool);
      const { success: isUniV2, data: poolUniv2 } = univ2Pool.safeParse(pool);

      let p: Pool;

      if (isUniV3) {
        const { success: isUniV3PoolType, data: pt } = Univ3PoolType.safeParse(poolType);
        if (!isUniV3PoolType) {
          throw new Error('Invalid pool univ3 type');
        }
        p = {
          category: cat,
          poolType: pt,
          address: poolUniv3.address,
          token0: {
            ...token0,
            logo: token0.logoURI,
            price: token0Price,
          },
          token1: {
            ...token1,
            logo: token1.logoURI,
            price: token1Price,
          },
          fee: pool.swapFee,
          liquidity: poolUniv3.positionInfo.liquidity,
          sqrtPriceX96: poolUniv3.positionInfo.sqrtPriceX96,
          tick: poolUniv3.positionInfo.tick,
          tickSpacing: poolUniv3.positionInfo.tickSpacing,
          ticks: poolUniv3.positionInfo.ticks || [],
          minTick: nearestUsableTick(MIN_TICK, poolUniv3.positionInfo.tickSpacing),
          maxTick: nearestUsableTick(MAX_TICK, poolUniv3.positionInfo.tickSpacing),
        };
        set({ pool: p });

        const contract = DEXES_INFO[poolType].nftManagerContract;
        const contractAddress = typeof contract === 'string' ? contract : contract[chainId];
        if (!contractAddress) {
          set({
            errorMsg: `Pool type ${poolType} is not supported in chainId: ${chainId}`,
          });
          return;
        }
        // Function signature and encoded token ID
        const functionSignature = !isUniV4 ? 'positions(uint256)' : 'positionInfo(uint256)';
        const selector = getFunctionSelector(functionSignature);
        const encodedTokenId = encodeUint256(BigInt(positionId));

        const data = `0x${selector}${encodedTokenId}`;

        // JSON-RPC payload
        const payload = {
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: contractAddress,
              data: data,
            },
            'latest',
          ],
          id: 1,
        };

        // Send JSON-RPC request via fetch
        const response = await fetch(NETWORKS_INFO[chainId].defaultRpc, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const { result, error } = await response.json();

        if (result && result !== '0x') {
          const data = isUniV4
            ? decodeUniswapV4PositionInfo(result)
            : algebraTypes.includes(pt)
              ? decodeAlgebraV1Position(result)
              : decodePosition(result);

          if (isUniV4) {
            const liquidityFunctionSignature = 'getPositionLiquidity(uint256)';
            const liquiditySelector = getFunctionSelector(liquidityFunctionSignature);
            const liquidityData = `0x${liquiditySelector}${encodedTokenId}`;

            const payload = {
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [
                {
                  to: contractAddress,
                  data: liquidityData,
                },
                'latest',
              ],
              id: 1,
            };

            const response = await fetch(NETWORKS_INFO[chainId].defaultRpc, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const { result: liquidityResult, error: liquidityError } = await response.json();

            if (liquidityResult && liquidityResult !== '0x') {
              data.liquidity = BigInt(liquidityResult);
            } else {
              set({
                errorMsg: liquidityError.message || 'Position not found',
              });
            }
          }

          const { amount0, amount1 } = getPositionAmounts(
            p.tick,
            data.tickLower,
            data.tickUpper,
            BigInt(p.sqrtPriceX96),
            data.liquidity,
          );

          set({
            position: {
              id: +positionId,
              poolType: pt,
              liquidity: data.liquidity,
              tickLower: data.tickLower,
              tickUpper: data.tickUpper,
              amount0,
              amount1,
            },
          });
          return;
        }

        set({ errorMsg: error.message || 'Position not found' });
      } else if (isUniV2) {
        const { success: isUniV2PoolType, data: pt } = Univ2PoolType.safeParse(poolType);
        if (!isUniV2PoolType) {
          throw new Error('Invalid pool univ2 type');
        }
        p = {
          category: cat,
          poolType: pt,
          token0: {
            ...token0,
            logo: token0.logoURI,
            price: token0Price,
          },
          token1: {
            ...token1,
            logo: token1.logoURI,
            price: token1Price,
          },
          fee: pool.swapFee,
          reserves: poolUniv2.reserves,
        };

        set({ pool: p });

        // get pool total supply and user supply
        const balanceOfSelector = getFunctionSelector('balanceOf(address)');
        const totalSupplySelector = getFunctionSelector('totalSupply()');
        const paddedAccount = positionId.replace('0x', '').padStart(64, '0');

        const getPayload = (d: string) => {
          return {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_call',
              params: [
                {
                  to: poolAddress,
                  data: d,
                },
                'latest',
              ],
              id: 1,
            }),
          };
        };

        const balanceRes = await fetch(
          NETWORKS_INFO[chainId].defaultRpc,
          getPayload(`0x${balanceOfSelector}${paddedAccount}`),
        ).then(res => res.json());
        const totalSupplyRes = await fetch(
          NETWORKS_INFO[chainId].defaultRpc,
          getPayload(`0x${totalSupplySelector}`),
        ).then(res => res.json());

        const userBalance = BigInt(balanceRes?.result || '0');
        const totalSupply = BigInt(totalSupplyRes?.result || '0');

        const pos = {
          liquidity: userBalance.toString(),
          amount0: (userBalance * BigInt(poolUniv2.reserves[0])) / totalSupply,
          amount1: (userBalance * BigInt(poolUniv2.reserves[1])) / totalSupply,
          poolType: pt,
          totalSupply,
        };
        set({ position: pos });
      } else {
        throw new Error('Invalid pool type');
      }
    },
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
    const i = setInterval(() => {
      store.getState().getPool();
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
