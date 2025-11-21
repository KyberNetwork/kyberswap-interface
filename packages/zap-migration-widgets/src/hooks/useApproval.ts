import { useState } from 'react';

import { useErc20Approvals, useNftApproval, useNftApprovalAll } from '@kyber/hooks';
import { DEXES_INFO, univ2Types, univ4Types } from '@kyber/schema';

import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export function useApproval({ type }: { type: 'source' | 'target' }) {
  const { chainId, connectedAccount, rpcUrl, onSubmitTx, sourcePoolType, targetPoolType } = useWidgetStore([
    'chainId',
    'connectedAccount',
    'rpcUrl',
    'onSubmitTx',
    'sourcePoolType',
    'targetPoolType',
  ]);
  const { sourcePool, targetPool } = usePoolStore(['sourcePool', 'targetPool']);
  const { sourcePositionId, targetPositionId, targetPosition } = usePositionStore([
    'sourcePositionId',
    'targetPositionId',
    'targetPosition',
  ]);
  const { liquidityOut, route } = useZapStore(['liquidityOut', 'route']);

  const pool = type === 'source' ? sourcePool : targetPool;
  const nftId = type === 'source' ? +sourcePositionId : targetPositionId ? +targetPositionId : undefined;
  const poolType = type === 'source' ? sourcePoolType : targetPoolType;
  const { address: account } = connectedAccount;
  const nftManager = poolType ? DEXES_INFO[poolType].nftManagerContract : undefined;
  const nftManagerContract = nftManager
    ? typeof nftManager === 'string'
      ? nftManager
      : nftManager[chainId]
    : undefined;

  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('single');
  const isFromUniV2 = type === 'source' && pool && univ2Types.includes(pool.poolType as any);
  const isToUniV4 = type === 'target' && pool && univ4Types.includes(pool.poolType as any);

  const {
    approvalStates: erc20ApprovalStates,
    approve: approveErc20,
    loading: erc20ApprovalLoading,
    pendingTx: erc20ApprovalPendingTx,
  } = useErc20Approvals({
    amounts: isFromUniV2 ? [liquidityOut?.toString() || '0'] : [],
    addreses: isFromUniV2 && pool ? [pool.address] : [],
    owner: account || '',
    spender: route?.routerAddress || '',
    rpcUrl,
    onSubmitTx,
  });

  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    isChecking: isCheckingNftApproval,
  } = useNftApproval({
    tokenId: nftId,
    spender: route?.routerAddress || '',
    userAddress: account || '',
    rpcUrl,
    nftManagerContract: nftManagerContract || '',
    onSubmitTx: onSubmitTx,
  });

  const {
    isApproved: nftApprovedAll,
    approveAll: approveNftAll,
    approvePendingTx: nftApprovePendingTxAll,
    isChecking: isCheckingNftApprovalAll,
  } = useNftApprovalAll({
    spender: route?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract: nftManagerContract || '',
    onSubmitTx: onSubmitTx,
  });

  const isChecking = isFromUniV2
    ? erc20ApprovalLoading
    : type === 'source' || (isToUniV4 && targetPosition)
      ? isCheckingNftApproval || isCheckingNftApprovalAll
      : false;

  const isApproved = isFromUniV2
    ? erc20ApprovalStates[pool?.address || ''] === 'approved'
    : type === 'source' || (isToUniV4 && targetPosition)
      ? nftApproved || nftApprovedAll
      : true;

  const approve = isFromUniV2
    ? () => approveErc20(pool?.address || '')
    : type === 'source' || (isToUniV4 && targetPosition)
      ? nftApprovalType === 'single'
        ? approveNft
        : approveNftAll
      : null;

  const pendingTx = isFromUniV2
    ? erc20ApprovalPendingTx
    : type === 'source' || (isToUniV4 && targetPosition)
      ? nftApprovalType === 'single'
        ? nftApprovePendingTx
        : nftApprovePendingTxAll
      : '';

  return { isChecking, isApproved, approve, pendingTx, nftApprovalType, setNftApprovalType };
}
