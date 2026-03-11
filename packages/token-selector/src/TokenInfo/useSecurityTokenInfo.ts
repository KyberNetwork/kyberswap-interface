import { useCallback, useEffect, useMemo, useState } from "react";

import type { I18n } from "@lingui/core";

import { API_URLS, ChainId } from "@kyber/schema";

import { SecurityInfo, getSecurityTokenInfo } from "@/TokenInfo/utils";

interface UseSecurityTokenInfoParams {
  tokenAddress: string;
  chainId: ChainId;
  i18n: I18n;
}

export default function useSecurityTokenInfo({
  tokenAddress,
  chainId,
  i18n,
}: UseSecurityTokenInfoParams) {
  const [securityRawInfo, setSecurityRawInfo] = useState<SecurityInfo | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);

  const parsedSecurityInfo = useMemo(
    () => getSecurityTokenInfo(securityRawInfo, i18n),
    [securityRawInfo, i18n],
  );

  const handleFetchSecurityData = useCallback(() => {
    if (!tokenAddress) return;
    setLoading(true);
    fetch(
      `${API_URLS.GO_PLUS_API}/${chainId}?contract_addresses=${tokenAddress}`,
    )
      .then((res) => res.json())
      .then((data) => setSecurityRawInfo(data.result?.[tokenAddress]))
      .catch((e) => {
        console.log(e.message);
        setSecurityRawInfo(null);
      })
      .finally(() => setLoading(false));
  }, [tokenAddress, chainId]);

  useEffect(() => {
    handleFetchSecurityData();
  }, [handleFetchSecurityData]);

  return { securityInfo: parsedSecurityInfo, loading };
}
