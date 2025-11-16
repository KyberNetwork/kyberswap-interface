import { useState } from 'react';

import { useErc20Approvals, useNftApproval, useNftApprovalAll } from '@kyber/hooks';
import { DEXES_INFO, univ2Types } from '@kyber/schema';

import { useZapOutContext } from '@/stores';
import { useZapOutUserState } from '@/stores/state';

export function useApproval() {
  const { onSubmitTx, connectedAccount, poolType, poolAddress, positionId, rpcUrl, chainId } = useZapOutContext(s => s);
  const { address: account } = connectedAccount;
  const { liquidityOut, mode, route } = useZapOutUserState();

  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('single');
  const isUniV2 = univ2Types.includes(poolType as any);

  const nftManager = DEXES_INFO[poolType].nftManagerContract;
  const nftManagerContract = typeof nftManager === 'string' ? nftManager : nftManager[chainId];

  const {
    approvalStates: erc20ApprovalStates,
    approve: approveErc20,
    loading: erc20ApprovalLoading,
    pendingTx: erc20ApprovalPendingTx,
  } = useErc20Approvals({
    amounts: isUniV2 ? [liquidityOut?.toString() || '0'] : [],
    addreses: isUniV2 ? [poolAddress] : [],
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
    tokenId: positionId ? +positionId : undefined,
    spender: route?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
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
    nftManagerContract,
    onSubmitTx: onSubmitTx,
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

  return { isChecking, isApproved, approve, pendingTx, nftApprovalType, setNftApprovalType };
}
