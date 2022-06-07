import React, { useState } from 'react'
import { Text } from 'rebass'
import { t, Trans } from '@lingui/macro'

import Search from 'components/Search'
import { CampaignData, CampaignStatus } from 'state/campaigns/actions'
import styled, { css } from 'styled-components'
import { darken, rgba } from 'polished'
import useTheme from 'hooks/useTheme'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { SelectedHighlight } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'

export default function CampaignListAndSearch({
  onSelectCampaign,
}: {
  onSelectCampaign: (campaign: CampaignData) => void
}) {
  const [searchCampaign, setSearchCampaign] = useState('')
  const theme = useTheme()

  const campaigns = useSelector((state: AppState) => state.campaigns.data)
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)

  const filteredCampaigns = campaigns.filter(item =>
    item.name.toLowerCase().includes(searchCampaign.trim().toLowerCase()),
  )

  return (
    <CampaignListAndSearchContainer>
      <Text fontSize="20px" lineHeight="24px" fontWeight={500}>
        <Trans>Campaigns</Trans>
      </Text>
      <Search
        searchValue={searchCampaign}
        onSearch={(newSearchCampaign: string) => setSearchCampaign(newSearchCampaign)}
        style={{ background: theme.buttonBlack, borderRadius: '4px', width: '100%' }}
        placeholder={t`Search for campaign`}
      />
      <CampaignList>
        {filteredCampaigns.map((campaign, index) => {
          const isSelected = selectedCampaign && selectedCampaign.id === campaign.id
          return (
            <CampaignItem key={index} onClick={() => onSelectCampaign(campaign)}>
              <Text fontWeight={500} color={isSelected ? theme.primary : theme.text}>
                {campaign.name}
              </Text>
              <CampaignStatusText status={campaign.status}>{campaign.status}</CampaignStatusText>
              {isSelected && <SelectedHighlight />}
            </CampaignItem>
          )
        })}
      </CampaignList>
    </CampaignListAndSearchContainer>
  )
}

const CampaignListAndSearchContainer = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  padding: 24px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
`

const CampaignList = styled.div`
  flex: 1;
  overflow-y: auto;
  width: calc(100% + 40px);
  margin: 0 -20px;
  border-top: 1px solid ${({ theme }) => theme.border};

  &::-webkit-scrollbar {
    display: block;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
  }
`

const CampaignItem = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 20px;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  position: relative;

  &:hover {
    background: ${({ theme }) => darken(0.03, theme.background)} !important;
  }
`

const CampaignStatusText = styled.div<{ status: CampaignStatus }>`
  font-size: 12px;
  line-height: 10px;
  padding: 5px 8px;
  min-width: 76px;
  text-align: center;
  height: fit-content;
  border-radius: 24px;

  ${({ theme, status }) =>
    status === 'Upcoming' &&
    css`
      background: ${rgba(theme.warning, 0.2)};
      color: ${theme.warning};
    `}

  ${({ theme, status }) =>
    status === 'Ongoing' &&
    css`
      background: ${rgba(theme.primary, 0.2)};
      color: ${theme.primary};
    `}

  ${({ theme, status }) =>
    status === 'Ended' &&
    css`
      background: ${rgba(theme.red, 0.2)};
      color: ${theme.red};
    `}
`
