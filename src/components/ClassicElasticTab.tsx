import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import ElasticHackedModal from 'components/ElasticHackedModal'
import { APP_PATHS } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { isInEnum } from 'utils/string'

import { PoolClassicIcon, PoolElasticIcon } from './Icons'
import { MouseoverTooltip } from './Tooltip'

function ClassicElasticTab() {
  const { positions, farmPositions } = useElasticLegacy(false)
  const { claimInfo } = useElasticCompensationData(false)
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length

  const { tab: tabQS = VERSION.ELASTIC, skipAlert, ...qs } = useParsedQueryString<{ tab: string }>()

  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC

  const { chainId } = useActiveWeb3React()
  const notSupportedElasticMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const notSupportedClassicMsg = CLASSIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const isFarmPage = location.pathname.startsWith(APP_PATHS.FARMS)
  const isMyPoolPage = location.pathname.startsWith(APP_PATHS.MY_POOLS)
  const [isOpenElasticHacked, setOpenElasticHacked] = useState(
    isMyPoolPage ? false : tab === VERSION.ELASTIC && !notSupportedElasticMsg && !skipAlert,
  )

  useEffect(() => {
    if (isMyPoolPage) return
    if (notSupportedClassicMsg) {
      setOpenElasticHacked(!skipAlert)
    }
    if (tab === VERSION.ELASTIC && !notSupportedElasticMsg) {
      setOpenElasticHacked(!skipAlert)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, isMyPoolPage])

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const dontShowLegacy = [ChainId.ZKEVM, ChainId.BASE, ChainId.LINEA, ChainId.SCROLL].includes(chainId)

  const showLegacyExplicit =
    upToMedium || dontShowLegacy ? false : isFarmPage ? shouldShowFarmTab : shouldShowPositionTab

  useEffect(() => {
    if (dontShowLegacy && tab === VERSION.ELASTIC_LEGACY) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      navigate({ search: stringify(newQs) }, { replace: true })
    }
  }, [tab, dontShowLegacy, navigate, qs])

  const legacyTag = (small?: boolean) => (
    <Text
      sx={{
        fontSize: small ? '10px' : '14px',
        fontWeight: '500',
        padding: '2px 8px',
        borderRadius: '999px',
        color: tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText,
        background: tab === VERSION.ELASTIC_LEGACY ? rgba(theme.primary, 0.2) : rgba(theme.subText, 0.2),
        marginTop: small ? 0 : '-12px',
        marginLeft: '2px',
        lineHeight: 1.5,
      }}
    >
      Legacy
    </Text>
  )

  const handleSwitchTab = (version: VERSION) => {
    if (!!notSupportedClassicMsg && version === VERSION.CLASSIC) return
    if (!!notSupportedElasticMsg && version !== VERSION.CLASSIC) return
    const newQs = { ...qs, tab: version }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const getColorOfElasticTab = () => {
    if (!!notSupportedElasticMsg) {
      return theme.disableText
    }

    if (!showLegacyExplicit) {
      if ([VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab)) {
        return theme.primary
      }

      return theme.subText
    }

    if (tab === VERSION.ELASTIC) {
      return theme.primary
    }

    return theme.subText
  }

  const getColorOfClassicTab = () => {
    if (!!notSupportedClassicMsg) {
      return theme.disableText
    }

    if (tab === VERSION.CLASSIC) {
      return theme.primary
    }
    return theme.subText
  }

  const getColorOfLegacyElasticTab = () => {
    if (!!notSupportedElasticMsg) {
      return theme.disableText
    }

    return tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText
  }

  const color = getColorOfElasticTab()
  const legacyElasticColor = getColorOfLegacyElasticTab()

  useEffect(() => {
    if (!!notSupportedClassicMsg && tab === VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      navigate({ search: stringify(newQs) }, { replace: true })
    } else if (!!notSupportedElasticMsg && tab !== VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.CLASSIC }
      navigate({ search: stringify(newQs) }, { replace: true })
    }
  }, [navigate, notSupportedElasticMsg, notSupportedClassicMsg, qs, tab])

  return (
    <Flex width="max-content">
      <MouseoverTooltip
        width="fit-content"
        placement="bottom"
        text={
          dontShowLegacy
            ? ''
            : tab === VERSION.CLASSIC && notSupportedClassicMsg
            ? notSupportedClassicMsg
            : notSupportedElasticMsg ||
              (!showLegacyExplicit ? (
                <Flex flexDirection="column" sx={{ gap: '16px', padding: '8px' }}>
                  <Flex
                    role="button"
                    color={tab === VERSION.ELASTIC ? theme.primary : theme.subText}
                    sx={{ gap: '8px', cursor: 'pointer' }}
                    fontSize="14px"
                    fontWeight={500}
                    onClick={() => handleSwitchTab(VERSION.ELASTIC)}
                  >
                    <PoolElasticIcon size={16} />
                    {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
                  </Flex>

                  <Flex
                    role="button"
                    color={tab === VERSION.ELASTIC_LEGACY ? theme.primary : theme.subText}
                    sx={{ gap: '8px', cursor: 'pointer' }}
                    fontWeight={500}
                    fontSize="14px"
                    onClick={() => handleSwitchTab(VERSION.ELASTIC_LEGACY)}
                  >
                    <PoolElasticIcon size={16} />
                    {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
                    {legacyTag(true)}
                  </Flex>
                </Flex>
              ) : null)
        }
      >
        <Flex
          alignItems={'center'}
          onClick={() => {
            if (isMobile) {
              if (showLegacyExplicit || dontShowLegacy) handleSwitchTab(VERSION.ELASTIC)
            } else handleSwitchTab(VERSION.ELASTIC)
          }}
        >
          <PoolElasticIcon size={20} color={color} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={color}
            width={'auto'}
            marginLeft="4px"
            role="button"
            style={{
              cursor: !!notSupportedElasticMsg ? 'not-allowed' : 'pointer',
            }}
          >
            {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </Text>

          {!showLegacyExplicit && tab === VERSION.ELASTIC_LEGACY && legacyTag()}

          {!dontShowLegacy && !showLegacyExplicit && <DropdownSVG style={{ color }} />}
        </Flex>
      </MouseoverTooltip>
      <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
        |
      </Text>

      {showLegacyExplicit && (
        <>
          <MouseoverTooltip text={notSupportedElasticMsg || ''} placement="top">
            <Flex
              sx={{ position: 'relative' }}
              alignItems={'center'}
              onClick={() => {
                handleSwitchTab(VERSION.ELASTIC_LEGACY)
              }}
            >
              <PoolElasticIcon size={20} color={legacyElasticColor} />
              <Text
                fontWeight={500}
                fontSize={[18, 20, 24]}
                color={legacyElasticColor}
                width={'auto'}
                marginLeft="4px"
                role="button"
                style={{
                  cursor: !!notSupportedElasticMsg ? 'not-allowed' : 'pointer',
                }}
              >
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </Text>
              {legacyTag()}
            </Flex>
          </MouseoverTooltip>
          <Text fontWeight={500} fontSize={[18, 20, 24]} color={theme.subText} marginX={'12px'}>
            |
          </Text>
        </>
      )}

      <MouseoverTooltip text={notSupportedClassicMsg || ''}>
        <Flex
          alignItems={'center'}
          onClick={() => {
            handleSwitchTab(VERSION.CLASSIC)
          }}
        >
          <PoolClassicIcon size={20} color={getColorOfClassicTab()} />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            color={getColorOfClassicTab()}
            width={'auto'}
            marginLeft="4px"
            style={{ cursor: 'pointer' }}
            role="button"
          >
            {isFarmPage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
          </Text>
        </Flex>
      </MouseoverTooltip>

      <ElasticHackedModal
        isOpen={isOpenElasticHacked}
        onClose={() => {
          setOpenElasticHacked(false)
          handleSwitchTab(VERSION.CLASSIC)
        }}
        onConfirm={() => {
          setOpenElasticHacked(false)
          navigate({ pathname: APP_PATHS.MY_POOLS, search: 'skipAlert=1' })
        }}
      />
    </Flex>
  )
}

export default ClassicElasticTab
