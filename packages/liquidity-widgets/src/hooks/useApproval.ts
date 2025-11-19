import { useMemo, useState } from 'react';

import {
  APPROVAL_STATE,
  PermitNftResult,
  PermitNftState,
  useErc20Approvals,
  useNftApproval,
  useNftApprovalAll,
  usePermitNft,
} from '@kyber/hooks';
import { getNftManagerContractAddress } from '@kyber/utils';
import { parseUnits } from '@kyber/utils/crypto';

import { useZapState } from '@/hooks/useZapState';
import { useWidgetStore } from '@/stores/useWidgetStore';

export interface ApprovalState {
  nftApprovalType: 'single' | 'all';
  setNftApprovalType: (_type: 'single' | 'all') => void;
  nftApproval: {
    pendingTx: string;
    isChecking: boolean;
    isApproved: boolean;
    approve: () => Promise<void>;
    check: () => Promise<void>;
  };
  nftApprovalAll: {
    pendingTx: string;
    isChecking: boolean;
    isApproved: boolean;
    approve: () => Promise<void>;
    check: () => Promise<void>;
  };
  permit: {
    state: PermitNftState;
    data: PermitNftResult | null;
    sign: (_deadline: number) => Promise<PermitNftResult | null>;
  };
  tokenApproval: {
    loading: boolean;
    states: {
      [address: string]: APPROVAL_STATE;
    };
    approve: (_address: string, _amount?: bigint) => Promise<void>;
    addressToApprove: string;
  };
}

export default function useApproval() {
  const { chainId, rpcUrl, poolType, connectedAccount, positionId, onSubmitTx, signTypedData } = useWidgetStore([
    'chainId',
    'rpcUrl',
    'poolType',
    'connectedAccount',
    'positionId',
    'onSubmitTx',
    'signTypedData',
  ]);
  const { zapInfo, tokensIn, amountsIn } = useZapState();
  const [nftApprovalType, setNftApprovalType] = useState<'single' | 'all'>('single');

  const nftManagerContract = getNftManagerContractAddress(poolType, chainId);
  const {
    isApproved: nftApproved,
    approve: approveNft,
    approvePendingTx: nftApprovePendingTx,
    checkApproval: checkNftApproval,
    isChecking: isCheckingNftApproval,
  } = useNftApproval({
    tokenId: positionId ? +positionId : undefined,
    spender: zapInfo?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
  });

  const {
    isApproved: nftApprovedAll,
    approveAll: approveNftAll,
    approvePendingTx: nftApprovePendingTxAll,
    checkApprovalAll: checkNftApprovalAll,
    isChecking: isCheckingNftApprovalAll,
  } = useNftApprovalAll({
    spender: zapInfo?.routerAddress || '',
    userAddress: connectedAccount?.address || '',
    rpcUrl,
    nftManagerContract,
    onSubmitTx: onSubmitTx,
  });

  const { permitState, signPermitNft, permitData } = usePermitNft({
    nftManagerContract,
    tokenId: positionId,
    spender: zapInfo?.routerPermitAddress,
    account: connectedAccount?.address,
    chainId: connectedAccount?.chainId,
    rpcUrl,
    signTypedData,
  });

  const amountsInWei: string[] = useMemo(
    () =>
      !amountsIn
        ? []
        : amountsIn
            .split(',')
            .map((amount, index) => parseUnits(amount || '0', tokensIn[index]?.decimals || 0).toString()),
    [tokensIn, amountsIn],
  );

  const tokenAddressesToApprove = tokensIn
    .filter((_, index) => Number(amountsInWei[index]) > 0)
    .map(token => token?.address || '');
  const amountsToApprove = amountsInWei.filter(amount => Number(amount) > 0);
  const { loading, approvalStates, approve, addressToApprove } = useErc20Approvals({
    amounts: amountsToApprove,
    addreses: tokenAddressesToApprove,
    owner: connectedAccount?.address || '',
    rpcUrl,
    spender: zapInfo?.routerAddress || '',
    onSubmitTx: onSubmitTx,
  });

  return {
    nftApprovalType,
    setNftApprovalType,
    nftApproval: {
      pendingTx: nftApprovePendingTx,
      isChecking: isCheckingNftApproval,
      isApproved: nftApproved,
      approve: approveNft,
      check: checkNftApproval,
    },
    nftApprovalAll: {
      pendingTx: nftApprovePendingTxAll,
      isChecking: isCheckingNftApprovalAll,
      isApproved: nftApprovedAll,
      approve: approveNftAll,
      check: checkNftApprovalAll,
    },
    permit: {
      state: permitState,
      data: permitData,
      sign: signPermitNft,
    },
    tokenApproval: {
      loading,
      states: approvalStates,
      approve,
      addressToApprove,
    },
  };
}
