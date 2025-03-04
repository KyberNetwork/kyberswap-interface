import { create } from "zustand";
import { algebraTypes, ChainId, Dex, Position } from "../schema";
import { DexInfos, NetworkInfo } from "../constants";
import { getFunctionSelector, encodeUint256 } from "@kyber/utils/crypto";
import {
  decodeAlgebraV1Position,
  decodePosition,
} from "@kyber/utils/uniswapv3";

const initState = {
  fromPosition: "loading" as "loading" | Position,
  toPosition: "loading" as "loading" | Position | null,
  error: "",
};

export const usePositionStore = create<{
  fromPosition: "loading" | Position;
  toPosition: "loading" | Position | null;
  error: string;
  setToPositionNull: () => void;
  fetchPosition: (
    dex: Dex,
    chainId: ChainId,
    positionId: number,
    isFromPos: boolean
  ) => Promise<void>;
  reset: () => void;
}>((set) => ({
  ...initState,
  reset: () => set(initState),
  setToPositionNull: () => {
    set({ toPosition: null });
  },
  fetchPosition: async (
    dex: Dex,
    chainId: ChainId,
    positionId: number,
    isFromPos: boolean
  ) => {
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
      const data = algebraTypes.includes(dex)
        ? decodeAlgebraV1Position(result)
        : decodePosition(result);

      if (isFromPos)
        set({
          fromPosition: {
            id: positionId,
            dex,
            liquidity: data.liquidity,
            tickLower: data.tickLower,
            tickUpper: data.tickUpper,
          },
        });
      else {
        set({
          toPosition: {
            id: positionId,
            dex,
            liquidity: data.liquidity,
            tickLower: data.tickLower,
            tickUpper: data.tickUpper,
          },
        });
      }
      return;
    }

    set({ error: error.message || "Position not found" });
  },
}));
