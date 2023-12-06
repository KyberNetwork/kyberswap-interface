import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Edit2, Plus, Trash } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import {
  useDeletePortfolioMutation,
  useGetWalletsPortfoliosQuery,
  useRemoveWalletFromPortfolioMutation,
  useUpdatePortfolioMutation,
} from 'services/portfolio'
import styled from 'styled-components'

import { ReactComponent as PortfolioIcon } from 'assets/svg/portfolio.svg'
import { NotificationType } from 'components/Announcement/type'
import { ButtonAction, ButtonLight, ButtonOutlined } from 'components/Button'
import Column from 'components/Column'
import { useShowConfirm } from 'components/ConfirmModal'
import Row, { RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import AddWalletPortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/AddWalletPortfolioModal'
import CreatePortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/CreatePortfolioModal'
import { useAddWalletToPortfolio, useNavigateToPortfolioDetail } from 'pages/NotificationCenter/Portfolio/helpers'
import { Portfolio, PortfolioWallet, PortfolioWalletPayload } from 'pages/NotificationCenter/Portfolio/type'
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
  ${({ theme }) => theme.mediaWidth.upToSmall`
    .skeleton {
      width: 100%;
    }
  `}
`
const defaultWalletWidth = '210px'
const WalletCard = styled.div`
  display: flex;
  border-radius: 16px;
  padding: 12px;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.background};
  display: flex;
  font-size: 14px;
  flex-basis: ${defaultWalletWidth};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-basis: 100%;
  `}
`
enum Actions {
  Edit,
  Delete,
  View,
}

const ActionButtons = ({ onDelete, onEdit }: { onDelete: () => void; onEdit: () => void }) => {
  const theme = useTheme()
  return (
    <Flex sx={{ gap: '4px', minWidth: 'unset' }}>
      <ButtonAction
        style={{ width: 28, minWidth: 28, height: 28, display: 'flex', justifyContent: 'center' }}
        onClick={onEdit}
      >
        <Edit2 size={16} color={theme.subText} />
      </ButtonAction>
      <ButtonAction
        style={{ width: 28, minWidth: 28, height: 28, display: 'flex', justifyContent: 'center' }}
        onClick={onDelete}
      >
        <Trash size={16} color={theme.subText} />
      </ButtonAction>
    </Flex>
  )
}

const WalletItem = ({
  onChangeWalletAction,
  data,
}: {
  onChangeWalletAction: (v: Actions, wallet: PortfolioWallet) => void
  data: PortfolioWallet
}) => {
  const { nickName, walletAddress } = data
  return (
    <WalletCard>
      <Row gap="6px" style={{ whiteSpace: 'nowrap' }}>
        {nickName ? shortString(nickName, 18) : getShortenAddress(walletAddress)}
      </Row>
      <ActionButtons
        onDelete={() => onChangeWalletAction(Actions.Delete, data)}
        onEdit={() => onChangeWalletAction(Actions.Edit, data)}
      />
    </WalletCard>
  )
}

const TitleGroup = styled(Row)`
  gap: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`

const ActionsGroup = styled(RowFit)`
  gap: 14px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
    width: 100%;
  `}
`

const PortfolioItem = ({ portfolio }: { portfolio: Portfolio }) => {
  const theme = useTheme()
  const { name, id }: Portfolio = portfolio
  const { data: wallets = [], isFetching: isLoadingWallets } = useGetWalletsPortfoliosQuery({ portfolioId: id })
  const { portfolioId, wallet } = useParsedQueryString<{ portfolioId: string; wallet: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (portfolioId === id) {
      searchParams.delete('portfolioId')
      setSearchParams(searchParams)
      showModalAddWalletPortfolio()
    }
  }, [portfolioId, id, searchParams, setSearchParams])

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
  const [removeWallet] = useRemoveWalletFromPortfolioMutation()
  const [updatePortfolio] = useUpdatePortfolioMutation()
  const showConfirm = useShowConfirm()
  const notify = useNotify()

  const onUpdatePortfolio = async ({ name }: { name: string }) => {
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

  const onDeleteWalletPortfolio = async (data: { walletAddress: string; portfolioId: string }) => {
    try {
      await removeWallet(data).unwrap()
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

  const _onAddUpdateWallet = useAddWalletToPortfolio()
  const onAddUpdateWallet = async (data: PortfolioWalletPayload) => {
    await _onAddUpdateWallet({ ...data, portfolioId: id })
    searchParams.delete('wallet')
    setSearchParams(searchParams)
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
        const { walletAddress } = wallet
        const shortWallet = getShortenAddress(walletAddress)
        showConfirm({
          isOpen: true,
          title: t`Delete Wallet`,
          confirmText: t`Delete`,
          cancelText: t`Cancel`,
          content: t`Do you want to delete wallet "${shortWallet}" from portfolio "${name}"?`,
          onConfirm: () => onDeleteWalletPortfolio({ walletAddress, portfolioId: id }),
        })
        break
      case Actions.Edit:
        showModalAddWalletPortfolio(wallet)
        break
    }
  }

  const canAddWallet = wallets.length < maximumWallet
  return (
    <Column gap="24px">
      <TitleGroup>
        <Row fontSize={20} fontWeight={'500'} color={theme.text} sx={{ flex: 1, wordBreak: 'break-all', gap: '14px' }}>
          {name}
          <ActionButtons
            onDelete={() => onChangePortfolioAction(Actions.Delete)}
            onEdit={() => onChangePortfolioAction(Actions.Edit)}
          />
        </Row>
        <ActionsGroup>
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
              <Plus size={16} />
              &nbsp;<Trans>Add Wallet</Trans>
            </ButtonLight>
          </MouseoverTooltip>
          <ButtonOutlined
            width={'120px'}
            height={'36px'}
            sx={{ whiteSpace: 'nowrap' }}
            onClick={() => navigate({ portfolioId: id })}
          >
            <PortfolioIcon />
            &nbsp;<Trans>Dashboard</Trans>
          </ButtonOutlined>
        </ActionsGroup>
      </TitleGroup>

      <Card>
        <Text color={theme.subText} fontSize={'14px'}>
          <Trans>
            Wallet Count:{' '}
            <Text as="span" color={canAddWallet ? theme.text : theme.warning}>
              {wallets.length}/{maximumWallet}
            </Text>
          </Trans>
        </Text>

        <Row gap="14px" flexWrap={'wrap'}>
          {isLoadingWallets ? (
            new Array(isMobile ? 1 : 3)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  containerClassName="skeleton"
                  key={i}
                  width={isMobile ? '100%' : defaultWalletWidth}
                  height="52px"
                  baseColor={theme.background}
                  highlightColor={theme.buttonGray}
                  borderRadius="1rem"
                />
              ))
          ) : wallets.length ? (
            wallets.map(wallet => (
              <WalletItem onChangeWalletAction={onChangeWalletAction} key={wallet.walletAddress} data={wallet} />
            ))
          ) : (
            <Row
              color={theme.subText}
              fontSize={'14px'}
              width={'100%'}
              justify={'center'}
              height={'52px'}
              alignItems={'center'}
              textAlign={'center'}
            >
              <Trans>You haven&apos;t added any wallets to your portfolio yet</Trans>
            </Row>
          )}
        </Row>
      </Card>

      <AddWalletPortfolioModal
        defaultWallet={wallet || undefined}
        isOpen={showModalWallet || !!editWallet}
        onDismiss={hideAddWalletModal}
        wallet={editWallet}
        onConfirm={onAddUpdateWallet}
      />
      <CreatePortfolioModal
        isOpen={showEditPortfolio}
        onDismiss={() => setShowEditPortfolio(false)}
        portfolio={portfolio}
        defaultName={portfolio.name}
        onConfirm={onUpdatePortfolio}
      />
    </Column>
  )
}

export default PortfolioItem
