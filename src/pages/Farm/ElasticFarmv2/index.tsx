import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Divider from 'components/Divider'
import Row, { RowBetween, RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

import FarmCard from './components/FarmCard'

const Wrapper = styled.div`
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.border};
  background-color: ${({ theme }) => theme.background};
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FarmsWrapper = styled(Row)`
  --items-in-row: 3;
  --gap: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap);
  & > * {
    width: calc(100% / var(--items-in-row) - (var(--items-in-row) - 1) * var(--gap) / var(--items-in-row));
  }
`

export default function ElasticFarmv2() {
  const theme = useTheme()
  return (
    <Wrapper>
      <RowBetween>
        <Text fontSize="16px" lineHeight="20px" color={theme.text}>
          <Trans>Elastic Farm V2</Trans>
        </Text>
        <RowFit>
          <ButtonPrimary height="36px">Approve</ButtonPrimary>
        </RowFit>
      </RowBetween>
      <Divider />
      <FarmsWrapper>
        <FarmCard />
      </FarmsWrapper>
    </Wrapper>
  )
}
