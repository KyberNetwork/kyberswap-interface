import { Position as PancakePosition, Position } from "@pancakeswap/v3-sdk";
import { Address } from "viem";
import { useEffect, useState } from "react";

import { Pancakev3PoolABI } from "../../abis/pancakev3_pool";
import { Pancakev3PosManagerABI } from "../../abis/pancakev3_pos_manager";
import { useWeb3Provider } from "../useProvider";
import { PANCAKE_NFT_MANAGER_CONTRACT, NetworkInfo } from "../../constants";
import { PancakeToken, PancakeV3Pool } from "../../entities/Pool";

interface TokenInfo {
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  address: string;
  logoURI: string;
}

export default function usePoolInfo(
  poolAddress: string,
  positionId: string | undefined
): {
  pool: PancakeV3Pool | null;
  loading: boolean;
  position: Position | null;
  positionOwner: Address | null;
  error: string;
} {
  const [loading, setLoading] = useState(true);
  const [pool, setPool] = useState<PancakeV3Pool | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [positionOwner, setPositionOwner] = useState<Address | null>(null);

  const { chainId, publicClient } = useWeb3Provider();
  const posManagerContractAddress = PANCAKE_NFT_MANAGER_CONTRACT[chainId];

  const [error, setError] = useState("");

  useEffect(() => {
    const getPoolInfo = async () => {
      if (!publicClient || !!pool) return;
      const multiCallRes = await publicClient.multicall({
        contracts: [
          {
            address: poolAddress as Address,
            abi: Pancakev3PoolABI,
            functionName: "token0",
          },
          {
            address: poolAddress as Address,
            abi: Pancakev3PoolABI,
            functionName: "token1",
          },
          {
            address: poolAddress as Address,
            abi: Pancakev3PoolABI,
            functionName: "fee",
          },
          {
            address: poolAddress as Address,
            abi: Pancakev3PoolABI,
            functionName: "slot0",
          },
          {
            address: poolAddress as Address,
            abi: Pancakev3PoolABI,
            functionName: "liquidity",
          },
        ],
      });

      const [address0, address1, fee, slot0, liquidity] = [
        multiCallRes[0].result,
        multiCallRes[1].result,
        multiCallRes[2].result,
        multiCallRes[3].result || [],
        multiCallRes[4].result,
      ];
      const [sqrtPriceX96, tick] = slot0;

      if (!address0 || !address1 || !fee || !liquidity) {
        setError(
          `Can't get Pool info for pool address ${poolAddress.substring(
            0,
            6
          )}...${poolAddress.substring(36)} on ${NetworkInfo[chainId].name}`
        );
        return;
      }

      const tokens = await fetch(
        `https://ks-setting.kyberswap.com/api/v1/tokens?chainIds=${chainId}&addresses=${address0},${address1}`
      )
        .then((res) => res.json())
        .then((res) => res?.data?.tokens || []);

      let token0Info = tokens.find(
        (tk: TokenInfo) => tk.address.toLowerCase() === address0.toLowerCase()
      );
      let token1Info = tokens.find(
        (tk: TokenInfo) => tk.address.toLowerCase() === address1.toLowerCase()
      );

      const addressToImport = [
        ...(!token0Info ? [address0] : []),
        ...(!token1Info ? [address1] : []),
      ];

      if (addressToImport.length) {
        const tokens = await fetch(
          "https://ks-setting.kyberswap.com/api/v1/tokens/import",
          {
            method: "POST",
            body: JSON.stringify({
              tokens: addressToImport.map((item) => ({
                chainId: chainId.toString(),
                address: item,
              })),
            }),
          }
        )
          .then((res) => res.json())
          .then(
            (res) =>
              res?.data?.tokens.map((item: { data: TokenInfo }) => ({
                ...item.data,
                chainId: +item.data.chainId,
              })) || []
          );

        if (!token0Info)
          token0Info = tokens.find(
            (item: PancakeToken) =>
              item.address.toLowerCase() === address0.toLowerCase()
          );
        if (!token1Info)
          token1Info = tokens.find(
            (item: PancakeToken) =>
              item.address.toLowerCase() === address1.toLowerCase()
          );
      }
      if (token0Info && token1Info && fee) {
        const initToken = (t: TokenInfo) =>
          new PancakeToken(
            t.chainId,
            t.address,
            t.decimals,
            t.symbol,
            t.name,
            t.logoURI || `https://ui-avatars.com/api/?name=?`
          );

        const token0 = initToken(token0Info);
        const token1 = initToken(token1Info);

        const pool = new PancakeV3Pool(
          token0,
          token1,
          fee,
          sqrtPriceX96,
          liquidity,
          tick
        );
        setPool(pool);

        if (positionId && publicClient) {
          const multiCallRes = await publicClient.multicall({
            contracts: [
              {
                address: posManagerContractAddress,
                abi: Pancakev3PosManagerABI,
                functionName: "ownerOf",
                args: [BigInt(positionId)],
              },
              {
                address: posManagerContractAddress,
                abi: Pancakev3PosManagerABI,
                functionName: "positions",
                args: [BigInt(positionId)],
              },
            ],
          });

          if (multiCallRes.some((item) => item.status === "failure")) {
            return;
          }

          const [ownerResult, positionResult] = multiCallRes;
          const owner = ownerResult.result!;
          const [
            ,
            ,
            // _nonce,
            // operator,
            token0,
            token1,
            fee,
            tickLower,
            tickUpper,
            liquidity,
            // _feeGrowthInside0LastX128,
            // _feeGrowthInside1LastX128,
            // _tokensOwed0,
            // _tokensOwed1,
          ] = positionResult.result!;

          if (
            token0.toLowerCase() !== pool.token0.address.toLowerCase() ||
            token1.toLowerCase() !== pool.token1.address.toLowerCase() ||
            fee !== pool.fee
          ) {
            setError(
              `Position ${positionId} does not belong to the pool ${pool.token0.symbol}-${pool.token1.symbol}`
            );
            return;
          }
          const position = new PancakePosition({
            pool,
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidity: liquidity.toString(),
          });
          setPosition(position);
          setPositionOwner(owner);
        }
      }
      setLoading(false);
    };
    getPoolInfo();
  }, [
    chainId,
    pool,
    poolAddress,
    posManagerContractAddress,
    positionId,
    publicClient,
  ]);

  useEffect(() => {
    let i: number | undefined;
    if (!!pool && publicClient) {
      const getSlot0 = async () => {
        const multiCallRes = await publicClient.multicall({
          contracts: [
            {
              address: poolAddress as Address,
              abi: Pancakev3PoolABI,
              functionName: "slot0",
            },
            {
              address: poolAddress as Address,
              abi: Pancakev3PoolABI,
              functionName: "liquidity",
            },
          ],
        });

        const [slot0, liquidity] = [
          multiCallRes[0].result || [],
          multiCallRes[1].result,
        ];
        const [sqrtPriceX96, tick] = slot0;

        if (
          liquidity === undefined ||
          sqrtPriceX96 === undefined ||
          tick === undefined
        ) {
          return;
        }

        setPool(
          new PancakeV3Pool(
            pool.token0,
            pool.token1,
            pool.fee,
            sqrtPriceX96,
            liquidity,
            tick
          )
        );
      };

      i = setInterval(() => {
        getSlot0();
      }, 15_000);
    }

    return () => {
      i && clearInterval(i);
    };
  }, [pool, poolAddress, publicClient]);

  return { loading, pool, position, error, positionOwner };
}
