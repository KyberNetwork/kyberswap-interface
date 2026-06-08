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
  permits,
}: {
  sender: string;
  route: string;
  source: string;
  referral?: string;
  chainId: ChainId;
  deadline: number;
  permits?: {
    [key: string]: string;
  };
}): Promise<BuildRouteData> => {
  const url = `${API_URLS.ZAP_API}/${CHAIN_ID_TO_CHAIN[chainId]}/api/v1/migrate/route/build`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        sender,
        route,
        burnNft: false,
        source,
        referral,
        deadline,
        permits,
      }),
    });
  } catch (e) {
    throw new Error(`Build route step: network error calling build API — ${(e as Error).message || 'unknown error'}`);
  }

  let body: { data?: BuildRouteData; message?: string; error?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    // Swallow — handled below based on HTTP status.
  }

  if (!res.ok) {
    const apiMsg = body?.message || body?.error;
    throw new Error(
      `Build route step: build API returned HTTP ${res.status} ${res.statusText}${apiMsg ? ` — ${apiMsg}` : ''}`,
    );
  }

  if (!body?.data) {
    const apiMsg = body?.message || body?.error;
    throw new Error(`Build route step: build API returned no data${apiMsg ? ` — ${apiMsg}` : ''}`);
  }

  return body.data;
};
