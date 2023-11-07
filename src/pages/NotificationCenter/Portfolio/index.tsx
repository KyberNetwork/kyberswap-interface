import { Trans, t } from '@lingui/macro'
import { Fragment, useState } from 'react'
import { Plus, Save, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useCreatePortfolioMutation, useGetPortfoliosQuery } from 'services/portfolio'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Row, { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { Tabs } from 'components/WalletPopup/Transactions/Tab'
import { APP_PATHS, EMPTY_ARRAY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import CreatePortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/CreatePortfolioModal'
import PortfolioItem from 'pages/NotificationCenter/Portfolio/PortfolioItem'
import { ButtonCancel, ButtonSave } from 'pages/NotificationCenter/Portfolio/buttons'
import { Portfolio } from 'pages/NotificationCenter/Portfolio/type'
import WarningSignMessage from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { PROFILE_MANAGE_ROUTES } from 'pages/NotificationCenter/const'
import { useNotify } from 'state/application/hooks'

const ActionsWrapper = styled.div`
  display: flex;
  gap: 20px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: space-between;
    gap: 12px;
  `}
`
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 24px;
  padding-bottom: 16px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0;
    padding-bottom: 16px;
  `}
`

const Header = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;
  cursor: pointer;

  transform: translateX(-4px);
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`

const Divider = styled.div`
  font-size: 12px;
  line-height: 16px;
  color: ${({ theme }) => theme.subText};
  border-top: 1px solid ${({ theme }) => theme.border};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`
const THRESHOLD_OPTIONS = [1, 10, 100].map(el => ({ value: el + '', title: `< ${el}` }))

const maximumPortfolio = 2

export default function PortfolioSetting() {
  const [showCreate, setShowCreate] = useState(false)
  const { data } = useGetPortfoliosQuery()
  const portfolios: Portfolio[] = data || EMPTY_ARRAY

  const showModalCreatePortfolio = () => {
    setShowCreate(true)
  }
  const hideModalCreatePortfolio = () => {
    setShowCreate(false)
  }

  const navigate = useNavigate()
  const theme = useTheme()
  const [threshold, setThreshold] = useState(THRESHOLD_OPTIONS[0].value)
  const [hideSmallBalance, setHideSmallBalance] = useState(true)

  const loading = false
  const savePortfolio = () => {}
  const disableBtnSave = loading /// || 'no change'
  const canCreatePortfolio = portfolios.length < maximumPortfolio

  const [createPortfolio] = useCreatePortfolioMutation()
  const notify = useNotify()
  const addPortfolio = async (data: { name: string }) => {
    try {
      await createPortfolio(data).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio created`,
        summary: t`Your portfolio have been successfully created`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio create failed`,
        summary: t`Create portfolio failed, please try again.`,
      })
    }
  }

  return (
    <Wrapper>
      <Header>
        <Text fontWeight={'500'} fontSize="24px">
          <Trans>Portfolios</Trans>
        </Text>
        <Row gap="16px" width={'fit-content'}>
          <Text fontWeight={'500'} fontSize="14px" color={theme.subText}>
            <Trans>
              Portfolios count:{' '}
              <Text as={'span'} color={canCreatePortfolio ? theme.text : theme.warning}>
                {portfolios.length}/{maximumPortfolio}
              </Text>
            </Trans>
          </Text>
          <MouseoverTooltip
            text={canCreatePortfolio ? '' : t`You had added the maximum number of portfolio`}
            placement="top"
          >
            <ButtonPrimary
              height={'36px'}
              width={'fit-content'}
              disabled={!canCreatePortfolio}
              onClick={canCreatePortfolio ? showModalCreatePortfolio : undefined}
            >
              <Plus />
              &nbsp;
              <Trans>Create Portfolio</Trans>
            </ButtonPrimary>
          </MouseoverTooltip>
        </Row>
      </Header>
      <WarningSignMessage
        outline
        msg={t`To enable more seamless DeFi experience, you can link your wallet to your profile by signing-in.`}
      />
      <Divider />
      {portfolios.map(item => (
        <Fragment key={item.id}>
          <PortfolioItem portfolio={item} />
          <Divider />
        </Fragment>
      ))}
      <RowBetween>
        <Row gap="16px">
          <Text fontSize={'14px'} color={theme.subText}>
            <Trans>Hide small token balances</Trans>
          </Text>
          <Toggle
            backgroundColor={theme.buttonBlack}
            isActive={hideSmallBalance}
            toggle={() => setHideSmallBalance(v => !v)}
          />
        </Row>
        <Row gap="16px" justify="flex-end">
          <Text fontSize={'14px'} color={theme.subText}>
            <Trans>Small balances threshold</Trans>
          </Text>
          <Tabs tabs={THRESHOLD_OPTIONS} style={{ width: 200 }} activeTab={threshold} setActiveTab={setThreshold} />
        </Row>
      </RowBetween>
      <ActionsWrapper>
        <ButtonSave onClick={savePortfolio} disabled={disableBtnSave}>
          <Save size={16} style={{ marginRight: '4px' }} />
          {loading ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
        </ButtonSave>
        <ButtonCancel
          onClick={() => {
            navigate(`${APP_PATHS.PROFILE_MANAGE}${PROFILE_MANAGE_ROUTES.PROFILE}`)
          }}
        >
          <X size={16} style={{ marginRight: '4px' }} />
          Cancel
        </ButtonCancel>
      </ActionsWrapper>
      <CreatePortfolioModal isOpen={showCreate} onDismiss={hideModalCreatePortfolio} onConfirm={addPortfolio} />
    </Wrapper>
  )
}
