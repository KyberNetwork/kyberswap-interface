import { useCallback, useEffect, useState } from "react";
import {
  DEXES_INFO,
  NATIVE_TOKEN_ADDRESS,
  NETWORKS_INFO,
  univ4Types,
} from "@kyber/schema";
import {
  calculateGasMargin,
  checkApproval,
  decodeAddress,
  estimateGas,
  getFunctionSelector,
  isAddress,
  isTransactionSuccessful,
} from "@kyber/utils/crypto";
import { useWidgetContext } from "@/stores";

export enum APPROVAL_STATE {
  UNKNOWN = "unknown",
  PENDING = "pending",
  APPROVED = "approved",
  NOT_APPROVED = "not_approved",
}

export const useApprovals = (
  amounts: string[],
  addreses: string[],
  spender: string
) => {
  const { chainId, connectedAccount, onSubmitTx, poolType, positionId } =
    useWidgetContext((s) => s);
  const { address: account } = connectedAccount;

  const isUniv4 = univ4Types.includes(poolType);

  const [tokenApprovalloading, setTokenApprovelLoading] = useState(false);
  const [nftApprovalLoading, setNftApprovalLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<{
    [address: string]: APPROVAL_STATE;
  }>(() =>
    addreses.reduce((acc, token) => {
      return {
        ...acc,
        [token]:
          token.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
            ? APPROVAL_STATE.APPROVED
            : APPROVAL_STATE.UNKNOWN,
      };
    }, {})
  );
  const [nftApproval, setNftApproval] = useState(false);
  const [tokenPendingTx, setTokenPendingTx] = useState("");
  const [nftPendingTx, setNftPendingTx] = useState("");
  const [addressToApprove, setAddressToApprove] = useState("");

  const rpcUrl = NETWORKS_INFO[chainId].defaultRpc;

  const approve = async (address: string) => {
    if (!isAddress(address) || !account) return;
    setAddressToApprove(address);

    const approveFunctionSig = getFunctionSelector("approve(address,uint256)"); // "0x095ea7b3"; // Keccak-256 hash of "" truncated to 4 bytes
    const paddedSpender = spender.replace("0x", "").padStart(64, "0");
    const paddedAmount =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff".padStart(
        64,
        "0"
      ); // Amount in hex

    const data = `0x${approveFunctionSig}${paddedSpender}${paddedAmount}`;

    const txData = {
      from: account,
      to: address,
      value: "0x0",
      data,
    };

    try {
      const gasEstimation = await estimateGas(rpcUrl, txData);

      const txHash = await onSubmitTx({
        ...txData,
        gasLimit: calculateGasMargin(gasEstimation),
      });
      setApprovalStates({
        ...approvalStates,
        [address]: APPROVAL_STATE.PENDING,
      });
      setTokenPendingTx(txHash);
    } catch (e) {
      console.log("approve failed", e);
      setAddressToApprove("");
    }
  };

  const approveNft = useCallback(async () => {
    if (!account || !spender || !isUniv4 || !positionId) return;

    const contract = DEXES_INFO[poolType].nftManagerContract;
    const nftManagerContract =
      typeof contract === "string" ? contract : contract[chainId];

    if (!nftManagerContract) return;

    const methodSignature = getFunctionSelector("approve(address,uint256)");
    const encodedSpenderAddress = spender.slice(2).padStart(64, "0");
    const encodedTokenId = (+positionId).toString(16).padStart(64, "0");
    const approvalData = `0x${methodSignature}${encodedSpenderAddress}${encodedTokenId}`;
    const txData = {
      from: account,
      to: nftManagerContract,
      data: approvalData,
      value: "0x0",
    };

    try {
      const gasEstimation = await estimateGas(rpcUrl, txData);
      const txHash = await onSubmitTx({
        ...txData,
        gasLimit: calculateGasMargin(gasEstimation),
      });
      setNftPendingTx(txHash);
    } catch (error) {
      console.log("nft approve error", error);
    }
  }, [
    account,
    spender,
    isUniv4,
    positionId,
    poolType,
    chainId,
    rpcUrl,
    onSubmitTx,
  ]);

  useEffect(() => {
    if (tokenPendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, tokenPendingTx).then((res) => {
          if (res) {
            setTokenPendingTx("");
            if (res.status) setAddressToApprove("");
            setApprovalStates({
              ...approvalStates,
              [addressToApprove]: res.status
                ? APPROVAL_STATE.APPROVED
                : APPROVAL_STATE.NOT_APPROVED,
            });
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [tokenPendingTx, rpcUrl, addressToApprove, approvalStates]);

  useEffect(() => {
    if (nftPendingTx) {
      const i = setInterval(() => {
        isTransactionSuccessful(rpcUrl, nftPendingTx).then((res) => {
          if (res) {
            setNftPendingTx("");
            setNftApproval(res.status);
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [nftPendingTx, rpcUrl]);

  useEffect(() => {
    if (account && spender && addreses.length === amounts.length) {
      setTokenApprovelLoading(true);
      Promise.all(
        addreses.map(async (address, index) => {
          if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase())
            return APPROVAL_STATE.APPROVED;

          const amountToApprove = BigInt(amounts[index]);
          return await checkApproval({
            rpcUrl,
            token: address,
            owner: account,
            spender,
          })
            .then((allowance) => {
              if (amountToApprove <= allowance) {
                return APPROVAL_STATE.APPROVED;
              } else {
                return APPROVAL_STATE.NOT_APPROVED;
              }
            })

            .catch((e: Error) => {
              console.log("get allowance failed", e);
              return APPROVAL_STATE.UNKNOWN;
            });
        })
      )
        .then((res) => {
          const tmp = addreses.reduce((acc, address, index) => {
            return {
              ...acc,
              [address]: res[index],
            };
          }, {});
          setApprovalStates(tmp);
        })
        .finally(() => {
          setTokenApprovelLoading(false);
        });
    }
    // eslint-disable-next-line
  }, [
    account,
    spender,
    // eslint-disable-next-line
    JSON.stringify(addreses),
    // eslint-disable-next-line
    JSON.stringify(amounts),
    rpcUrl,
  ]);

  useEffect(() => {
    if (!spender || !account || !isUniv4 || !positionId) return;

    const contract = DEXES_INFO[poolType].nftManagerContract;
    const nftManagerContract =
      typeof contract === "string" ? contract : contract[chainId];

    if (!nftManagerContract) return;

    const methodSignature = getFunctionSelector("getApproved(uint256)");
    const encodedTokenId = (+positionId).toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

    setNftApprovalLoading(true);
    fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [
          {
            to: nftManagerContract,
            data,
          },
          "latest",
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        setNftApprovalLoading(false);
        const address = decodeAddress(
          (res?.result || "").slice(2)
        )?.toLowerCase();
        if (address === spender.toLowerCase()) setNftApproval(true);
        else setNftApproval(false);
      })
      .finally(() => {
        setNftApprovalLoading(false);
      });
  }, [positionId, spender, rpcUrl, account, isUniv4, poolType, chainId]);

  return {
    approvalStates,
    addressToApprove,
    approve,
    loading: tokenApprovalloading || nftApprovalLoading,
    nftApproval,
    approveNft,
  };
};
