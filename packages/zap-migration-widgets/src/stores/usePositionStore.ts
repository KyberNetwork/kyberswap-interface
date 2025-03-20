import { DexInfos, NetworkInfo } from "../constants";
import {
  algebraTypes,
  ChainId,
  Dex,
  Position,
  univ2Dexes,
  univ3Dexes,
} from "../schema";
import { getFunctionSelector, encodeUint256 } from "@kyber/utils/crypto";
import {
  decodeAlgebraV1Position,
  decodePosition,
} from "@kyber/utils/uniswapv3";
import { create } from "zustand";

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
    positionId: number | string,
    poolAddress: string,
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
    positionId: number | string,
    poolAddress: string,
    isFromPos: boolean
  ) => {
    const isUniv3 = univ3Dexes.includes(dex);
    const isUniv2 = univ2Dexes.includes(dex);

    if (isUniv3) {
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
            } as Position,
          });
        else {
          set({
            toPosition: {
              id: positionId,
              dex,
              liquidity: data.liquidity,
              tickLower: data.tickLower,
              tickUpper: data.tickUpper,
            } as Position,
          });
        }
        return;
      }
      set({ error: error.message || "Position not found" });
      return;
    }
    if (isUniv2) {
      // get pool total supply and user supply
      const balanceOfSelector = getFunctionSelector("balanceOf(address)");
      const totalSupplySelector = getFunctionSelector("totalSupply()");
      const paddedAccount = positionId
        .toString()
        .replace("0x", "")
        .padStart(64, "0");

      const getPayload = (d: string) => {
        return {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_call",
            params: [
              {
                to: poolAddress,
                data: d,
              },
              "latest",
            ],
            id: 1,
          }),
        };
      };

      const balanceRes = await fetch(
        NetworkInfo[chainId].defaultRpc,
        getPayload(`0x${balanceOfSelector}${paddedAccount}`)
      ).then((res) => res.json());

      const totalSupplyRes = await fetch(
        NetworkInfo[chainId].defaultRpc,
        getPayload(`0x${totalSupplySelector}`)
      ).then((res) => res.json());

      const userBalance = BigInt(balanceRes?.result || "0");
      const totalSupply = BigInt(totalSupplyRes?.result || "0");

      const pos = {
        id: positionId,
        liquidity: userBalance.toString(),
        dex,
        totalSupply: totalSupply.toString(),
      } as Position;

      if (isFromPos) set({ fromPosition: pos });
      else set({ toPosition: pos });

      return;
    }

    set({ error: `Pool Type is not supported` });
  },
}));
