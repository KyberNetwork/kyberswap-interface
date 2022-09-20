import { Contract, ContractInterface } from "ethers";
import { useMemo } from "react";
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
  return useContract(
    "0xed386Fe855C1EFf2f843B910923Dd8846E45C5A4",
    multicallABI
  );
};
