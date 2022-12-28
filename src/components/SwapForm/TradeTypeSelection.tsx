import { Trans } from '@lingui/macro'
import { Text } from 'rebass/styled-components'
import styled from 'styled-components'

import { GasStation, MoneyFill } from 'components/Icons'
import { useActiveWeb3React } from 'hooks'

const GroupButtonReturnTypes = styled.div`
  display: flex;
  margin-top: 20px;
  border-radius: 999px;
  background: ${({ theme }) => theme.tabBackgound};
  padding: 2px;
`

export const ButtonReturnType = styled.div<{ active?: boolean }>`
  border-radius: 999px;
  flex: 1;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.tabActive : theme.tabBackgound)};
  color: ${({ theme, active }) => (active ? theme.text : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 300ms;
`

type Props = {
  saveGas: boolean
  chooseToSaveGas: (d: boolean) => void
}

const TradeTypeSelection: React.FC<Props> = ({ saveGas, chooseToSaveGas }) => {
  const { isSolana } = useActiveWeb3React()
  if (isSolana) return null

  return (
    <GroupButtonReturnTypes>
      <ButtonReturnType onClick={() => chooseToSaveGas(false)} active={!saveGas} role="button">
        <MoneyFill />
        <Text marginLeft="4px">
          <Trans>Maximum Return</Trans>
        </Text>
      </ButtonReturnType>
      <ButtonReturnType onClick={() => chooseToSaveGas(true)} active={saveGas} role="button">
        <GasStation />
        <Text marginLeft="4px">
          <Trans>Lowest Gas</Trans>
        </Text>
      </ButtonReturnType>
    </GroupButtonReturnTypes>
  )
}

export default TradeTypeSelection
