import { useCallback, useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";

import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { useWeb3Provider } from "./useProvider";
import { calculateGasMargin } from "../utils";

export enum APPROVAL_STATE {
  UNKNOWN = "unknown",
  PENDING = "pending",
  APPROVED = "approved",
  NOT_APPROVED = "not_approved",
}
function useApproval(
  amountToApproveString: string,
  token: string,
  spender: string
) {
  const { account, publicClient, walletClient } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [approvalState, setApprovalState] = useState(() =>
    token === NATIVE_TOKEN_ADDRESS
      ? APPROVAL_STATE.APPROVED
      : APPROVAL_STATE.UNKNOWN
  );

  const [pendingTx, setPendingTx] = useState<Address | undefined>(undefined);

  const approve = useCallback(async () => {
    if (!publicClient || !account || !walletClient) {
      return;
    }

    try {
      const estimatedGas = await publicClient.estimateContractGas({
        account,
        address: token as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spender as Address,
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          ),
        ],
      });

      const hash = await walletClient.writeContract({
        account,
        address: token as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [
          spender as Address,
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          ),
        ],
        gas: calculateGasMargin(estimatedGas),
        chain: undefined,
      });

      setApprovalState(APPROVAL_STATE.PENDING);
      setPendingTx(hash);
    } catch (e) {
      console.log({
        error: e,
      });
    }
  }, [account, publicClient, spender, token, walletClient]);

  useEffect(() => {
    if (pendingTx) {
      // TODO: check if waitForTransactionReceipt is ok, or go back to polling
      publicClient
        ?.waitForTransactionReceipt({
          hash: pendingTx,
        })
        .then((receipt) => {
          if (receipt) {
            setPendingTx(undefined);
            setApprovalState(APPROVAL_STATE.APPROVED);
          }
        });
    }
  }, [pendingTx, publicClient]);

  useEffect(() => {
    if (token === NATIVE_TOKEN_ADDRESS) {
      setApprovalState(APPROVAL_STATE.APPROVED);
      return;
    }

    if (account && publicClient && spender) {
      setLoading(true);
      publicClient
        ?.readContract({
          abi: erc20Abi,
          address: token as Address,
          functionName: "allowance",
          args: [account, spender as Address],
        })
        .then((res) => {
          const amountToApprove = BigInt(amountToApproveString);
          if (amountToApprove <= res) {
            setApprovalState(APPROVAL_STATE.APPROVED);
          } else {
            setApprovalState(APPROVAL_STATE.NOT_APPROVED);
          }
          setLoading(false);
        })
        .catch((e: Error) => {
          console.log("get allowance failed", e);
          setApprovalState(APPROVAL_STATE.UNKNOWN);
          setLoading(false);
        });
    }
  }, [token, account, spender, amountToApproveString, publicClient]);

  return { loading, approvalState, approve };
}

export default useApproval;
