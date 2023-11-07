import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useCallback, useState } from 'react'
import { Edit2, Eye, MoreHorizontal, Trash } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useAddWalletToPortfolioMutation,
  useDeletePortfolioMutation,
  useUpdatePortfolioMutation,
} from 'services/portfolio'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonAction, ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { useShowConfirm } from 'components/ConfirmModal'
import Input from 'components/Input'
import Row from 'components/Row'
import Select from 'components/Select'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'
import AddWalletPortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/AddWalletPortfolioModal'
import CreatePortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/CreatePortfolioModal'
import { Portfolio, PortfolioWallet } from 'pages/NotificationCenter/Portfolio/type'
import { useNotify } from 'state/application/hooks'
import getShortenAddress from 'utils/getShortenAddress'
import { shortString } from 'utils/string'

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
  min-width: 10px;
  height: 10px;
`

const WalletCard = styled.div`
  display: flex;
  border-radius: 16px;
  padding: 12px;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
  background-color: ${({ theme }) => theme.buttonBlack};
  display: flex;
  font-size: 14px;
  flex: 1;
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
const WalletItem = ({
  onChangeWalletAction,
  data,
}: {
  onChangeWalletAction: (v: Actions, wallet: PortfolioWallet) => void
  data: PortfolioWallet
}) => {
  const { nickName } = data
  const theme = useTheme()
  return (
    <WalletCard style={{ background: theme.background }}>
      <Row gap="6px" style={{ whiteSpace: 'nowrap' }}>
        {shortString(nickName, 18)} <Active />
      </Row>
      <Select
        onChange={v => onChangeWalletAction(v, data)}
        menuStyle={{ width: 130 }}
        options={options}
        style={{ padding: 0, background: 'transparent' }}
        arrow={false}
        activeRender={() => <MoreHorizontal size={16} color={theme.subText} />}
      />
    </WalletCard>
  )
}

export const useNavigateToPortfolioDetail = () => {
  const navigate = useNavigate()
  return useCallback(
    ({ wallet, portfolioId }: { wallet?: string; portfolioId?: number }) => {
      navigate(
        portfolioId
          ? `${APP_PATHS.PORTFOLIO}/${portfolioId}${wallet ? `?wallet=${wallet}` : ''}`
          : `${APP_PATHS.PROFILE}/${wallet}`,
      )
    },
    [navigate],
  )
}
const PortfolioItem = ({ portfolio }: { portfolio: Portfolio }) => {
  const theme = useTheme()
  const { wallets = [], name, id }: Portfolio = portfolio
  const maximumWallet = 4

  const [editWallet, setEditWallet] = useState<PortfolioWallet>()
  const [showModalWallet, setShowModalWallet] = useState(false)
  const [showEditPortfolio, setShowEditPortfolio] = useState(false)

  const showModalAddWalletPortfolio = (wallet?: PortfolioWallet) => {
    setEditWallet(wallet)
    setShowModalWallet(true)
  }
  const hideAddWalletModal = () => {
    setShowModalWallet(false)
    setEditWallet(undefined)
  }

  const [deletePortfolio] = useDeletePortfolioMutation()
  const [addWallet] = useAddWalletToPortfolioMutation()
  const [updatePortfolio] = useUpdatePortfolioMutation()
  const showConfirm = useShowConfirm()
  const notify = useNotify()

  const savePortfolio = async ({ name }: { name: string }) => {
    try {
      await updatePortfolio({ name, id }).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio updated`,
        summary: t`Your portfolio have been successfully updated`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio update failed`,
        summary: t`Failed to update your portfolio, please try again.`,
      })
    }
  }

  const onAddWallet = async (data: { walletAddress: string; nickName: string }) => {
    try {
      await addWallet({ portfolioId: id, ...data }).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio updated`,
        summary: t`Your portfolio has been successfully updated`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio update failed`,
        summary: t`Failed to update your portfolio, please try again.`,
      })
    }
  }

  const onDeletePortfolio = async () => {
    try {
      await deletePortfolio(id).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio deleted`,
        summary: t`Your portfolio have been successfully deleted`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio failed`,
        summary: t`Failed to delete your portfolio, please try again.`,
      })
    }
  }
  const navigate = useNavigateToPortfolioDetail()
  const onChangePortfolioAction = (val: Actions) => {
    switch (val) {
      case Actions.Delete:
        showConfirm({
          isOpen: true,
          title: t`Delete Portfolio`,
          confirmText: t`Delete`,
          cancelText: t`Cancel`,
          content: t`Do you want to delete portfolio "${name}"?`,
          onConfirm: onDeletePortfolio,
        })
        break
      case Actions.Edit:
        setShowEditPortfolio(true)
        break
      case Actions.View:
        navigate({ portfolioId: id })
        break
    }
  }

  const onChangeWalletAction = (val: Actions, wallet: PortfolioWallet) => {
    switch (val) {
      case Actions.Delete:
        showConfirm({
          isOpen: true,
          title: t`Delete Wallet`,
          confirmText: t`Delete`,
          cancelText: t`Cancel`,
          content: t`Do you want to delete wallet "${getShortenAddress(
            wallet.walletAddress,
          )}" from portfolio "${name}"?`,
          onConfirm: () => {},
        })
        break
      case Actions.Edit:
        showModalAddWalletPortfolio(wallet)
        break
      case Actions.View:
        navigate({ portfolioId: id, wallet: wallet.walletAddress })
        break
    }
  }

  const canAddWallet = wallets.length < maximumWallet
  return (
    <Column gap="24px">
      <Row gap="14px">
        <Input value={name} disabled style={{ height: '36px' }} />
        <MouseoverTooltip
          placement="top"
          text={!canAddWallet ? t`You had added the maximum number of wallet into a portfolio` : ''}
        >
          <ButtonLight
            width={'120px'}
            height={'36px'}
            sx={{ whiteSpace: 'nowrap' }}
            disabled={!canAddWallet}
            onClick={canAddWallet ? () => showModalAddWalletPortfolio() : undefined}
          >
            <Trans>Add Wallet</Trans>
          </ButtonLight>
        </MouseoverTooltip>

        <Select
          menuStyle={{ width: 130 }}
          options={options}
          style={{ padding: 0, background: 'transparent' }}
          arrow={false}
          onChange={onChangePortfolioAction}
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

      {wallets.length > 0 && (
        <Card>
          <Text color={theme.subText} fontSize={'14px'}>
            <Trans>
              Wallet Count:{' '}
              <Text as="span" color={canAddWallet ? theme.text : theme.warning}>
                {wallets.length}/{maximumWallet}
              </Text>
            </Trans>
          </Text>

          <Row gap="14px">
            {wallets.map(wallet => (
              <WalletItem onChangeWalletAction={onChangeWalletAction} key={wallet.walletAddress} data={wallet} />
            ))}
          </Row>
        </Card>
      )}
      <AddWalletPortfolioModal
        isOpen={showModalWallet || !!editWallet}
        onDismiss={hideAddWalletModal}
        wallet={editWallet}
        onConfirm={onAddWallet}
      />
      <CreatePortfolioModal
        isOpen={showEditPortfolio}
        onDismiss={() => setShowEditPortfolio(false)}
        portfolio={portfolio}
        onConfirm={savePortfolio}
      />
    </Column>
  )
}

export default PortfolioItem
