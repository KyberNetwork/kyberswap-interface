import React, { useState, useMemo } from 'react'
import { SectionWrapper, SectionTitle } from './styled'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import Search from 'components/Search'
import useTheme from 'hooks/useTheme'
import GoldMedal from 'components/Icons/GoldMedal'
import SilverMedal from 'components/Icons/SilverMedal'
import BronzeMedal from 'components/Icons/BronzeMedal'
import { ChevronLeft, ChevronRight, Clock } from 'react-feather'
const TableRowBase = styled.div`
  display: grid;
  grid-template-columns: 80px 7fr 4fr 120px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.stroke};
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
`
const LeaderboardTable = styled.div`
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  & > *:nth-child(2) {
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
`
const CountDown = styled.span`
  background: ${({ theme }) => theme.buttonBlack};
  box-shadow: ${({ theme }) => theme.boxShadow};
  padding: 4px 6px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 3px;
`
const PaginationWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  & > div {
    font-size: 12px;
    width: 36px;
    height: 36px;
    border-radius: 36px;
    background: ${({ theme }) => theme.buttonBlack};
    opacity: 0.4;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${({ theme }) => theme.subText};
    cursor: pointer;
    transition: all 0.1s ease;
  }
  & > div:hover {
    opacity: 0.8;
  }
  & > div.active {
    opacity: 1;
    color: ${({ theme }) => theme.primary};
  }
`

const Pagination = ({
  currentPage,
  pageList,
  onPageClick,
  onPrevPageClick,
  onNextPageClick,
}: {
  currentPage: number
  pageList: number[]
  onPageClick: (value: number) => void
  onPrevPageClick: () => void
  onNextPageClick: () => void
}) => {
  const count = pageList.length
  const parsedPageList = useMemo(() => {
    let newList = []
    if (currentPage - 1 < 4) {
      newList.push(1, 2, 3, 4, 5, '...', count)
    } else if (count - currentPage < 4) {
      newList.push(1, '...', count - 4, count - 3, count - 2, count - 1, count)
    } else {
      newList.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', count)
    }

    return newList
  }, [currentPage, pageList])

  return (
    <PaginationWrapper>
      {count > 7 && (
        <div onClick={onPrevPageClick}>
          <ChevronLeft size={16} />
        </div>
      )}
      {parsedPageList.map((value, index) => {
        return (
          <div
            className={value === currentPage ? 'active' : undefined}
            onClick={() => {
              if (typeof value === 'number') {
                onPageClick(value)
              }
            }}
          >
            {value}
          </div>
        )
      })}
      {count > 7 && (
        <div onClick={onNextPageClick}>
          <ChevronRight size={16} />
        </div>
      )}
    </PaginationWrapper>
  )
}

export default function Leaderboard() {
  const theme = useTheme()
  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)

  const renderRow = (number: number) => {
    let numberFormatted = <></>
    switch (number) {
      case 1:
        numberFormatted = <GoldMedal />
        break
      case 2:
        numberFormatted = <SilverMedal />
        break
      case 3:
        numberFormatted = <BronzeMedal />
        break
      default:
        numberFormatted = <>{number}</>
    }
    return (
      <TableRow>
        <div>{numberFormatted}</div>
        <div>0x9E6Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx3651</div>
        <div>3,000,000</div>
        <Flex flexDirection={'column'} alignItems="end">
          <Text>4000 KNC</Text>
          <Text fontSize="12px" color={theme.stroke}>
            $1,425.23
          </Text>
        </Flex>
      </TableRow>
    )
  }
  return (
    <SectionWrapper>
      <SectionTitle>
        <Trans>Leaderboard</Trans>
      </SectionTitle>
      <LeaderboardWrapper>
        <Flex justifyContent={'space-between'} alignItems="center" marginBottom="20px">
          <Flex alignItems="center" fontSize={12} color={theme.stroke}>
            <Text>Leaderboard refresh in </Text>
            <CountDown>
              <Clock size={14} /> {` 04:39`}
            </CountDown>
          </Flex>
          <Search
            onSearch={value => {
              setSearchValue(value)
            }}
            searchValue={searchValue}
            backgroundColor={theme.buttonBlack}
            color={theme.text}
            placeholderColor={theme.stroke}
            style={{ borderRadius: '20px', boxShadow: theme.boxShadow }}
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
          {[...Array(10)].map((x, i) => renderRow(i + 1))}
        </LeaderboardTable>
        <Pagination
          currentPage={page}
          pageList={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
          onPageClick={(value: number) => setPage(value)}
          onPrevPageClick={() => setPage(prev => prev - 1 || 1)}
          onNextPageClick={() => setPage(prev => (prev + 1 > 10 ? 10 : prev + 1))}
        />
      </LeaderboardWrapper>
    </SectionWrapper>
  )
}
