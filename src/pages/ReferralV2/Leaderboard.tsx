import React, { useState, useMemo, useEffect } from 'react'
import { SectionWrapper, SectionTitle } from './styled'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Trans, t } from '@lingui/macro'
import Search from 'components/Search'
import useTheme from 'hooks/useTheme'
import GoldMedal from 'components/Icons/GoldMedal'
import SilverMedal from 'components/Icons/SilverMedal'
import BronzeMedal from 'components/Icons/BronzeMedal'
import { LeaderboardData } from 'hooks/useReferralV2'
import AnimateLoader from 'components/Loader/AnimatedLoader'
import { isAddressString, kncInUsdFormat } from 'utils'
import { useKNCPrice } from 'state/application/hooks'
import getShortenAddress from 'utils/getShortenAddress'
import useDebounce from 'hooks/useDebounce'
import { useMedia, useFirstMountState } from 'react-use'
import Pagination from 'components/Pagination'

const TableRowBase = styled.div`
  display: grid;
  grid-template-columns: 80px 7fr 4fr 120px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  height: 56px;
  & > div {
    padding: 5px 20px;
    line-height: 20px;
  }
  & > div:first-child {
    justify-self: center;
  }

  & > div:nth-child(2) {
    justify-self: start;
  }
  & > div:nth-child(3) {
    justify-self: start;
  }
  & > div:nth-child(4) {
    justify-self: end;
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 60px 7fr 4fr 80px;
    & > div{
      padding: 5px 10px;
    }
    & > div:nth-child(3) {
      justify-self: end;
    }
  `}
`

const LeaderboardWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding: 20px;
`
const TableHeader = styled(TableRowBase)`
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.tableHeader};
  font-size: 12px;
  text-transform: uppercase;
  height: 52px;
`
const TableRow = styled(TableRowBase)`
  font-size: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 12px;
  `}
`
const LeaderboardTable = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  & > *:nth-child(2):not(.loader) {
    background-image: linear-gradient(
      90deg,
      rgba(255, 204, 102, 0.25) 0%,
      rgba(255, 204, 102, 0) 54.69%,
      rgba(255, 204, 102, 0) 100%
    );
  }
  & > *:nth-child(3) {
    background-image: linear-gradient(
      90deg,
      rgba(224, 224, 224, 0.25) 0%,
      rgba(224, 224, 224, 0) 54.69%,
      rgba(224, 224, 224, 0) 100%
    );
  }
  & > *:nth-child(4) {
    background-image: linear-gradient(
      90deg,
      rgba(255, 152, 56, 0.25) 0%,
      rgba(255, 152, 56, 0) 54.69%,
      rgba(255, 152, 56, 0) 100%
    );
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0 -20px;
    width: auto;
    border-radius: 0;
  `}
`
// const PaginationWrapper = styled.div`
//   margin-top: 16px;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   gap: 4px;
//   & > div {
//     font-size: 12px;
//     width: 36px;
//     height: 36px;
//     border-radius: 36px;
//     background: ${({ theme }) => theme.buttonBlack};
//     opacity: 0.4;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     color: ${({ theme }) => theme.subText};
//     cursor: pointer;
//     transition: all 0.1s ease;
//   }
//   & > div:hover {
//     opacity: 0.8;
//   }
//   & > div.active {
//     opacity: 1;
//     color: ${({ theme }) => theme.primary};
//   }
// `

const TableRowRender = ({ referrer, number }: { referrer: LeaderboardData['referrers'][0]; number: number }) => {
  const kncPrice = useKNCPrice()
  const theme = useTheme()
  const { wallet, rankNo, totalEarning, numReferrals } = referrer
  const above768 = useMedia('(min-width: 768px)')
  const totalEarningUSD = kncInUsdFormat(totalEarning, kncPrice)
  const shortenAddress = useMemo(() => (wallet ? getShortenAddress(wallet, above768) : ''), [wallet, above768])
  const rankFormatted = useMemo(() => {
    switch (rankNo) {
      case 1:
        return <GoldMedal />
      case 2:
        return <SilverMedal />
      case 3:
        return <BronzeMedal />
      default:
        return <>{number}</>
    }
  }, [rankNo, number])

  return (
    <TableRow key={wallet}>
      <div>{rankFormatted}</div>
      <div>{shortenAddress}</div>
      <div>{numReferrals}</div>
      <Flex flexDirection={'column'} alignItems="end">
        <Text>{totalEarning} KNC</Text>
        <Text fontSize="12px" color={theme.border}>
          {totalEarningUSD}
        </Text>
      </Flex>
    </TableRow>
  )
}
export default function Leaderboard({
  leaderboardData,
  onChangePage,
  onSearchChange,
}: {
  leaderboardData?: LeaderboardData
  onChangePage?: (page: number) => void
  onSearchChange?: (wallet: string) => void
}) {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const loading = !leaderboardData
  const above768 = useMedia('(min-width: 768px)')
  const debouncedQuery = useDebounce(searchValue, 500)
  const firstMount = useFirstMountState()
  useEffect(() => {
    if (firstMount) return
    if (isAddressString(debouncedQuery) || debouncedQuery === '') {
      onSearchChange && onSearchChange(debouncedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])
  useEffect(() => {
    if (firstMount) return
    if (page && onChangePage) {
      onChangePage(page)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])
  return (
    <SectionWrapper>
      <SectionTitle>
        <Trans>Leaderboard</Trans>
      </SectionTitle>
      <LeaderboardWrapper>
        <Flex
          justifyContent={'flex-end'}
          alignItems="center"
          marginBottom="20px"
          flexDirection={above768 ? 'row' : 'column'}
        >
          <Search
            onSearch={setSearchValue}
            searchValue={searchValue}
            backgroundColor={theme.buttonBlack}
            color={theme.text}
            placeholderColor={theme.border}
            style={{ borderRadius: '20px', boxShadow: theme.boxShadow }}
            placeholder={t`Search by full wallet address`}
          />
        </Flex>
        <LeaderboardTable>
          <TableHeader>
            <div>
              <Trans>Rank</Trans>
            </div>
            <div>
              <Trans>Wallet</Trans>
            </div>
            <div>
              <Trans>Referrals</Trans>
            </div>
            <div>
              <Trans>Earnings</Trans>
            </div>
          </TableHeader>
          {leaderboardData?.referrers?.length === 0 && searchValue ? (
            <Flex className="loader" justifyContent={'center'} alignItems={'center'} height="60px">
              <Trans>Wallet address not found.</Trans>
            </Flex>
          ) : (
            leaderboardData?.referrers?.map((referrer, i) => <TableRowRender referrer={referrer} number={i + 1} />)
          )}
          {loading && (
            <Flex justifyContent="center" className="loader">
              <AnimateLoader />
            </Flex>
          )}
        </LeaderboardTable>
        <Pagination
          currentPage={page}
          pageSize={10}
          totalCount={leaderboardData ? leaderboardData.pagination.totalItems : 1}
          onPageChange={setPage}
        />
      </LeaderboardWrapper>
    </SectionWrapper>
  )
}
