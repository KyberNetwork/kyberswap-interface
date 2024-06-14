import { Contract, ContractInterface } from "ethers";
import { useMemo } from "react";
import { isAddress } from "../utils";
import { useWeb3Provider } from "./useProvider";
import MulticallABI from "../abis/multicall.json";
import { NetworkInfo } from "../constants";

export function useContract(
  address: string,
  ABI: ContractInterface,
  readOnly = false
): Contract | null {
  const { provider, account, readProvider } = useWeb3Provider();

  const readContract = useMemo(() => {
    const checksumAddress = isAddress(address);
    if (!checksumAddress) return null;
    try {
      return new Contract(checksumAddress, ABI, readProvider);
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [readProvider, ABI, address]);

  const contract = useMemo(() => {
    const checksumAddress = isAddress(address);
    if (!checksumAddress) return null;
    try {
      return new Contract(
        checksumAddress,
        ABI,
        account ? provider.getSigner(account) : provider
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [address, ABI, provider, account]);

  return readOnly ? readContract : contract;
}

export const useMulticalContract = () => {
  const { chainId, readProvider } = useWeb3Provider();

  return useMemo(() => {
    return new Contract(
      NetworkInfo[chainId].multiCall,
      MulticallABI,
      readProvider
    );
  }, [chainId, readProvider]);
};
