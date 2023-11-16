import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import NFTLogoDefault from 'assets/images/portfolio/nft_logo.png'
import { ReactComponent as NoDataIcon } from 'assets/svg/no-data.svg'
import Column from 'components/Column'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'
import { TokenCellWithWalletAddress } from 'pages/NotificationCenter/Portfolio/PortfolioDetail/Tokens/WalletInfo'
import { NFTBalance } from 'pages/NotificationCenter/Portfolio/type'
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

export default function ListCollection({
  data,
  page,
  pageSize,
  onPageChange,
  onSelect,
  totalItems,
}: {
  data: NFTBalance[]
  pageSize: number
  page: number
  totalItems: number
  onPageChange: (v: number) => void
  onSelect: (v: NFTBalance) => void
}) {
  const theme = useTheme()
  return (
    <>
      {data.length ? (
        data.map(el => <NftCollection data={el} key={el.collectibleAddress} onSelect={() => onSelect(el)} />)
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
      <Pagination onPageChange={onPageChange} currentPage={page} pageSize={pageSize} totalCount={totalItems} />
    </>
  )
}
