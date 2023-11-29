import { Trans } from '@lingui/macro'
import { Flex } from 'rebass'
import styled from 'styled-components'

export const HeaderWrapper = styled.div(({ theme }) => ({
  background: theme.tableHeader,
  display: 'grid',
  padding: '1rem 1.5rem',
  gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1fr 1.5fr',
  gap: '8px',
  alignItems: 'center',
}))

const HeaderItem = styled(Flex)(({ theme }) => ({
  color: theme.subText,
  fontWeight: '500',
  fontSize: '12px',
  textTransform: 'uppercase',
}))

export default function FarmTableHeader() {
  return (
    <HeaderWrapper>
      <HeaderItem>
        <Trans>Token Pair</Trans>
      </HeaderItem>
      <HeaderItem justifyContent="flex-end">
        <Trans>Staked TVL</Trans>
      </HeaderItem>
      <HeaderItem justifyContent="flex-end">
        <Trans>APR</Trans>
      </HeaderItem>
      <HeaderItem justifyContent="flex-end">
        <Trans>Ending In</Trans>
      </HeaderItem>

      <HeaderItem justifyContent="flex-end">
        <Trans>My Staked Liquidity</Trans>
      </HeaderItem>
      <HeaderItem justifyContent="flex-end">
        <Trans>My Rewards</Trans>
      </HeaderItem>
      <HeaderItem justifyContent="flex-end">
        <Trans>Action</Trans>
      </HeaderItem>
    </HeaderWrapper>
  )
}
