import { useCallback, useEffect, useState } from "react";
import { Address, erc20Abi } from "viem";
import { useWeb3Provider } from "@/hooks/useProvider";
import { NATIVE_TOKEN_ADDRESS } from "@/constants";
import { calculateGasMargin } from "@/utils";

export enum APPROVAL_STATE {
  UNKNOWN = "unknown",
  PENDING = "pending",
  APPROVED = "approved",
  NOT_APPROVED = "not_approved",
}

export default function useApprovals(
  amounts: string[],
  addresses: string[],
  spender: string
) {
  const { account, publicClient, walletClient } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<{
    [address: string]: APPROVAL_STATE;
  }>(() =>
    addresses.reduce((acc, token) => {
      return {
        ...acc,
        [token]:
          token === NATIVE_TOKEN_ADDRESS
            ? APPROVAL_STATE.APPROVED
            : APPROVAL_STATE.UNKNOWN,
      };
    }, {})
  );
  const [pendingTx, setPendingTx] = useState("");
  const [addressToApprove, setAddressToApprove] = useState("");

  const approve = useCallback(
    async (address: string) => {
      if (!publicClient || !account || !walletClient) {
        return;
      }
      setAddressToApprove(address);

      try {
        const estimatedGas = await publicClient.estimateContractGas({
          account,
          address: address as Address,
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
          address: address as Address,
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

        setApprovalStates({
          ...approvalStates,
          [address]: APPROVAL_STATE.PENDING,
        });
        setPendingTx(hash);
      } catch (e) {
        setAddressToApprove("");
        console.log({
          error: e,
        });
      }
    },
    [account, approvalStates, publicClient, spender, walletClient]
  );

  useEffect(() => {
    if (pendingTx) {
      publicClient
        ?.waitForTransactionReceipt({
          hash: pendingTx as `0x${string}`,
        })
        .then((receipt) => {
          if (receipt) {
            setPendingTx("");
            setAddressToApprove("");
            setApprovalStates({
              ...approvalStates,
              [addressToApprove]: APPROVAL_STATE.APPROVED,
            });
          }
        });
    }
  }, [pendingTx, addressToApprove, approvalStates, publicClient]);

  useEffect(() => {
    if (
      !account ||
      !publicClient ||
      !spender ||
      addresses.length !== amounts.length
    )
      return;

    setLoading(true);
    Promise.all(
      addresses.map((address, index) => {
        if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase())
          return APPROVAL_STATE.APPROVED;

        return publicClient
          ?.readContract({
            abi: erc20Abi,
            address: address as Address,
            functionName: "allowance",
            args: [account, spender as Address],
          })
          .then((res) => {
            const amountToApproveString = amounts[index];
            const amountToApprove = BigInt(amountToApproveString);
            if (amountToApprove <= res) return APPROVAL_STATE.APPROVED;
            else return APPROVAL_STATE.NOT_APPROVED;
          })
          .catch((e: Error) => {
            console.log("get allowance failed", e);
            return APPROVAL_STATE.UNKNOWN;
          });
      })
    )
      .then((res) => {
        const tmp = addresses.reduce((acc, address, index) => {
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    account,
    spender,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(addresses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(amounts),
    publicClient,
  ]);

  return { approvalStates, addressToApprove, approve, loading };
}
