import { NETWORKS_INFO } from '@kyber/schema';
import { ChainId, PoolType, algebraTypes, univ4Types } from '@kyber/schema';

import { getNftManagerContractAddress } from '.';
import { encodeUint256, getFunctionSelector } from '../crypto';
import { decodeAlgebraV1Position, decodePosition, decodeUniswapV4PositionInfo, getPositionAmounts } from '../uniswapv3';

export const getUniv2PositionInfo = async ({
  chainId,
  positionId,
  poolType,
  poolAddress,
  reserve0,
  reserve1,
}: {
  chainId: ChainId;
  positionId: string;
  poolType: PoolType;
  poolAddress: string;
  reserve0: string;
  reserve1: string;
}) => {
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
  ).then(res => res.json() as Promise<{ result: string }>);

  const totalSupplyRes = await fetch(NETWORKS_INFO[chainId].defaultRpc, getPayload(`0x${totalSupplySelector}`)).then(
    res => res.json() as Promise<{ result: string }>,
  );

  const userBalance = BigInt(balanceRes?.result || '0');
  const totalSupply = BigInt(totalSupplyRes?.result || '0');

  const position = {
    liquidity: userBalance.toString(),
    amount0: (userBalance * BigInt(reserve0)) / totalSupply,
    amount1: (userBalance * BigInt(reserve1)) / totalSupply,
    poolType,
    totalSupply,
  };
  if (userBalance > BigInt(0))
    return {
      error: null,
      position,
    };

  return {
    error: 'Position not found',
    position: null,
  };
};

export const getUniv3PositionInfo = async ({
  chainId,
  positionId,
  poolType,
  tickCurrent,
  sqrtPriceX96,
}: {
  chainId: ChainId;
  positionId: string;
  poolType: PoolType;
  tickCurrent: number;
  sqrtPriceX96: string;
}) => {
  const nftContractAddress = getNftManagerContractAddress(poolType, chainId);

  if (!nftContractAddress)
    return {
      error: `Pool type ${poolType} is not supported in chainId: ${chainId}`,
      position: null,
    };

  const isUniv4 = univ4Types.includes(poolType);

  // Function signature and encoded token ID
  const functionSignature = !isUniv4 ? 'positions(uint256)' : 'positionInfo(uint256)';
  const selector = getFunctionSelector(functionSignature);
  const encodedTokenId = encodeUint256(BigInt(positionId));

  const data = `0x${selector}${encodedTokenId}`;

  // JSON-RPC payload
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: nftContractAddress,
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

  const { result, error } = (await response.json()) as { result?: any; error?: any };

  if (result && result !== '0x') {
    const decodedPosition = isUniv4
      ? decodeUniswapV4PositionInfo(result)
      : algebraTypes.includes(poolType)
        ? decodeAlgebraV1Position(result)
        : decodePosition(result);

    if (isUniv4) {
      const liquidity = await getUniv4PositionLiquidity({
        nftContractAddress,
        encodedTokenId,
        chainId,
      });

      if (liquidity === null)
        return {
          error: 'Position not found',
          position: null,
        };

      decodedPosition.liquidity = liquidity;
    }

    const { amount0, amount1 } = getPositionAmounts(
      tickCurrent,
      decodedPosition.tickLower,
      decodedPosition.tickUpper,
      BigInt(sqrtPriceX96),
      decodedPosition.liquidity,
    );

    return {
      error: null,
      position: {
        id: +positionId,
        poolType,
        liquidity: decodedPosition.liquidity,
        tickLower: decodedPosition.tickLower,
        tickUpper: decodedPosition.tickUpper,
        amount0,
        amount1,
      },
    };
  }

  return {
    error: error?.message || 'Position not found',
    position: null,
  };
};

export const getUniv4PositionLiquidity = async ({
  nftContractAddress,
  encodedTokenId,
  chainId,
}: {
  nftContractAddress: string;
  encodedTokenId: string;
  chainId: ChainId;
}) => {
  const liquidityFunctionSignature = 'getPositionLiquidity(uint256)';
  const liquiditySelector = getFunctionSelector(liquidityFunctionSignature);
  const liquidityData = `0x${liquiditySelector}${encodedTokenId}`;

  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: nftContractAddress,
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

  const { result: liquidityResult } = (await response.json()) as { result: string };

  if (liquidityResult && liquidityResult !== '0x') return BigInt(liquidityResult);
  return null;
};
