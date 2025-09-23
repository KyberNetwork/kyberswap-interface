import { API_URLS, CHAIN_ID_TO_CHAIN, ChainId } from '@kyber/schema';

export interface BuildRouteData {
  callData: string;
  routerAddress: string;
  value: string;
}

export const buildRouteData = async ({
  sender,
  route,
  source,
  referral,
  chainId,
  deadline,
}: {
  sender: string;
  route: string;
  source: string;
  referral?: string;
  chainId: ChainId;
  deadline: number;
}): Promise<BuildRouteData | null> => {
  const buildData = await fetch(`${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/migrate/route/build`, {
    method: 'POST',
    body: JSON.stringify({
      sender,
      route,
      burnNft: false,
      source,
      referral,
      deadline,
    }),
  })
    .then(res => res.json())
    .then(async res => {
      const { data } = res || {};
      return data;
    });

  return buildData;
};
