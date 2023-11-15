import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Plus, Save, X } from 'react-feather'
import Skeleton from 'react-loading-skeleton'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import {
  useClonePortfolioMutation,
  useCreatePortfolioMutation,
  useGetPortfolioByIdQuery,
  useGetPortfoliosQuery,
  useGetPortfoliosSettingsQuery,
  useUpdatePortfoliosSettingsMutation,
} from 'services/portfolio'
import styled from 'styled-components'

import { NotificationType } from 'components/Announcement/type'
import { ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import Toggle from 'components/Toggle'
import { MouseoverTooltip } from 'components/Tooltip'
import { Tabs } from 'components/WalletPopup/Transactions/Tab'
import { EMPTY_ARRAY, RTK_QUERY_TAGS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { useInvalidateTagPortfolio } from 'hooks/useInvalidateTags'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useShowLoadingAtLeastTime from 'hooks/useShowLoadingAtLeastTime'
import useTheme from 'hooks/useTheme'
import CreatePortfolioModal from 'pages/NotificationCenter/Portfolio/Modals/CreatePortfolioModal'
import PortfolioItem from 'pages/NotificationCenter/Portfolio/PortfolioItem'
import { ButtonCancel, ButtonSave } from 'pages/NotificationCenter/Portfolio/buttons'
import { MAXIMUM_PORTFOLIO } from 'pages/NotificationCenter/Portfolio/const'
import WarningSignMessage, { WarningConnectWalletMessage } from 'pages/NotificationCenter/Profile/WarningSignMessage'
import { useNotify } from 'state/application/hooks'
import { useSessionInfo } from 'state/authen/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { isAddress } from 'utils'

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
    padding-bottom: 16px;
  `}
`

const Header = styled.div`
  justify-content: space-between;
  display: flex;
  align-items: center;
  cursor: pointer;
  transform: translateX(-4px);
`

const PortfolioStat = styled(Row)`
  gap: 16px;
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    justify-content: space-between;
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
const THRESHOLD_OPTIONS = [1, 10, 100].map(el => ({ value: el, title: `< ${el}` }))

const SettingWrapper = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 24px;
  `};
`
const BalanceThreshold = styled(Row)`
  gap: 16px;
  justify-content: flex-end;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 8px;
    width: 100%;
    align-items: flex-start;
  `};
`

export default function PortfolioSettings() {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { account } = useActiveWeb3React()
  const [showCreate, setShowCreate] = useState(false)

  const { data: portfolios = EMPTY_ARRAY, isLoading: isFetching, refetch } = useGetPortfoliosQuery()
  const { data: settings, refetch: refetchSetting } = useGetPortfoliosSettingsQuery()

  const { cloneId = '', wallet } = useParsedQueryString<{ cloneId: string; wallet: string }>()
  const loading = useShowLoadingAtLeastTime(isFetching, wallet ? 0 : 700)
  const { data: clonePortfolio } = useGetPortfolioByIdQuery({ id: cloneId }, { skip: !cloneId })
  useEffect(() => {
    if (clonePortfolio || isAddress(ChainId.MAINNET, wallet)) {
      setShowCreate(true)
    }
  }, [clonePortfolio, wallet])

  const { userInfo } = useSessionInfo()
  const invalidateTags = useInvalidateTagPortfolio()
  useEffect(() => {
    try {
      refetch()
      refetchSetting()
      invalidateTags([RTK_QUERY_TAGS.GET_LIST_WALLET_PORTFOLIO, RTK_QUERY_TAGS.GET_FAVORITE_PORTFOLIO])
    } catch (error) {}
  }, [userInfo?.identityId, invalidateTags, refetch, refetchSetting])

  const showModalCreatePortfolio = () => {
    setShowCreate(true)
  }
  const hideModalCreatePortfolio = () => {
    setShowCreate(false)
  }

  const theme = useTheme()

  const [threshold, setThreshold] = useState<string | number>(THRESHOLD_OPTIONS[0].value)
  const [hideSmallBalance, setHideSmallBalance] = useState(true)

  const resetSetting = useCallback(() => {
    if (!settings) return
    setHideSmallBalance(settings.isHideDust)
    setThreshold(settings.dustThreshold)
  }, [settings])

  useEffect(() => {
    resetSetting()
  }, [resetSetting])

  const [saveSetting] = useUpdatePortfoliosSettingsMutation()
  const savePortfolioSetting = async () => {
    try {
      await saveSetting({ dustThreshold: +threshold, isHideDust: hideSmallBalance }).unwrap()
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio setting saved`,
        summary: t`Your portfolio settings have been successfully saved`,
      })
    } catch (error) {
      notify({
        type: NotificationType.ERROR,
        title: t`Portfolio save failed`,
        summary: t`Create portfolio settings save failed, please try again.`,
      })
    }
  }

  const hasChangeSettings = settings?.dustThreshold !== threshold || settings?.isHideDust !== hideSmallBalance
  const disableBtnSave = loading || !hasChangeSettings
  const canCreatePortfolio = !!account && portfolios.length < MAXIMUM_PORTFOLIO && !loading

  const [createPortfolio] = useCreatePortfolioMutation()
  const [clonePortfolioRequest] = useClonePortfolioMutation()
  const [searchParams, setSearchParams] = useSearchParams()
  const notify = useNotify()
  const addPortfolio = async (data: { name: string }) => {
    try {
      const resp = await (clonePortfolio
        ? clonePortfolioRequest({ ...data, portfolioId: clonePortfolio.id }).unwrap()
        : createPortfolio(data).unwrap())
      notify({
        type: NotificationType.SUCCESS,
        title: t`Portfolio created`,
        summary: t`Your portfolio have been successfully created`,
      })
      if (clonePortfolio) {
        searchParams.delete('cloneId')
        setSearchParams(searchParams)
      }
      if (wallet && resp?.id) {
        searchParams.set('portfolioId', resp.id)
        setSearchParams(searchParams)
      }
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
        {!upToMedium && (
          <Text fontWeight={'500'} fontSize="24px">
            <Trans>Portfolios</Trans>
          </Text>
        )}
        <PortfolioStat>
          <Text fontWeight={'500'} fontSize="14px" color={theme.subText}>
            <Trans>
              Portfolios count:{' '}
              <Text as={'span'} color={portfolios.length < MAXIMUM_PORTFOLIO ? theme.text : theme.warning}>
                {portfolios.length}/{MAXIMUM_PORTFOLIO}
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
              <Plus size={16} />
              &nbsp;
              <Trans>Create Portfolio</Trans>
            </ButtonPrimary>
          </MouseoverTooltip>
        </PortfolioStat>
      </Header>
      {!account ? (
        <WarningConnectWalletMessage msg={t`Connect to create your portfolio`} />
      ) : (
        <WarningSignMessage
          outline
          msg={t`To enable more seamless DeFi experience, you can link your wallet to your profile by signing-in.`}
        />
      )}

      <Divider />

      <Column style={{ minHeight: '46px', gap: '24px', justifyContent: 'center' }}>
        {loading ? (
          <Skeleton height="176px" baseColor={theme.background} highlightColor={theme.buttonGray} borderRadius="1rem" />
        ) : !portfolios.length ? (
          <Text color={theme.subText} width={'100%'} textAlign={'center'}>
            <Trans>You don&apos;t have any portfolio.</Trans>
          </Text>
        ) : (
          portfolios.map((item, i) => (
            <Fragment key={item.id}>
              <PortfolioItem portfolio={item} />
              {i !== portfolios.length - 1 && <Divider />}
            </Fragment>
          ))
        )}
      </Column>
      <Divider />
      <SettingWrapper>
        <Row gap="16px" justify={upToMedium ? 'space-between' : undefined}>
          <Text fontSize={'14px'} color={theme.subText}>
            <Trans>Hide small token balances</Trans>
          </Text>
          <Toggle
            backgroundColor={theme.buttonBlack}
            isActive={hideSmallBalance}
            toggle={() => setHideSmallBalance(v => !v)}
          />
        </Row>
        <BalanceThreshold>
          <Text fontSize={'14px'} color={theme.subText} sx={{ whiteSpace: 'nowrap' }}>
            <Trans>Small balances threshold</Trans>
          </Text>
          <Tabs<number | string>
            tabs={THRESHOLD_OPTIONS}
            style={{ width: upToSmall ? '100%' : 200 }}
            activeTab={threshold}
            setActiveTab={setThreshold}
          />
        </BalanceThreshold>
      </SettingWrapper>
      <ActionsWrapper>
        <ButtonSave onClick={savePortfolioSetting} disabled={disableBtnSave}>
          <Save size={16} style={{ marginRight: '4px' }} />
          {loading ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
        </ButtonSave>
        <ButtonCancel onClick={resetSetting} disabled={disableBtnSave}>
          <X size={16} style={{ marginRight: '4px' }} />
          Cancel
        </ButtonCancel>
      </ActionsWrapper>
      <CreatePortfolioModal
        isOpen={showCreate}
        onDismiss={hideModalCreatePortfolio}
        onConfirm={addPortfolio}
        defaultName={!portfolios.length ? t`My 1st Portfolio` : portfolios.length === 1 ? t`My 2nd Portfolio` : ''}
      />
    </Wrapper>
  )
}
