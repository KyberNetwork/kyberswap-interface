import { DexInfos, NetworkInfo } from "../constants";
import { ChainId, Dex } from "../schema";
import { decodeAddress, getFunctionSelector } from "@kyber/utils/crypto";
import { useEffect, useState } from "react";

const usePositionOwner = ({
  positionId0,
  chainId,
  dex0,
  positionId1,
  dex1,
}: {
  positionId0?: string;
  chainId: ChainId;
  dex0?: Dex;
  positionId1?: string;
  dex1?: Dex;
}) => {
  const [positionOwner, setPositionOwner] = useState<string | null>(null);
  const [positionOwner1, setPositionOwner1] = useState<string | null>(null);

  const rpcUrl = NetworkInfo[chainId].defaultRpc;

  const contract0 = dex0 ? DexInfos[dex0].nftManagerContract : undefined;
  const nftManagerContract0 = contract0
    ? typeof contract0 === "string"
      ? contract0
      : contract0[chainId]
    : undefined;

  const contract1 = dex1 ? DexInfos[dex1].nftManagerContract : undefined;
  const nftManagerContract1 = contract1
    ? typeof contract1 === "string"
      ? contract1
      : contract1[chainId]
    : undefined;

  useEffect(() => {
    if (!positionId0 || !nftManagerContract0) return;

    const methodSignature = getFunctionSelector("ownerOf(uint256)");
    const encodedTokenId = (+positionId0).toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

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
            to: nftManagerContract0,
            data,
          },
          "latest",
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.result)
          setPositionOwner(decodeAddress(res.result.slice(2))?.toLowerCase());
      });
  }, [positionId0, nftManagerContract0, rpcUrl]);

  useEffect(() => {
    if (!positionId1 || !nftManagerContract1) return;

    const methodSignature = getFunctionSelector("ownerOf(uint256)");
    const encodedTokenId = (+positionId1).toString(16).padStart(64, "0");
    const data = "0x" + methodSignature + encodedTokenId;

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
            to: nftManagerContract1,
            data,
          },
          "latest",
        ],
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res?.result)
          setPositionOwner1(decodeAddress(res.result.slice(2))?.toLowerCase());
      });
  }, [positionId1, nftManagerContract1, rpcUrl]);

  return { positionOwner, positionOwner1 };
};

export default usePositionOwner;
