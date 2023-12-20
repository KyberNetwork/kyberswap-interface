import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import useParsedQueryString from 'hooks/useParsedQueryString'
import { BreadcrumbItem } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/Breadcrumb'
import { NFTTokenDetail } from 'pages/NotificationCenter/Portfolio/type'

const useGetNftBreadcrumbData = ({ nftDetail }: { nftDetail?: NFTTokenDetail }) => {
  const { colId = '', colName, nftId = '' } = useParsedQueryString<{ nftId: string; colId: string; chainId: string }>()
  const [params, setParams] = useSearchParams()

  const itemsBreadcrumb = useMemo(() => {
    if (!colId) return []
    return [
      {
        title: t`NFTs`,
        onClick: () => {
          setParams(new URLSearchParams())
        },
      },
      (nftDetail || colName) && colId
        ? {
            title: nftDetail?.collectibleName || colName,
            onClick: () => {
              params.delete('nftId')
              setParams(params)
            },
          }
        : null,
      nftDetail && nftId ? { title: nftDetail?.item?.externalData?.name || t`Unknown` } : null,
    ].filter(Boolean) as BreadcrumbItem[]
  }, [nftDetail, setParams, colId, params, nftId, colName])

  return itemsBreadcrumb
}
export default useGetNftBreadcrumbData
