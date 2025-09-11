import { GetRouteResponse } from '@/stores/useZapStateStore';
import { parseZapRoute } from '@/utils';

export default function useZapRoute(route?: GetRouteResponse) {
  const { addedLiquidity } = parseZapRoute(route);

  return {
    addedLiquidity,
  };
}
