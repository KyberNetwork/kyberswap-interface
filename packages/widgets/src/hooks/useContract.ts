import { Contract, ContractInterface } from "ethers";
import { useMemo } from "react";
import { MULTICALL_ADDRESS } from "../constants";
import { multicallABI } from "../constants/multicall";
import { isAddress } from "../utils";
import { useActiveWeb3 } from "./useWeb3Provider";

export function useContract(
  address: string,
  ABI: ContractInterface
): Contract | null {
  const { provider, account } = useActiveWeb3();
  return useMemo(() => {
    const checksumAddress = isAddress(address);
    if (!checksumAddress || !provider) return null;
    try {
      return new Contract(
        checksumAddress,
        ABI,
        account ? provider.getSigner(account) : (provider as any)
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [address, ABI, provider, account]);
}

export const useMulticalContract = () => {
  const { chainId } = useActiveWeb3();

  return useContract(MULTICALL_ADDRESS[chainId], multicallABI);
};
