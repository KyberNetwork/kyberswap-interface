import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { PoolClassicIcon, PoolElasticIcon } from 'components/Icons'
import Wallet from 'components/Icons/Wallet'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, PROMM_ANALYTICS_URL } from 'constants/index'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { setActiveTab } from 'state/myEarnings/actions'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { isInEnum } from 'utils/string'

const Separator = () => {
  const theme = useTheme()
  return (
    <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
      |
    </Text>
  )
}

type LegacyTagProps = {
  isActive: boolean
}
const LegacyTag: React.FC<LegacyTagProps> = ({ isActive }) => {
  const theme = useTheme()
  return (
    <Text
      sx={{
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px',
        borderRadius: '999px',
        color: isActive ? theme.primary : theme.subText,
        background: isActive ? rgba(theme.primary, 0.2) : rgba(theme.subText, 0.2),
        marginLeft: '4px',
      }}
    >
      Legacy
    </Text>
  )
}

function ClassicElasticTab() {
  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()
  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC
  const dispatch = useDispatch()

  const { chainId, account } = useActiveWeb3React()
  const notSupportedElasticMessage = ELASTIC_NOT_SUPPORTED[chainId]
  const isNotSupportedElastic = !!notSupportedElasticMessage

  const theme = useTheme()
  const navigate = useNavigate()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const handleClickElastic = () => {
    if (!!notSupportedElasticMessage) {
      return
    }
    const newQs = { ...qs, tab: VERSION.ELASTIC }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const handleClickElasticLegacy = () => {
    if (!!notSupportedElasticMessage) {
      return
    }
    const newQs = { ...qs, tab: VERSION.ELASTIC_LEGACY }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  // const handleClickClassic = () => {
  //   if (!!notSupportedElasticMessage) {
  //     return
  //   }
  //   const newQs = { ...qs, tab: VERSION.CLASSIC }
  //   navigate({ search: stringify(newQs) }, { replace: true })
  // }

  const color = [VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab)
    ? !!notSupportedElasticMessage
      ? theme.disableText
      : theme.primary
    : theme.subText

  useEffect(() => {
    dispatch(setActiveTab(tab))
  }, [dispatch, tab])

  useEffect(() => {
    if (tab !== VERSION.ELASTIC && tab !== VERSION.ELASTIC_LEGACY) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      navigate({ search: stringify(newQs) }, { replace: true })
    }
  }, [navigate, qs, tab])

  const renderComboPoolButtonsForMobile = () => {
    return (
      <MouseoverTooltip
        width="fit-content"
        placement={'bottom'}
        noArrow={!isNotSupportedElastic}
        opacity={1}
        text={
          notSupportedElasticMessage || (
            <Flex flexDirection="column" sx={{ gap: '16px', padding: '8px' }}>
              <Flex
                role="button"
                color={tab === VERSION.ELASTIC ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontSize="16px"
                fontWeight={500}
                onClick={handleClickElastic}
                alignItems="center"
              >
                <PoolElasticIcon size={16} />
                <Trans>Elastic Pools</Trans>
              </Flex>

              <Flex
                role="button"
                color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontWeight={500}
                fontSize="16px"
                onClick={handleClickElasticLegacy}
                alignItems="center"
              >
                <PoolElasticIcon size={16} />
                <Trans>Elastic Pools</Trans>
                <LegacyTag isActive={tab === VERSION.ELASTIC_LEGACY} />
              </Flex>

              <Flex
                role="button"
                alignItems={'center'}
                // onClick={handleClickClassic}
                color={tab === VERSION.CLASSIC ? theme.primary : theme.disableText}
                sx={{
                  cursor: 'pointer',
                  gap: '8px',
                }}
              >
                <Flex
                  sx={{
                    flex: '0 0 16px',
                    height: '16px',
                  }}
                >
                  <PoolClassicIcon size={16} color={tab === VERSION.CLASSIC ? theme.primary : theme.disableText} />
                </Flex>
                <Text fontWeight={500} fontSize={'16px'} width={'auto'}>
                  <Trans>Classic Pools</Trans>
                </Text>
              </Flex>
            </Flex>
          )
        }
      >
        <Flex
          sx={{
            alignItems: 'center',
            gap: '4px',
            position: 'relative',
          }}
        >
          {tab === VERSION.ELASTIC_LEGACY
            ? renderElasticLegacyPoolsButton()
            : tab === VERSION.ELASTIC
            ? renderElasticPoolsButton()
            : renderClassicPoolsButton()}

          <DropdownSVG style={{ color: theme.primary }} />
        </Flex>
      </MouseoverTooltip>
    )
  }

  const renderElasticPoolsButton = () => {
    const color =
      tab === VERSION.ELASTIC ? (!!notSupportedElasticMessage ? theme.disableText : theme.primary) : theme.subText
    return (
      <Flex sx={{ position: 'relative' }} alignItems={'center'} onClick={handleClickElastic}>
        <PoolElasticIcon size={20} color={color} />
        <Text
          fontWeight={500}
          fontSize={[18, 20, 24]}
          color={color}
          width={'auto'}
          marginLeft="4px"
          role="button"
          style={{
            cursor: !!notSupportedElasticMessage ? 'not-allowed' : 'pointer',
          }}
        >
          <Trans>Elastic Pools</Trans>
        </Text>
      </Flex>
    )
  }

  const renderElasticLegacyPoolsButton = () => {
    return (
      <MouseoverTooltip text={notSupportedElasticMessage || ''}>
        <Flex sx={{ position: 'relative' }} alignItems={'center'} onClick={handleClickElasticLegacy}>
          <PoolElasticIcon size={20} color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={
              tab === VERSION.ELASTIC_LEGACY
                ? !!notSupportedElasticMessage
                  ? theme.disableText
                  : theme.primary
                : theme.subText
            }
            width={'auto'}
            marginLeft="4px"
            role="button"
            style={{
              cursor: !!notSupportedElasticMessage ? 'not-allowed' : 'pointer',
            }}
          >
            <Trans>Elastic Pools</Trans>
          </Text>
          <LegacyTag isActive={tab === VERSION.ELASTIC_LEGACY} />
        </Flex>
      </MouseoverTooltip>
    )
  }

  const renderClassicPoolsButton = () => {
    const color = tab === VERSION.CLASSIC ? theme.primary : theme.disableText
    return (
      <MouseoverTooltip
        text={
          <Text>
            Coming soon. In the meantime, you can still manage your Classic liquidity positions{' '}
            <Link to={`${APP_PATHS.MY_POOLS}?tab=classic`}>here</Link>
          </Text>
        }
        placement="top"
      >
        <Flex
          role="button"
          alignItems={'center'}
          color={color}
          style={{
            cursor: 'not-allowed',
          }}
        >
          <Flex
            sx={{
              flex: '0 0 20px',
              height: '20px',
            }}
          >
            <PoolClassicIcon size={20} color={color} />
          </Flex>
          <Text fontWeight={500} fontSize={[18, 20, 24]} width={'auto'} marginLeft="4px" sx={{ whiteSpace: 'nowrap' }}>
            <Trans>Classic Pools</Trans>
          </Text>
        </Flex>
      </MouseoverTooltip>
    )
  }

  const renderHelperButtonsForMobile = () => {
    return (
      <ExternalLink
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: theme.subText,
          fontSize: '14px',
        }}
        href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}
      >
        <Wallet size={20} />
      </ExternalLink>
    )
  }

  if (upToExtraSmall) {
    return (
      <Flex
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          flexDirection: 'column',
        }}
      >
        <Flex
          width="100%"
          sx={{
            gap: '16px',
            flex: 1,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          {renderComboPoolButtonsForMobile()}
          <Flex
            sx={{
              gap: '16px',
              flex: '0 0 fit-content',
            }}
          >
            {renderHelperButtonsForMobile()}
          </Flex>
        </Flex>
      </Flex>
    )
  }

  const renderComboElasticPoolsButton = () => {
    return (
      <MouseoverTooltip
        width="fit-content"
        placement={isNotSupportedElastic ? 'top' : 'bottom'}
        noArrow={!isNotSupportedElastic}
        opacity={1}
        text={
          notSupportedElasticMessage || (
            <Flex flexDirection="column" sx={{ gap: '16px', padding: '8px' }}>
              <Flex
                role="button"
                color={tab === VERSION.ELASTIC ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontSize="16px"
                fontWeight={500}
                onClick={handleClickElastic}
                alignItems="center"
              >
                <PoolElasticIcon size={16} />
                <Trans>Elastic Pools</Trans>
              </Flex>

              <Flex
                role="button"
                color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText}
                sx={{ gap: '8px', cursor: 'pointer' }}
                fontWeight={500}
                fontSize="16px"
                onClick={handleClickElasticLegacy}
                alignItems="center"
              >
                <PoolElasticIcon size={16} />
                <Trans>Elastic Pools</Trans>
                <LegacyTag isActive={tab === VERSION.ELASTIC_LEGACY} />
              </Flex>
            </Flex>
          )
        }
      >
        {tab === VERSION.ELASTIC_LEGACY ? renderElasticLegacyPoolsButton() : renderElasticPoolsButton()}
        <DropdownSVG style={{ color }} />
      </MouseoverTooltip>
    )
  }

  const renderPoolButtons = () => {
    return (
      <>
        {renderComboElasticPoolsButton()}
        <Separator />
        {renderClassicPoolsButton()}
      </>
    )
  }

  const renderHelperButtons = () => {
    return (
      <ExternalLink
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: theme.subText,
          fontSize: '14px',
        }}
        href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}
      >
        <Wallet size={20} />
        <Text
          as="span"
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          <Trans>Wallet Analytics</Trans> ↗
        </Text>
      </ExternalLink>
    )
  }

  return (
    <Flex
      sx={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <Flex
        width="max-content"
        sx={{
          gap: '8px',
        }}
      >
        {renderPoolButtons()}
      </Flex>

      <Flex
        sx={{
          gap: '24px',
        }}
      >
        {renderHelperButtons()}
      </Flex>
    </Flex>
  )
}

export default ClassicElasticTab
