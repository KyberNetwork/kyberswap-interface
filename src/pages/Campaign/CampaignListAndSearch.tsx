import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import Row from 'components/Row'
import Search from 'components/Search'
import { INPUT_DEBOUNCE_TIME } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useTheme from 'hooks/useTheme'
import { AppState } from 'state'
import { CampaignData, CampaignStatus } from 'state/campaigns/actions'

import CampaignItem, { getCampaignInfo } from './CampaignItem'

const CampaignListAndSearchContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  padding-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    background: ${({ theme }) => theme.tableHeader};
    border-radius: 0;
    flex: 1;
    height: unset;
  `};
`

const CampaignList = styled.div`
  flex: 1 1 0; // scroll
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex: 1;
    overflow-x: hidden;
  `}
  .scrollbar {
    &::-webkit-scrollbar {
      display: block;
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.disableText};
    }
    overflow-x: hidden !important;
  }
`

type CampaignListAndSearchProps = {
  onSelectCampaign: (campaign: CampaignData) => void
  loadMoreCampaign: () => void
  hasMoreCampaign: boolean
  onSearchCampaign: (v: string) => void
}

const CampaignListAndSearch = ({
  onSelectCampaign,
  loadMoreCampaign,
  hasMoreCampaign,
  onSearchCampaign,
}: CampaignListAndSearchProps) => {
  const [searchCampaign, setSearchCampaign] = useState('')
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const { data: campaigns, selectedCampaign, lastTimeRefreshData } = useSelector((state: AppState) => state.campaigns)

  const debounceSearch = useDebounce(searchCampaign, INPUT_DEBOUNCE_TIME)
  useEffect(() => {
    onSearchCampaign(debounceSearch)
  }, [debounceSearch, onSearchCampaign])

  const scroll = useRef<HTMLDivElement | null>(null)
  const onRefChange = useCallback((node: HTMLDivElement) => {
    scroll.current = node
    if (!node?.classList.contains('scrollbar')) {
      node?.classList.add('scrollbar')
    }
  }, [])

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = 0
  }, [account, debounceSearch])

  const isItemLoaded = (index: number) => !hasMoreCampaign || index < campaigns.length
  const itemCount = campaigns.length + Number(hasMoreCampaign)

  function getRowHeight(index: number) {
    const { showProgressBarNumberTrade, showProgressBarVolume } = getCampaignInfo(campaigns[index], account)
    const progressbarNum = +showProgressBarNumberTrade + +showProgressBarVolume
    return campaigns[index]?.status === CampaignStatus.ENDED ? 140 : 160 + progressbarNum * 24
  }

  return (
    <CampaignListAndSearchContainer key={lastTimeRefreshData}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '16px',
          padding: '0 20px',
        }}
      >
        <Text fontSize="20px" lineHeight="24px" fontWeight={500}>
          <Trans>Campaigns</Trans>
        </Text>
        <Search
          searchValue={searchCampaign}
          onSearch={(newSearchCampaign: string) => {
            setSearchCampaign(newSearchCampaign)
          }}
          style={{ background: theme.buttonBlack, width: '100%' }}
          placeholder={t`Search for campaign`}
        />
      </Flex>
      <CampaignList>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreCampaign}
              threshold={2}
            >
              {({ onItemsRendered, ref }) => (
                <VariableSizeList
                  outerRef={onRefChange}
                  height={height}
                  width={width}
                  itemCount={itemCount}
                  itemSize={getRowHeight}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {({ index, style }: { index: number; style: CSSProperties }) => {
                    const campaign = campaigns[index]
                    if (!campaign)
                      return (
                        <Row style={style} gap="6px" justify="center" color={theme.subText} fontSize={'12px'}>
                          <Trans>Loading Campaigns ...</Trans>
                        </Row>
                      )
                    return (
                      <CampaignItem
                        style={style}
                        campaign={campaign}
                        onSelectCampaign={onSelectCampaign}
                        key={index}
                        index={index}
                        isSelected={Boolean(selectedCampaign?.id === campaign.id)}
                      />
                    )
                  }}
                </VariableSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </CampaignList>
    </CampaignListAndSearchContainer>
  )
}

export default CampaignListAndSearch
