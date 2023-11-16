import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useGetNftCollectionsQuery } from 'services/portfolio'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import { ReactComponent as NftIcon } from 'assets/svg/nft_icon.svg'
import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import Column from 'components/Column'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import SearchInput from 'components/SearchInput'
import { EMPTY_ARRAY } from 'constants/index'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import ListNft from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Nft/ListNft'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { NFTBalance } from 'pages/NotificationCenter/Portfolio/type'
import { Section } from 'pages/TrueSightV2/components'
import getShortenAddress from 'utils/getShortenAddress'

const CollectionWrapper = styled(Row)`
  background-color: ${({ theme }) => theme.buttonGray};
  border-radius: 16px;
  padding: 16px 20px;
  cursor: pointer;
`
const NftCollection = ({
  data: { collectionDetail, wallet, collectibleName, chainID, totalNFT, collectibleAddress },
  onSelect,
}: {
  data: NFTBalance
  onSelect: () => void
}) => {
  const theme = useTheme()
  return (
    <CollectionWrapper onClick={onSelect}>
      <TokenCellWithWalletAddress
        style={{ width: 'fit-content', flex: 1 }}
        item={{
          chainId: chainID,
          logoUrl: collectionDetail?.thumbnail || NFTLogoDefault,
          walletAddress: wallet,
          symbol: collectibleName || getShortenAddress(collectibleAddress),
        }}
        walletColor={theme.primary}
      />
      <RowFit>
        <Text fontSize={'14px'} color={theme.subText}>
          <Trans>Owned NFTs: {totalNFT}</Trans>
        </Text>
      </RowFit>
    </CollectionWrapper>
  )
}

// todo all tab search multi address
const pageSize = 10
export default function Nft({ walletAddresses, chainIds }: { walletAddresses: string[]; chainIds: ChainId[] }) {
  const [search, setSearch] = useState('')
  const searchDebounce = useDebounce(search, 500)
  const [currentNft, setCurrentNft] = useState<NFTBalance>()
  const [page, setPage] = useState(1)
  const { data, isFetching } = useGetNftCollectionsQuery(
    {
      addresses: walletAddresses,
      chainIds,
      page,
      pageSize,
      search: searchDebounce,
    },
    { skip: !walletAddresses?.length },
  )

  const theme = useTheme()
  const formatData = useMemo(() => {
    return data?.data || EMPTY_ARRAY
  }, [data])

  return (
    <Section
      style={{ minHeight: '300px' }}
      title={
        <RowFit gap="4px" color={theme.subText} alignItems={'center'}>
          <NftIcon style={{ width: 18, height: 18 }} />
          <Trans>NFT Collections</Trans>
        </RowFit>
      }
      actions={
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={t`Search by token symbol or token address`}
          style={{
            width: 330,
            height: 32,
            backgroundColor: theme.buttonBlack,
            border: `1px solid ${theme.buttonGray}`,
          }}
        />
      }
    >
      <Column gap="16px" style={{ padding: '0px 8px', flex: 1 }}>
        {isFetching ? (
          <LocalLoader />
        ) : currentNft ? (
          <ListNft nftCollection={currentNft} />
        ) : (
          <>
            {formatData.length ? (
              formatData.map(el => (
                <NftCollection data={el} key={el.collectibleAddress} onSelect={() => setCurrentNft(el)} />
              ))
            ) : (
              <Column
                justifyContent="center"
                alignItems={'center'}
                color={theme.subText}
                fontSize={'12px'}
                gap="8px"
                flex={1}
              >
                <NoDataIcon />
                <Text fontSize={'14px'}>
                  <Trans>No data found</Trans>
                </Text>
              </Column>
            )}
            <Pagination
              onPageChange={setPage}
              currentPage={page}
              pageSize={pageSize}
              totalCount={data?.totalData || 0}
            />
          </>
        )}
      </Column>
    </Section>
  )
}
