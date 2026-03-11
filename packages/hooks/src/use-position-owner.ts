import { useEffect, useState } from 'react';

import { ethCall } from '@kyber/rpc-client/fetch';
import { ChainId, DEXES_INFO, PoolType } from '@kyber/schema';
import { decodeAddress, getFunctionSelector } from '@kyber/utils/crypto';

export const usePositionOwner = ({
  positionId,
  chainId,
  poolType,
}: {
  positionId?: string;
  chainId: ChainId;
  poolType?: PoolType;
}) => {
  const [positionOwner, setPositionOwner] = useState<string | null>(null);

  const contract = poolType ? DEXES_INFO[poolType].nftManagerContract : undefined;
  const nftManagerContract = !contract ? undefined : typeof contract === 'string' ? contract : contract[chainId];

  useEffect(() => {
    if (!positionId || !nftManagerContract) return;

    const methodSignature = getFunctionSelector('ownerOf(uint256)');
    const encodedTokenId = (+positionId).toString(16).padStart(64, '0');
    const data = '0x' + methodSignature + encodedTokenId;

    ethCall(chainId, nftManagerContract, data)
      .then(result => {
        if (result) setPositionOwner(decodeAddress(result.slice(2))?.toLowerCase());
      })
      .catch(console.error);
  }, [positionId, nftManagerContract, chainId]);

  return positionOwner;
};
