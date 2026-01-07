import { useState } from 'react';

import { useErc20Approvals, useNftApproval, useNftApprovalAll, usePermitNft } from '@kyber/hooks';
import { DEXES_INFO, getDexName, univ2Types } from '@kyber/schema';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function useApproval() {
  const {
    onSubmitTx,
    connectedAccount,
    poolType,
    poolAddress,
    positionId,
    rpcUrl,
    chainId,
    signTypedData,
    txStatus,
    txHashMapping,
    dexId,
    pool,
  } = useZapOutContext(s => s);
  const { address: account, chainId: walletChainId } = connectedAccount;
  const { liquidityOut, mode, route } = useZapOutUserState();

  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('all');
  const isUniV2 = univ2Types.includes(poolType as any);

  const nftManager = DEXES_INFO[poolType].nftManagerContract;
  const nftManagerContract = typeof nftManager === 'string' ? nftManager : nftManager[chainId];
  const dexName = getDexName(poolType, chainId, dexId);
  const lpTokenSymbol = pool ? `${pool.token0.symbol}-${pool.token1.symbol} LP` : '';

  const {
    approvalStates: erc20ApprovalStates,
    approve: approveErc20,
    loading: erc20ApprovalLoading,
    pendingTx: erc20ApprovalPendingTx,
    currentPendingTx: erc20CurrentPendingTx,
  } = useErc20Approvals({
    amounts: isUniV2 ? [liquidityOut?.toString() || '0'] : [],
    addreses: isUniV2 ? [poolAddress] : [],
    owner: account || '',
    spender: route?.routerAddress || '',
    rpcUrl,
    onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
    tokenSymbols: isUniV2 ? [lpTokenSymbol] : [],
    dexName,
  });

  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    currentApprovePendingTx: nftCurrentPendingTx,
    isChecking: isCheckingNftApproval,
  } = useNftApproval({
    tokenId: positionId ? +positionId : undefined,
    spender: route?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
    dexName,
  });

  const {
    isApproved: nftApprovedAll,
    approveAll: approveNftAll,
    approvePendingTx: nftApprovePendingTxAll,
    currentApprovePendingTx: nftCurrentPendingTxAll,
    isChecking: isCheckingNftApprovalAll,
  } = useNftApprovalAll({
    spender: route?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
    txStatus: txStatus as Record<string, 'pending' | 'success' | 'failed'> | undefined,
    txHashMapping,
    dexName,
  });

  const { permitState, signPermitNft, permitData } = usePermitNft({
    nftManagerContract,
    tokenId: positionId,
    spender: route?.routerPermitAddress,
    account,
    chainId: walletChainId,
    rpcUrl,
    signTypedData,
  });

  const isChecking =
    mode === 'withdrawOnly'
      ? false
      : isUniV2
        ? erc20ApprovalLoading
        : isCheckingNftApproval || isCheckingNftApprovalAll;

  const isApproved =
    mode === 'withdrawOnly'
      ? true
      : isUniV2
        ? erc20ApprovalStates[poolAddress] === 'approved'
        : nftApproved || nftApprovedAll;

  const approve =
    mode === 'withdrawOnly'
      ? null
      : isUniV2
        ? () => approveErc20(poolAddress)
        : nftApprovalType === 'single'
          ? approveNft
          : approveNftAll;

  const pendingTx =
    mode === 'withdrawOnly'
      ? ''
      : isUniV2
        ? erc20ApprovalPendingTx
        : nftApprovalType === 'single'
          ? nftApprovePendingTx
          : nftApprovePendingTxAll;

  // Current pending tx hash (tracks replacements)
  const currentPendingTx =
    mode === 'withdrawOnly'
      ? ''
      : isUniV2
        ? erc20CurrentPendingTx
        : nftApprovalType === 'single'
          ? nftCurrentPendingTx
          : nftCurrentPendingTxAll;

  return {
    approval: {
      isChecking,
      isApproved,
      approve,
      pendingTx,
      currentPendingTx,
      nftApprovalType,
      setNftApprovalType,
    },
    permit: {
      state: permitState,
      data: permitData,
      sign: signPermitNft,
    },
  };
}
