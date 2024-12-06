import { useWidgetContext } from "@/stores/widget";
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
  return Object.keys(prices).map((key) => {
    return prices[key.toLowerCase()] || 0;
  });
}
