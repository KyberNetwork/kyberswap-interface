import { Zap } from "@/App";
import Input from "@/components/Input";
import Modal from "@/components/Modal";
import SubmitButton from "@/components/SubmitButton";
import { calculateGasMargin, estimateGas } from "@kyber/utils/crypto";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  TabsContent,
  Loading,
  Button,
} from "@kyber/ui";
import {
  API_URLS,
  CHAIN_ID_TO_CHAIN,
  NETWORKS_INFO,
  ChainId,
} from "@kyber/schema";
import { useAccount, useWalletClient } from "wagmi";
import { useState } from "react";

const ZapCreatePool = () => {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [params, setParams] = useState({
    baseUrl: "https://pre-zap-api.kyberengineering.io",
    chainId: "56",
    dex: "68",
    token0: "0x55d398326f99059ff775485246999027b3197955",
    token1: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    fee: "500",
    sqrtP: "2330035469887945760033648354597",
    tickSpacing: "10",
    amountIn: "10000000000000000000",
    feePcm: "3000",
    tickLower: "66420",
    tickUpper: "68820",
    slippage: "50",
    tokensIn: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  });

  const chainPath = (CHAIN_ID_TO_CHAIN as any)?.[Number(params.chainId)] || "";

  const isDisabled = [
    params.baseUrl,
    chainPath,
    params.dex,
    params.token0,
    params.token1,
    params.fee,
    params.sqrtP,
    params.tickSpacing,
    params.amountIn,
    params.feePcm,
    params.tickLower,
    params.tickUpper,
    params.slippage,
    params.tokensIn,
  ].some((v) => !v || v.trim() === "");

  const buildUrl = () => {
    const base = params.baseUrl.replace(/\/$/, "");
    const search = new URLSearchParams();
    search.set("dex", params.dex);
    search.set("pool.tokens", `${params.token0},${params.token1}`);
    search.set("pool.uniswap_v4_config.fee", params.fee);
    search.set("pool.uniswap_v4_config.sqrt_p", params.sqrtP);
    search.set("pool.uniswap_v4_config.tick_spacing", params.tickSpacing);
    search.set("zap_in.amounts_in", params.amountIn);
    search.set("zap_in.fee_pcm", params.feePcm);
    search.set("zap_in.position.tick_lower", params.tickLower);
    search.set("zap_in.position.tick_upper", params.tickUpper);
    search.set("zap_in.slippage", params.slippage);
    search.set("zap_in.tokens_in", params.tokensIn);
    return `${base}/${chainPath || ""}/api/v1/create/route?${search.toString()}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const url = buildUrl();
      const res = await fetch(url);
      const json = await res.json();
      setResponse(json);
      setOpenModal(true);
    } catch (e) {
      setResponse({ error: (e as Error)?.message || "Unknown error" });
      setOpenModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!response?.data?.route || !address) return;
    setConfirming(true);
    try {
      const chainIdNum = Number(params.chainId) as ChainId;
      const rpcUrl = NETWORKS_INFO[chainIdNum]?.defaultRpc;
      const res = await fetch(
        `${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainIdNum]}/api/v1/create/route/build`,
        {
          method: "POST",
          body: JSON.stringify({
            sender: address,
            recipient: address,
            route: response.data.route,
          }),
        }
      );
      const json = await res.json();
      const { data } = json || {};
      if (data?.callData && address) {
        const txData = {
          from: address as `0x${string}`,
          to: data.routerAddress as `0x${string}`,
          data: data.callData as `0x${string}`,
          value: `0x${BigInt(data.value || 0).toString(16)}`,
        } as const;

        if (!walletClient) throw new Error("No wallet client");
        if (!rpcUrl) throw new Error("No RPC for selected chain");

        const gasEstimation = await estimateGas(rpcUrl, txData as any);
        await walletClient.sendTransaction({
          account: txData.from,
          to: txData.to,
          data: txData.data,
          value: BigInt(data.value || 0),
          gas: calculateGasMargin(gasEstimation),
        } as any);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <TabsContent value={Zap.ZAP_CREATE_POOL}>
      <Card>
        <CardHeader>
          <CardTitle>Zap create pool</CardTitle>
          <CardDescription>
            Fill in all parameters required by the create route API, then submit
            to preview the response.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://pre-zap-api.kyberengineering.io"
                value={params.baseUrl}
                onChange={(e) =>
                  setParams((p) => ({ ...p, baseUrl: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chainId">Chain Id</Label>
              <Input
                id="chainId"
                placeholder="e.g. 56 for BSC"
                value={params.chainId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*$/.test(v)) {
                    setParams((p) => ({ ...p, chainId: v }));
                  }
                }}
              />
              <div className="text-[11px] text-[#ffffff66]">
                Resolved chain: {chainPath || "Unknown"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="dex">Dex (id)</Label>
              <Input
                id="dex"
                placeholder="e.g. 68"
                value={params.dex}
                onChange={(e) =>
                  // allow only numbers
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, dex: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="feePcm">Protocol fee (pcm)</Label>
              <Input
                id="feePcm"
                placeholder="e.g. 3000"
                value={params.feePcm}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, feePcm: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="token0">Token0 address</Label>
              <Input
                id="token0"
                placeholder="0x..."
                value={params.token0}
                onChange={(e) =>
                  setParams((p) => ({ ...p, token0: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="token1">Token1 address</Label>
              <Input
                id="token1"
                placeholder="0x..."
                value={params.token1}
                onChange={(e) =>
                  setParams((p) => ({ ...p, token1: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="fee">Pool fee</Label>
              <Input
                id="fee"
                placeholder="e.g. 500"
                value={params.fee}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, fee: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tickSpacing">Tick spacing</Label>
              <Input
                id="tickSpacing"
                placeholder="e.g. 10"
                value={params.tickSpacing}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, tickSpacing: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sqrtP">Sqrt price (Q64.96)</Label>
              <Input
                id="sqrtP"
                placeholder="bigint string"
                value={params.sqrtP}
                onChange={(e) =>
                  setParams((p) => ({ ...p, sqrtP: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="tickLower">Tick lower</Label>
              <Input
                id="tickLower"
                placeholder="e.g. 66420"
                value={params.tickLower}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, tickLower: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tickUpper">Tick upper</Label>
              <Input
                id="tickUpper"
                placeholder="e.g. 68820"
                value={params.tickUpper}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, tickUpper: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slippage">Slippage (bps)</Label>
              <Input
                id="slippage"
                placeholder="e.g. 50 for 0.5%"
                value={params.slippage}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, slippage: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 max-md:gap-2">
            <div className="space-y-1">
              <Label htmlFor="tokensIn">Token in address</Label>
              <Input
                id="tokensIn"
                placeholder="0xEeee... for native"
                value={params.tokensIn}
                onChange={(e) =>
                  setParams((p) => ({ ...p, tokensIn: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountIn">Amount in (wei)</Label>
              <Input
                id="amountIn"
                placeholder="e.g. 1000000000000000000"
                value={params.amountIn}
                onChange={(e) =>
                  /^\d*$/.test(e.target.value) &&
                  setParams((p) => ({ ...p, amountIn: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-[#ffffff66]">Preview URL</Label>
            <div className="text-xs break-all p-2 rounded-md border border-[#27272a]">
              {buildUrl()}
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <SubmitButton
            disabled={isDisabled || loading}
            onClick={handleSubmit}
            text={
              <div className="flex items-center gap-2">
                Get route
                {loading && <Loading />}
              </div>
            }
          />
          {openModal && (
            <Modal
              className="max-w-[900px] max-h-[60vh] overflow-auto"
              onClose={() => setOpenModal(false)}
            >
              <div className="bg-[#111] p-4 rounded-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Route Preview</div>
                </div>

                {/* Error */}
                {response?.error && (
                  <div className="text-red-400 text-sm">{response.error}</div>
                )}

                {/* Summary */}
                {response?.data && (
                  <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div className="space-y-1">
                      <div className="text-xs text-[#ffffff66]">Router</div>
                      <div className="text-sm break-all">
                        {response.data.routerAddress}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">Gas</div>
                        <div className="text-sm">{response.data.gas}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Gas (USD)
                        </div>
                        <div className="text-sm">{response.data.gasUsd}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pool Details */}
                {response?.data?.poolDetails && (
                  <div className="space-y-2">
                    <div className="font-medium">Pool details</div>
                    <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">Category</div>
                        <div className="text-sm">
                          {response.data.poolDetails.category}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          New Liquidity
                        </div>
                        <div className="text-sm">
                          {response.data.poolDetails.newLiquidity}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Current Tick → New Tick
                        </div>
                        <div className="text-sm">
                          {response.data.poolDetails.uniswapV3?.tick} →{" "}
                          {response.data.poolDetails.uniswapV3?.newTick}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">SqrtP</div>
                        <div className="text-xs break-all">
                          {response.data.poolDetails.uniswapV3?.sqrtP}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          New SqrtP
                        </div>
                        <div className="text-xs break-all">
                          {response.data.poolDetails.uniswapV3?.newSqrtP}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Position Details */}
                {response?.data?.positionDetails && (
                  <div className="space-y-2">
                    <div className="font-medium">Position details</div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Added Liquidity
                        </div>
                        <div className="text-sm">
                          {response.data.positionDetails.addedLiquidity}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Added Amount (USD)
                        </div>
                        <div className="text-sm">
                          {response.data.positionDetails.addedAmountUsd}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zap Details */}
                {response?.data?.zapDetails && (
                  <div className="space-y-3">
                    <div className="font-medium">Zap details</div>
                    <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Initial (USD)
                        </div>
                        <div className="text-sm">
                          {response.data.zapDetails.initialAmountUsd}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Final (USD)
                        </div>
                        <div className="text-sm">
                          {response.data.zapDetails.finalAmountUsd}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Price Impact
                        </div>
                        <div className="text-sm">
                          {response.data.zapDetails.priceImpact}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[#ffffff66]">
                        Suggested Slippage (bps)
                      </div>
                      <div className="text-sm">
                        {response.data.zapDetails.suggestedSlippage}
                      </div>
                    </div>

                    {/* Actions */}
                    {Array.isArray(response.data.zapDetails.actions) && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Actions</div>
                        <div className="space-y-3">
                          {response.data.zapDetails.actions.map(
                            (action: any, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-md border border-[#27272a] p-3 space-y-2"
                              >
                                <div className="text-xs text-[#ffffff66]">
                                  {action.type}
                                </div>
                                {/* Protocol Fee */}
                                {action.protocolFee && (
                                  <div className="space-y-1">
                                    <div className="text-xs">
                                      Protocol fee (pcm):{" "}
                                      {action.protocolFee.pcm}
                                    </div>
                                    {Array.isArray(
                                      action.protocolFee.tokens
                                    ) && (
                                      <div className="space-y-1">
                                        {action.protocolFee.tokens.map(
                                          (t: any, i: number) => (
                                            <div
                                              key={i}
                                              className="text-xs grid grid-cols-3 gap-2 break-all"
                                            >
                                              <div>Token: {t.address}</div>
                                              <div>Amount: {t.amount}</div>
                                              <div>USD: {t.amountUsd}</div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* Aggregator Swap */}
                                {action.aggregatorSwap &&
                                  Array.isArray(
                                    action.aggregatorSwap.swaps
                                  ) && (
                                    <div className="space-y-1">
                                      {action.aggregatorSwap.swaps.map(
                                        (s: any, j: number) => (
                                          <div
                                            key={j}
                                            className="text-xs space-y-1"
                                          >
                                            <div className="grid grid-cols-2 gap-2 break-all">
                                              <div>
                                                <div className="text-[#ffffff66]">
                                                  Token In
                                                </div>
                                                <div>{s.tokenIn?.address}</div>
                                                <div>
                                                  Amount: {s.tokenIn?.amount}
                                                </div>
                                                <div>
                                                  USD: {s.tokenIn?.amountUsd}
                                                </div>
                                              </div>
                                              <div>
                                                <div className="text-[#ffffff66]">
                                                  Token Out
                                                </div>
                                                <div>{s.tokenOut?.address}</div>
                                                <div>
                                                  Amount: {s.tokenOut?.amount}
                                                </div>
                                                <div>
                                                  USD: {s.tokenOut?.amountUsd}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                {/* Add Liquidity */}
                                {action.addLiquidity && (
                                  <div className="space-y-1">
                                    <div className="text-xs">Add Liquidity</div>
                                    {Array.isArray(
                                      action.addLiquidity.tokens
                                    ) && (
                                      <div className="space-y-1">
                                        {action.addLiquidity.tokens.map(
                                          (t: any, k: number) => (
                                            <div
                                              key={k}
                                              className="text-xs grid grid-cols-3 gap-2 break-all"
                                            >
                                              <div>Token: {t.address}</div>
                                              <div>Amount: {t.amount}</div>
                                              <div>USD: {t.amountUsd}</div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* Refund */}
                                {action.refund &&
                                  Array.isArray(action.refund.tokens) && (
                                    <div className="space-y-1">
                                      <div className="text-xs">Refund</div>
                                      {action.refund.tokens.map(
                                        (t: any, m: number) => (
                                          <div
                                            key={m}
                                            className="text-xs grid grid-cols-3 gap-2 break-all"
                                          >
                                            <div>Token: {t.address}</div>
                                            <div>Amount: {t.amount}</div>
                                            <div>USD: {t.amountUsd}</div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Route & Meta */}
                {response?.data && (
                  <div className="space-y-2">
                    <div className="font-medium">Meta</div>
                    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Request ID
                        </div>
                        <div className="text-sm break-all">
                          {response.requestId}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-[#ffffff66]">
                          Route (encoded)
                        </div>
                        <div className="text-xs break-all max-h-[120px] overflow-auto border border-[#27272a] rounded p-2">
                          {response.data.route}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw JSON (collapsible) */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">
                    Show raw JSON
                  </summary>
                  <pre className="text-xs whitespace-pre-wrap break-all mt-2">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </details>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setOpenModal(false)}>
                    Close
                  </Button>
                  <Button
                    disabled={!address || confirming}
                    onClick={handleConfirm}
                    className="!bg-[#fafafa] !text-[#18181b] hover:opacity-95 rounded-[8px]"
                  >
                    <div className="flex items-center gap-2">
                      Confirm
                      {confirming && <Loading />}
                    </div>
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};

export default ZapCreatePool;
