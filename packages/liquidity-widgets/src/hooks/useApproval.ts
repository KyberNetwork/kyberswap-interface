import { BigNumber, Contract, providers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { NATIVE_TOKEN_ADDRESS } from "../constants";
import { useContract } from "./useContract";
import erc20ABI from "../abis/erc20.json";
import { useWeb3Provider } from "./useProvider";
import { isAddress } from "../utils";

export enum APPROVAL_STATE {
  UNKNOWN = "unknown",
  PENDING = "pending",
  APPROVED = "approved",
  NOT_APPROVED = "not_approved",
}
const MaxUint256: BigNumber = BigNumber.from(
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
);

function useApproval(
  amountToApproveString: string,
  token: string,
  spender: string
) {
  const { account, provider } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [approvalState, setApprovalState] = useState(() =>
    token === NATIVE_TOKEN_ADDRESS
      ? APPROVAL_STATE.APPROVED
      : APPROVAL_STATE.UNKNOWN
  );
  const contract = useContract(token, erc20ABI);

  const [pendingTx, setPendingTx] = useState("");

  const approve = useCallback(() => {
    if (contract) {
      return contract
        .approve(spender, MaxUint256)
        .then((res: providers.TransactionResponse) => {
          setApprovalState(APPROVAL_STATE.PENDING);
          setPendingTx(res.hash);
        });
    }
  }, [contract, spender]);

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(pendingTx).then((receipt) => {
          if (receipt) {
            setPendingTx("");
            setApprovalState(APPROVAL_STATE.APPROVED);
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [pendingTx, provider]);

  useEffect(() => {
    if (token === NATIVE_TOKEN_ADDRESS) {
      setApprovalState(APPROVAL_STATE.APPROVED);
      return;
    }
    if (contract && account && spender) {
      setLoading(true);
      contract
        .allowance(account, spender)
        .then((res: BigNumber) => {
          const amountToApprove = BigNumber.from(amountToApproveString);
          if (amountToApprove.lte(res)) {
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
  }, [contract, token, account, spender, amountToApproveString]);

  return { loading, approvalState, approve };
}

export default useApproval;

export const useApprovals = (
  amounts: string[],
  addreses: string[],
  spender: string
) => {
  const { account, provider } = useWeb3Provider();
  const [loading, setLoading] = useState(false);
  const [approvalStates, setApprovalStates] = useState<{
    [address: string]: APPROVAL_STATE;
  }>(() =>
    addreses.reduce((acc, token) => {
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

  const approve = (address: string) => {
    const checkedSumAddress = isAddress(address);
    if (!checkedSumAddress) return;
    setAddressToApprove(address);
    const contract = new Contract(
      address,
      erc20ABI,
      provider.getSigner(account)
    );
    return contract
      .approve(spender, MaxUint256)
      .then((res: providers.TransactionResponse) => {
        setApprovalStates({
          ...approvalStates,
          [address]: APPROVAL_STATE.PENDING,
        });
        setPendingTx(res.hash);
      })
      .catch(() => {
        setAddressToApprove("");
      });
  };

  useEffect(() => {
    if (pendingTx) {
      const i = setInterval(() => {
        provider?.getTransactionReceipt(pendingTx).then((receipt) => {
          if (receipt) {
            setPendingTx("");
            setAddressToApprove("");
            setApprovalStates({
              ...approvalStates,
              [addressToApprove]: APPROVAL_STATE.APPROVED,
            });
          }
        });
      }, 8_000);

      return () => {
        clearInterval(i);
      };
    }
  }, [pendingTx, provider, addressToApprove, approvalStates]);

  useEffect(() => {
    if (account && spender && addreses.length === amounts.length) {
      setLoading(true);
      Promise.all(
        addreses.map((address, index) => {
          if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase())
            return APPROVAL_STATE.APPROVED;
          const contract = new Contract(address, erc20ABI, provider);
          const amountToApproveString = amounts[index];
          return contract
            .allowance(account, spender)
            .then((res: BigNumber) => {
              const amountToApprove = BigNumber.from(amountToApproveString);
              if (amountToApprove.lte(res)) {
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
          setLoading(false);
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
    provider,
  ]);

  return {
    approvalStates,
    addressToApprove,
    approve,
    loading,
  };
};
