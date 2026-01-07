import { useState } from 'react';

import { useErc20Approvals, useNftApproval, useNftApprovalAll, usePermitNft } from '@kyber/hooks';
import { DEXES_INFO, ZERO_ADDRESS, univ2Types, univ4Types } from '@kyber/schema';

import { usePoolStore } from '@/stores/usePoolStore';
import { usePositionStore } from '@/stores/usePositionStore';
import { useWidgetStore } from '@/stores/useWidgetStore';
import { useZapStore } from '@/stores/useZapStore';

export function useApproval({ type, spender }: { type: 'source' | 'target'; spender?: string }) {
  const {
    chainId,
    connectedAccount,
    rpcUrl,
    onSubmitTx,
    sourcePoolType,
    targetPoolType,
    signTypedData,
    txStatus,
    txHashMapping,
  } = useWidgetStore([
    'chainId',
    'connectedAccount',
    'rpcUrl',
    'onSubmitTx',
    'sourcePoolType',
    'targetPoolType',
    'signTypedData',
    'txStatus',
    'txHashMapping',
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
  const { address: account, chainId: walletChainId } = connectedAccount;
  const nftManager = poolType ? DEXES_INFO[poolType].nftManagerContract : undefined;
  const nftManagerContract = nftManager
    ? typeof nftManager === 'string'
      ? nftManager
      : nftManager[chainId]
    : undefined;

  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('all');
  const isFromUniV2 = type === 'source' && pool && univ2Types.includes(pool.poolType as any);
  const isToUniV4 = type === 'target' && pool && univ4Types.includes(pool.poolType as any);

  const routerAddress = spender && spender !== ZERO_ADDRESS ? spender : route?.routerAddress || '';
  const needIncreasePermitNonce = Boolean(
    type === 'target' && !!targetPositionId && isToUniV4 && sourcePoolType === targetPoolType,
  );

  const {
    approvalStates: erc20ApprovalStates,
    approve: approveErc20,
    loading: erc20ApprovalLoading,
    pendingTx: erc20ApprovalPendingTx,
    currentPendingTx: erc20CurrentPendingTx,
  } = useErc20Approvals({
    amounts: isFromUniV2 ? [liquidityOut?.toString() || '0'] : [],
    addreses: isFromUniV2 && pool ? [pool.address] : [],
    owner: account || '',
    spender: routerAddress,
    rpcUrl,
    onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
  });

  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    currentApprovePendingTx: nftCurrentPendingTx,
    isChecking: isCheckingNftApproval,
  } = useNftApproval({
    tokenId: nftId,
    spender: routerAddress,
    userAddress: account || '',
    rpcUrl,
    nftManagerContract: nftManagerContract || '',
    onSubmitTx: onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
  });

  const {
    isApproved: nftApprovedAll,
    approveAll: approveNftAll,
    approvePendingTx: nftApprovePendingTxAll,
    currentApprovePendingTx: nftCurrentPendingTxAll,
    isChecking: isCheckingNftApprovalAll,
  } = useNftApprovalAll({
    spender: routerAddress,
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract: nftManagerContract || '',
    onSubmitTx: onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
  });

  const { permitState, signPermitNft, permitData } = usePermitNft({
    nftManagerContract,
    tokenId: nftId ? nftId.toString() : undefined,
    spender: route?.routerPermitAddress,
    account,
    chainId: walletChainId,
    rpcUrl,
    signTypedData,
    needIncreaseNonce: needIncreasePermitNonce,
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

  // Current pending tx hash (tracks replacements)
  const currentPendingTx = isFromUniV2
    ? erc20CurrentPendingTx
    : type === 'source' || (isToUniV4 && targetPosition)
      ? nftApprovalType === 'single'
        ? nftCurrentPendingTx
        : nftCurrentPendingTxAll
      : '';

  return {
    approval: { isChecking, isApproved, approve, pendingTx, currentPendingTx, nftApprovalType, setNftApprovalType },
    permit: {
      state: permitState,
      data: permitData,
      sign: signPermitNft,
    },
  };
}
