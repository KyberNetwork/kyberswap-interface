import { ChainId, NETWORKS_INFO, PoolType } from '@kyber/schema';

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
    const isUniV4 = poolType === PoolType.DEX_UNISWAP_V4 || poolType === PoolType.DEX_UNISWAP_V4_FAIRFLOW;

    if (isUniV4) {
      // For UniV4, look for Transfer events with 4 topics
      const transferLogsWithTokenId = receipt.logs.filter((log: any) => log.topics.length === 4);
      if (transferLogsWithTokenId.length > 0) {
        const hexTokenId = transferLogsWithTokenId[transferLogsWithTokenId.length - 1].topics[3];
        return hexTokenId ? BigInt(hexTokenId).toString() : null;
      }
    } else {
      // For other DEXes, look for IncreaseLiquidity events
      // IncreaseLiquidity event has tokenId as first topic (index 1)
      const increaseLidLogs = receipt.logs.filter((log: any) => log.topics.length >= 2);
      if (increaseLidLogs.length > 0) {
        const hexTokenId = increaseLidLogs[0]?.topics?.[1];
        return hexTokenId ? BigInt(hexTokenId).toString() : null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting tokenId from txHash:', error);
    return null;
  }
};
