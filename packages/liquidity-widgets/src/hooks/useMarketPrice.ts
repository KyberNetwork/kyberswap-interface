import { useWidgetContext } from "@/stores";
import { useTokenPrices } from "@kyber/hooks/use-token-prices";

export default function useMarketPrice(tokensAddress: string) {
  const chainId = useWidgetContext((s) => s.chainId);

  const { prices } = useTokenPrices({
    addresses: tokensAddress
      .split(",")
      .filter(Boolean)
      .map((item) => item.toLowerCase()),
    chainId,
  });

  return tokensAddress
    .split(",")
    .filter(Boolean)
    .map((item) => prices[item.toLowerCase()] || 0);
}
