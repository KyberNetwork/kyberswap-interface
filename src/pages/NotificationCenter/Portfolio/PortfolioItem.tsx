import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Edit2, Eye, MoreHorizontal, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonAction, ButtonLight } from 'components/Button'
import Column from 'components/Column'
import Input from 'components/Input'
import Row from 'components/Row'
import Select from 'components/Select'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

const Card = styled.div`
  display: flex;
  border-radius: 16px;
  padding: 16px;
  gap: 16px;
  background-color: ${({ theme }) => theme.buttonBlack};
  display: flex;
  flex-direction: column;
`

const Active = styled.div`
  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  border: 2px solid ${({ theme }) => rgba(theme.primary, 0.5)};
  width: 10px;
  height: 10px;
`

const WalletCard = styled.div`
  display: flex;
  border-radius: 16px;
  padding: 12px;
  gap: 6px;
  min-width: 200px;
  align-items: center;
  background-color: ${({ theme }) => theme.buttonBlack};
  display: flex;
  font-size: 14px;
`
enum Actions {
  Edit,
  Delete,
  View,
}
const options = [
  {
    label: (
      <Row alignItems={'center'} gap="6px">
        <Edit2 size={13} />
        <Trans>Edit</Trans>
      </Row>
    ),
    value: Actions.Edit,
  },
  {
    label: (
      <Row alignItems={'center'} gap="6px">
        <Trash size={13} />
        <Trans>Delete</Trans>
      </Row>
    ),
    value: Actions.Delete,
  },
  {
    label: (
      <Row alignItems={'center'} gap="6px">
        <Eye size={13} />
        <Trans>View Detail</Trans>
      </Row>
    ),
    value: Actions.View,
  },
]
const WalletItem = ({ onChangeProfileAction }: { onChangeProfileAction: (v: Actions) => void }) => {
  const theme = useTheme()
  return (
    <WalletCard style={{ background: theme.background }}>
      <Row gap="6px">
        Main <Active />
      </Row>
      <Select
        onChange={onChangeProfileAction}
        menuStyle={{ width: 130 }}
        options={options}
        style={{ padding: 0, background: 'transparent' }}
        arrow={false}
        activeRender={() => <MoreHorizontal size={16} color={theme.subText} />}
      />
    </WalletCard>
  )
}

const PortfolioItem = ({ showModalAddWalletPortfolio }: { showModalAddWalletPortfolio: () => void }) => {
  const theme = useTheme()
  const navigate = useNavigate()

  const onChangeProfileAction = (val: Actions) => {
    switch (val) {
      case Actions.Delete:
        break
      case Actions.Edit:
        break
      case Actions.View:
        navigate(`${APP_PATHS.PORTFOLIO}/${'0x53beBc978F5AfC70aC3bFfaD7bbD88A351123723'}`)
        break
    }
  }
  return (
    <Column gap="24px">
      <Row gap="14px">
        <Input value={''} onChange={() => {}} style={{ height: '36px' }} />
        <ButtonLight
          width={'120px'}
          height={'36px'}
          sx={{ whiteSpace: 'nowrap' }}
          onClick={showModalAddWalletPortfolio}
        >
          <Trans>Add Wallet</Trans>
        </ButtonLight>

        <Select
          menuStyle={{ width: 130 }}
          options={options}
          style={{ padding: 0, background: 'transparent' }}
          arrow={false}
          onChange={onChangeProfileAction}
          activeRender={() => (
            <ButtonAction
              style={{
                border: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '36px',
                height: '36px',
              }}
            >
              <MoreHorizontal size={16} color={theme.subText} />
            </ButtonAction>
          )}
        />
      </Row>
      <Card>
        <Text color={theme.subText} fontSize={'14px'}>
          <Trans>
            Wallet Count:{' '}
            <Text as="span" color={theme.text}>
              {1}/{4}
            </Text>
          </Trans>
        </Text>
        <Row gap="14px">
          <WalletItem onChangeProfileAction={onChangeProfileAction} />
          <WalletItem onChangeProfileAction={onChangeProfileAction} />
        </Row>
      </Card>
    </Column>
  )
}

export default PortfolioItem
