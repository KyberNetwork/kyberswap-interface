import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'

import Bronze from 'assets/svg/bronze_icon.svg'
import Gold from 'assets/svg/gold_icon.svg'
import Medal from 'assets/svg/medal_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Pagination from 'components/Pagination'
import useTheme from 'hooks/useTheme'
import { ProjectRanking } from 'types/grantProgram'

import { ITEMS_PER_PAGE, RankByConfig } from '.'
import ExpandedRankingSection from './ExpandedSection'
import { Cell, HeaderCell, MedalImg, Row, StyledLogo, Table, TableHeader } from './styleds'

const getBackgroundByRank = (rank: number): string | undefined => {
  const bgByRank: Record<number, string> = {
    1: `linear-gradient(90deg, rgba(255, 204, 102, 0.25) 0%, rgba(255, 204, 102, 0) 54.69%, rgba(255, 204, 102, 0) 100%)`,
    2: `linear-gradient(90deg, rgba(224, 224, 224, 0.25) 0%, rgba(224, 224, 224, 0) 54.69%, rgba(224, 224, 224, 0) 100%)`,
    3: `linear-gradient(90deg, rgba(255, 152, 56, 0.25) 0%, rgba(255, 152, 56, 0) 54.69%, rgba(255, 152, 56, 0) 100%)`,
  }

  return bgByRank[rank]
}

const CustomPagination = styled(Pagination)`
  padding: 0 16px;
`

type Props = {
  page: number
  setPage: (p: number) => void
  totalRankings: number
  rankings: ProjectRanking[]
  rankByConfig: RankByConfig
}

const LeaderBoard: React.FC<Props> = ({ rankings, rankByConfig, page, setPage, totalRankings }) => {
  const theme = useTheme()
  const [expandedIndex, setExpandedIndex] = useState<number>()
  const renderTableContent = () => {
    return rankings.slice(0, ITEMS_PER_PAGE).map((data, index) => {
      const background = getBackgroundByRank(data.rankNo)
      return (
        <React.Fragment key={index}>
          <Row
            $background={background}
            role="button"
            onClick={() => {
              if (expandedIndex === index) {
                setExpandedIndex(undefined)
              } else {
                setExpandedIndex(index)
              }
            }}
          >
            <Cell textAlign="center">
              {data.rankNo === 1 ? (
                <MedalImg src={Gold} />
              ) : data.rankNo === 2 ? (
                <MedalImg src={Silver} />
              ) : data.rankNo === 3 ? (
                <MedalImg src={Bronze} />
              ) : data.rankNo === 4 ? (
                <MedalImg src={Medal} />
              ) : data.rankNo === 5 ? (
                <MedalImg src={Medal} />
              ) : (
                data.rankNo
              )}
            </Cell>
            <Cell>
              <Flex
                alignItems="center"
                sx={{
                  gap: '4px',
                }}
              >
                <Box
                  sx={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '999px',
                    backgroundColor: '#CE4412',
                    overflow: 'hidden',
                  }}
                >
                  <StyledLogo src={data.logoUrl} />
                </Box>
                <span>{data.name}</span>
              </Flex>
            </Cell>
            <Cell textAlign="right">{rankByConfig.extracter(data)}</Cell>

            <Cell textAlign="center">
              <Flex
                sx={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  transition: 'all 150ms linear',
                  transform: expandedIndex === index ? 'rotate(180deg)' : undefined,
                }}
              >
                <ChevronDown size="20" color={theme.text} />
              </Flex>
            </Cell>
          </Row>
          {expandedIndex === index && (
            <ExpandedRankingSection
              background={background}
              name={data.name}
              description={data.description}
              campaigns={data.campaigns}
            />
          )}
        </React.Fragment>
      )
    })
  }

  const renderEmptyRows = () => {
    return Array(Math.max(ITEMS_PER_PAGE - rankings.length, 0))
      .fill(0)
      .map((_, i) => {
        return <Row key={i} />
      })
  }

  useEffect(() => {
    setExpandedIndex(undefined)
  }, [page, rankByConfig])

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        gap: '8px',
        paddingBottom: '8px',
      }}
    >
      <Table>
        <TableHeader>
          <HeaderCell textAlign="center">
            <Trans>Rank</Trans>
          </HeaderCell>
          <HeaderCell>
            <Trans>Projects</Trans>
          </HeaderCell>
          <HeaderCell textAlign="right">{rankByConfig.title}</HeaderCell>
          <HeaderCell textAlign="center" />
        </TableHeader>
        {renderTableContent()}
        {renderEmptyRows()}
      </Table>

      <CustomPagination
        onPageChange={setPage}
        totalCount={totalRankings}
        currentPage={page}
        pageSize={ITEMS_PER_PAGE}
        haveBg={false}
      />
    </Flex>
  )
}

export default LeaderBoard
