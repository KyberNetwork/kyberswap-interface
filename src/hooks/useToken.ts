import { useContract } from "./useContract";
import tokenABI from "../constants/abis/erc20.json";
import { useEffect, useState } from "react";
import { TokenInfo } from "../constants";
import { useActiveWeb3 } from "./useWeb3Provider";

export const useToken = (address: string) => {
  const tokenContract = useContract(address, tokenABI);
  const { chainId } = useActiveWeb3();

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  useEffect(() => {
    const getInfo = async () => {
      const [name, symbol, decimals] = await Promise.all([
        tokenContract?.name(),
        tokenContract?.symbol(),
        tokenContract?.decimals(),
      ]);

      setTokenInfo({
        address,
        name,
        symbol,
        decimals,
        chainId,
        logoURI: "",
      });
    };

    getInfo();
  }, [tokenContract, address, chainId]);

  return tokenInfo;
};
