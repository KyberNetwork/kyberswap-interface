import { useEffect, useState } from 'react';

import { ChainId, DEXES_INFO, NETWORKS_INFO, PoolType } from '@kyber/schema';
import { decodeAddress, getFunctionSelector } from '@kyber/utils/crypto';

const usePositionOwner = ({
  positionId,
  chainId,
  poolType,
}: {
  positionId?: string;
  chainId: ChainId;
  poolType: PoolType;
}) => {
  const [positionOwner, setPositionOwner] = useState<string | null>(null);

  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

  const contract = DEXES_INFO[poolType].nftManagerContract;
  const nftManagerContract = typeof contract === 'string' ? contract : contract[chainId];

  useEffect(() => {
    if (!positionId || !nftManagerContract) return;

    const methodSignature = getFunctionSelector('ownerOf(uint256)');
    const encodedTokenId = (+positionId).toString(16).padStart(64, '0');
    const data = '0x' + methodSignature + encodedTokenId;

    fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: nftManagerContract,
            data,
          },
          'latest',
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.result) setPositionOwner(decodeAddress(res.result.slice(2))?.toLowerCase());
      });
  }, [positionId, nftManagerContract, rpcUrl]);

  return positionOwner;
};

export default usePositionOwner;
