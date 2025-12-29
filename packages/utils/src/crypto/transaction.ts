import { ChainId, NETWORKS_INFO, PoolType, univ4Types } from '@kyber/schema';

import { estimateGas, formatUnits, getCurrentGasPrice } from '.';
import { friendlyError } from '../error';
import { fetchTokenPrice } from '../services';

export const estimateGasForTx = async ({
  rpcUrl,
  txData,
  chainId,
}: {
  rpcUrl: string;
  txData: {
    from: string;
    to: string;
    value: string;
    data: string;
  };
  chainId: ChainId;
}) => {
  try {
    const wethAddress = NETWORKS_INFO[chainId].wrappedToken.address.toLowerCase();
    const [gasEstimation, nativeTokenPrice, gasPrice] = await Promise.all([
      estimateGas(rpcUrl, txData),
      fetchTokenPrice({ addresses: [wethAddress], chainId })
        .then((prices: { [x: string]: { PriceBuy: number } }) => {
          return prices[wethAddress]?.PriceBuy || 0;
        })
        .catch(() => 0),
      getCurrentGasPrice(rpcUrl),
    ]);

    const gasUsd = +formatUnits(gasPrice.toString(), 18) * +gasEstimation.toString() * nativeTokenPrice;

    return {
      gasUsd,
      error: undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.log('Estimate gas failed', message);

    return {
      gasUsd: undefined,
      error: friendlyError(message),
    };
  }
};

/**
 * Get tokenId from transaction hash by parsing transaction receipt logs
 * @param rpcUrl - RPC URL to fetch transaction receipt
 * @param txHash - Transaction hash
 * @param poolType - Pool type to determine which event to parse
 * @returns tokenId as string or null if not found
 */
export const getTokenIdFromTxHash = async ({
  rpcUrl,
  txHash,
  poolType,
}: {
  rpcUrl: string;
  txHash: string;
  poolType: PoolType;
}): Promise<string | null> => {
  try {
    // Get transaction receipt via RPC
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1,
      }),
    });
    const data = (await response.json()) as { result?: { logs?: any[] } };
    const receipt = data.result;
    if (!receipt || !receipt.logs) return null;

    // Check if it's UniV4 (FairFlow) - use Transfer event
    const isUniV4 = univ4Types.includes(poolType);

    // Event signatures
    // ModifyLiquidity (index_topic_1 bytes32 id, index_topic_2 address sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)
    const MODIFY_LIQUIDITY_TOPIC = '0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec';
    // IncreaseLiquidity(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)
    const INCREASE_LIQUIDITY_TOPIC = '0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f';

    if (isUniV4) {
      // For UniV4, look for ModifyLiquidity events
      // tokenId is encoded in the 4th data field (salt) - bytes32 at offset 96 (3 * 32 bytes)
      const modifyLiquidityLog = receipt.logs.find(
        (log: any) => log.topics[0]?.toLowerCase() === MODIFY_LIQUIDITY_TOPIC.toLowerCase(),
      );
      if (modifyLiquidityLog && modifyLiquidityLog.data) {
        // data format: tickLower (32 bytes) + tickUpper (32 bytes) + liquidityDelta (32 bytes) + salt (32 bytes)
        // salt is at position 4, so we need to extract bytes 96-128 (0x prefix + 192 chars offset, 64 chars length)
        const dataWithoutPrefix = modifyLiquidityLog.data.slice(2); // remove 0x
        const saltHex = '0x' + dataWithoutPrefix.slice(192, 256); // bytes 96-128 (4th 32-byte slot)
        return saltHex ? BigInt(saltHex).toString() : null;
      }
    } else {
      // For UniV3 and other DEXes, look for IncreaseLiquidity events
      // tokenId is the second topic (topics[1])
      const increaseLiquidityLog = receipt.logs.find(
        (log: any) => log.topics[0]?.toLowerCase() === INCREASE_LIQUIDITY_TOPIC.toLowerCase(),
      );
      if (increaseLiquidityLog) {
        const hexTokenId = increaseLiquidityLog.topics[1];
        return hexTokenId ? BigInt(hexTokenId).toString() : null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting tokenId from txHash:', error);
    return null;
  }
};
