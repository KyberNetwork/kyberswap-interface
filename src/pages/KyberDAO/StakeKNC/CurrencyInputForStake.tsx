import { ChainId } from '@kyberswap/ks-sdk-core'
import { Text } from 'rebass'
import styled from 'styled-components'

import Wallet from 'components/Icons/Wallet'
import { AutoRow, RowBetween } from 'components/Row'
import { KNC_ADDRESS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { getTokenLogoURL } from 'utils'

import { CurrencyInput, KNCLogoWrapper, SmallButton } from './StakeKNCComponent'

const InnerCard = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  padding: 12px 16px;
  //width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.16));
`

export default function CurrencyInputForStake({ token }: { token?: string }) {
  const theme = useTheme()
  return (
    <InnerCard>
      <RowBetween>
        <AutoRow gap="2px">
          <SmallButton>Max</SmallButton>
          <SmallButton>Half</SmallButton>
        </AutoRow>
        <AutoRow gap="3px" justify="flex-end" color={theme.subText}>
          <Wallet /> <Text fontSize={12}>0</Text>
        </AutoRow>
      </RowBetween>
      <RowBetween>
        <CurrencyInput value={1} />
        <span style={{ color: theme.border, fontSize: '14px', marginRight: '6px' }}>~$1,344</span>
        <KNCLogoWrapper>
          <img src={`${getTokenLogoURL(KNC_ADDRESS, ChainId.MAINNET)}`} alt="knc-logo" width="24px" height="24px" />
          {token || 'KNC'}
        </KNCLogoWrapper>
      </RowBetween>
    </InnerCard>
  )
}
