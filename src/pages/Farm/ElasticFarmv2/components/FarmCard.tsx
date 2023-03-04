import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import CopyHelper from 'components/Copy'
import Divider from 'components/Divider'
import Harvest from 'components/Icons/Harvest'
import { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.buttonBlack};
  border-radius: 24px;
  padding: 16px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const TextButton = styled.div`
  height: 50px;
  width: 100px;
  background-color: color-mix(in srgb, #34c9eb 20%, white);
`

export default function FarmCard() {
  const theme = useTheme()
  return (
    <Wrapper>
      <RowBetween>
        <RowFit>
          <Text fontSize="16px" lineHeight="20px" color={theme.primary}>
            MATIC - ETH
          </Text>
        </RowFit>
        <RowFit>
          <CopyHelper toCopy="test" />
        </RowFit>
      </RowBetween>
      <RowBetween>
        <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
          <Trans>Current phase will end in</Trans>
        </Text>
        <Text fontSize="12px" lineHeight="16px" color={theme.text}>
          <Trans>17D 3H 40M</Trans>
        </Text>
      </RowBetween>
      <RowBetween>
        <Column style={{ width: 'fit-content' }}>
          <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
            <Trans>Rewards</Trans>
          </Text>
          <Text>
            <Trans>MATIC | KNC</Trans>
          </Text>
        </Column>
        <ButtonPrimary width="fit-content" disabled>
          <RowFit gap="4px">
            <Harvest />
            <Text>Harvest</Text>
          </RowFit>
        </ButtonPrimary>
      </RowBetween>
      <Divider />
      <Column gap="16px" style={{ borderRadius: '12px', border: `1px solid ${theme.border}`, padding: '12px' }}>
        <RowBetween>
          <Column gap="4px">
            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
              <Trans>Avg APR</Trans>
            </Text>
            <Text fontSize="28px" lineHeight="32px" color={theme.primary}>
              132.23%
            </Text>
          </Column>
          <Column gap="4px">
            <Text fontSize="12px" lineHeight="16px" color={theme.primary}>
              <Trans>Active Range</Trans>
            </Text>
          </Column>
        </RowBetween>
        <RowBetween>
          <Column gap="4px">
            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
              <Trans>Staked TVL</Trans>
            </Text>
            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
              $12.54M
            </Text>
          </Column>
          <Column gap="4px" style={{ alignItems: 'flex-end' }}>
            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
              <Trans>My Deposit</Trans>
            </Text>
            <Text fontSize="12px" lineHeight="16px" color={theme.text}>
              $230.23K
            </Text>
          </Column>
        </RowBetween>
        <Divider />
        <ButtonPrimary disabled>+ Stake</ButtonPrimary>
      </Column>
      <RowBetween>
        <TextButton />
      </RowBetween>
    </Wrapper>
  )
}
