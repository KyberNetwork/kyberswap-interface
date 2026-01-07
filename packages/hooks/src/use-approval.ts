import { useEffect, useState } from 'react';

import { NATIVE_TOKEN_ADDRESS } from '@kyber/schema';
import {
  calculateGasMargin,
  checkApproval,
  estimateGas,
  getFunctionSelector,
  isAddress,
  isTransactionSuccessful,
} from '@kyber/utils/crypto';

export enum APPROVAL_STATE {
  UNKNOWN = 'unknown',
  PENDING = 'pending',
  APPROVED = 'approved',
  NOT_APPROVED = 'not_approved',
}

export interface ApprovalAdditionalInfo {
  type: 'erc20_approval' | 'nft_approval' | 'nft_approval_all';
  tokenAddress: string;
  tokenSymbol?: string;
  dexName?: string;
}

export const useErc20Approvals = ({
  amounts,
  addreses,
  owner,
  spender,
  rpcUrl,
  onSubmitTx,
  txStatus,
  txHashMapping,
  tokenSymbols,
  dexName,
}: {
  amounts: string[];
  addreses: string[];
  owner: string;
  spender: string;
  rpcUrl: string;
  onSubmitTx: (
    txData: { from: string; to: string; value: string; data: string; gasLimit: string },
    additionalInfo?: ApprovalAdditionalInfo,
  ) => Promise<string>;
  txStatus?: Record<string, 'pending' | 'success' | 'failed'>;
  txHashMapping?: Record<string, string>;
  tokenSymbols?: string[];
  dexName?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<{
    [address: string]: APPROVAL_STATE;
  }>(() =>
    addreses.reduce((acc, token) => {
      return {
        ...acc,
        [token]:
          token.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.UNKNOWN,
      };
    }, {}),
  );
  const [pendingTx, setPendingTx] = useState('');
  const [addressToApprove, setAddressToApprove] = useState('');

  const approve = async (address: string, amount?: bigint) => {
    if (!isAddress(address) || !owner) return;
    setAddressToApprove(address);

    const approveFunctionSig = getFunctionSelector('approve(address,uint256)'); // "0x095ea7b3"; // Keccak-256 hash of "" truncated to 4 bytes
    const paddedSpender = spender.replace('0x', '').padStart(64, '0');
    const paddedAmount = (
      amount ? amount.toString(16) : 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    ).padStart(64, '0'); // Amount in hex

    const data = `0x${approveFunctionSig}${paddedSpender}${paddedAmount}`;

    const txData = {
      from: owner,
      to: address,
      value: '0x0',
      data,
    };

    try {
      const gasEstimation = await estimateGas(rpcUrl, txData);

      // Find token symbol from the addresses array
      const tokenIndex = addreses.findIndex(addr => addr.toLowerCase() === address.toLowerCase());
      const tokenSymbol = tokenIndex >= 0 && tokenSymbols ? tokenSymbols[tokenIndex] : undefined;

      const txHash = await onSubmitTx(
        {
          ...txData,
          gasLimit: calculateGasMargin(gasEstimation),
        },
        {
          type: 'erc20_approval',
          tokenAddress: address,
          tokenSymbol,
          dexName,
        },
      );
      setApprovalStates({
        ...approvalStates,
        [address]: APPROVAL_STATE.PENDING,
      });
      setPendingTx(txHash);
    } catch (e) {
      console.log('approve failed', e);
      setAddressToApprove('');
    }
  };

  // Get the current tx hash (might be different if tx was replaced/sped up)
  const currentPendingTx = pendingTx ? (txHashMapping?.[pendingTx] ?? pendingTx) : '';

  // When txStatus is provided (from app), use it directly
  useEffect(() => {
    if (!txStatus || !pendingTx || !addressToApprove) return;

    const status = txStatus[pendingTx];
    if (status === 'success') {
      setPendingTx('');
      setAddressToApprove('');
      setApprovalStates(prev => ({
        ...prev,
        [addressToApprove]: APPROVAL_STATE.APPROVED,
      }));
    } else if (status === 'failed') {
      setPendingTx('');
      setApprovalStates(prev => ({
        ...prev,
        [addressToApprove]: APPROVAL_STATE.NOT_APPROVED,
      }));
    }
  }, [txStatus, pendingTx, addressToApprove]);

  // Fallback: Poll RPC when txStatus is not provided (standalone widget usage)
  useEffect(() => {
    if (txStatus || !currentPendingTx || !addressToApprove) return;

    const i = setInterval(() => {
      isTransactionSuccessful(rpcUrl, currentPendingTx).then(res => {
        if (res) {
          setPendingTx('');
          if (res.status) setAddressToApprove('');
          setApprovalStates(prev => ({
            ...prev,
            [addressToApprove]: res.status ? APPROVAL_STATE.APPROVED : APPROVAL_STATE.NOT_APPROVED,
          }));
        }
      });
    }, 8_000);

    return () => {
      clearInterval(i);
    };
  }, [currentPendingTx, rpcUrl, addressToApprove, txStatus]);

  useEffect(() => {
    if (owner && spender && addreses.length === amounts.length) {
      setLoading(true);
      Promise.all(
        addreses.map(async (address, index) => {
          if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) return APPROVAL_STATE.APPROVED;

          const amountToApprove = BigInt(amounts[index]);
          return await checkApproval({
            rpcUrl,
            token: address,
            owner,
            spender,
          })
            .then(allowance => {
              if (amountToApprove <= allowance) {
                return APPROVAL_STATE.APPROVED;
              } else {
                return APPROVAL_STATE.NOT_APPROVED;
              }
            })

            .catch((e: Error) => {
              console.log('get allowance failed', e);
              return APPROVAL_STATE.UNKNOWN;
            });
        }),
      )
        .then(res => {
          const tmp = addreses.reduce((acc, address, index) => {
            return {
              ...acc,
              [address]: res[index],
            };
          }, {});
          setApprovalStates(tmp);
        })
        .finally(() => {
          setLoading(false);
        });
    }
    // eslint-disable-next-line
  }, [
    owner,
    spender,
    // eslint-disable-next-line
    JSON.stringify(addreses),
    // eslint-disable-next-line
    JSON.stringify(amounts),
    rpcUrl,
  ]);

  return {
    approvalStates,
    addressToApprove,
    approve,
    loading,
    pendingTx,
    currentPendingTx,
  };
};
