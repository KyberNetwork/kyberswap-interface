import { create } from "zustand";
import { ChainId, Dex, Position } from "../schema";
import { DexInfos, NetworkInfo } from "../constants";
import { getFunctionSelector, encodeUint256 } from "@kyber/utils/crypto";
import { decodePosition } from "@kyber/utils/uniswapv3";

export const usePositionStore = create<{
  position: "loading" | Position;
  error: string;
  fetchPosition: (
    dex: Dex,
    chainId: ChainId,
    positionId: number
  ) => Promise<void>;
}>((set) => ({
  position: "loading",
  error: "",
  fetchPosition: async (dex: Dex, chainId: ChainId, positionId: number) => {
    const contract = DexInfos[dex].nftManagerContract;
    const contractAddress =
      typeof contract === "string" ? contract : contract[chainId];

    // Function signature and encoded token ID
    const functionSignature = "positions(uint256)";
    const selector = getFunctionSelector(functionSignature);
    const encodedTokenId = encodeUint256(BigInt(positionId));

    const data = `0x${selector}${encodedTokenId}`;

    // JSON-RPC payload
    const payload = {
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        {
          to: contractAddress,
          data: data,
        },
        "latest",
      ],
      id: 1,
    };

    // Send JSON-RPC request via fetch
    const response = await fetch(NetworkInfo[chainId].defaultRpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const { result, error } = await response.json();

    if (result && result !== "0x") {
      const data = decodePosition(result);

      set({
        position: {
          id: positionId,
          dex,
          liquidity: data.liquidity,
          tickLower: data.tickLower,
          tickUpper: data.tickUpper,
        },
      });
      return;
    }

    set({ error: error.message || "Position not found" });
  },
}));
