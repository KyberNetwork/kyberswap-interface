import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import ElasticHackedModal from 'components/ElasticHackedModal'
import { APP_PATHS } from 'constants/index'
import { CLASSIC_NOT_SUPPORTED, ELASTIC_NOT_SUPPORTED } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useElasticCompensationData from 'hooks/useElasticCompensationData'
import useElasticLegacy from 'hooks/useElasticLegacy'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { isInEnum } from 'utils/string'

import { PoolClassicIcon, PoolElasticIcon } from './Icons'
import { MouseoverTooltip } from './Tooltip'

// Original used rebass responsive array fontSize={[18, 20, 24]} with rebass
// breakpoints (40em=640, 52em=832). Approximated with Tailwind xs (576) / sm (768).
const TAB_LABEL_CLASS = 'text-lg font-medium leading-tight xs:text-xl sm:text-2xl'

function ClassicElasticTab() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isFarmPage = location.pathname.startsWith(APP_PATHS.FARMS)
  const isMyPoolPage = location.pathname.startsWith(APP_PATHS.MY_POOLS)

  const { positions, farmPositions } = useElasticLegacy(false)
  const { claimInfo } = useElasticCompensationData(false)
  const shouldShowFarmTab = !!farmPositions.length || !!claimInfo
  const shouldShowPositionTab = !!positions.length

  const params = Object.fromEntries(searchParams)
  const { tab: tabQs = VERSION.ELASTIC, ...qs } = params
  const tab = isInEnum(tabQs, VERSION) ? tabQs : VERSION.ELASTIC

  const { chainId } = useActiveWeb3React()
  const notSupportedElasticMsg = ELASTIC_NOT_SUPPORTED()[chainId]
  const notSupportedClassicMsg = CLASSIC_NOT_SUPPORTED()[chainId]

  const isOpenElasticHacked = !isMyPoolPage && tab === VERSION.ELASTIC

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const dontShowLegacy = [
    ChainId.BASE,
    ChainId.LINEA,
    ChainId.SCROLL,
    ChainId.BLAST,
    ChainId.MANTLE,
    ChainId.SONIC,
  ].includes(chainId)

  const showLegacyExplicit =
    upToMedium || dontShowLegacy ? false : isFarmPage ? shouldShowFarmTab : shouldShowPositionTab

  useEffect(() => {
    if (dontShowLegacy && tab === VERSION.ELASTIC_LEGACY) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      setSearchParams(newQs)
    }
  }, [tab, dontShowLegacy, setSearchParams, qs])

  const legacyTag = (small?: boolean) => {
    const isActive = tab === VERSION.ELASTIC_LEGACY
    return (
      <span
        className={cn(
          'ml-0.5 rounded-full px-2 py-0.5 font-medium leading-normal',
          small ? 'text-[10px]' : 'mt-[-12px] text-sm',
          isActive ? 'bg-primary-20 text-primary' : 'bg-subText-20 text-subText',
        )}
      >
        Legacy
      </span>
    )
  }

  const handleSwitchTab = (version: VERSION) => {
    if (!!notSupportedClassicMsg && version === VERSION.CLASSIC) return
    if (!!notSupportedElasticMsg && version !== VERSION.CLASSIC) return
    const newQs = { ...qs, tab: version }
    setSearchParams(newQs)
  }

  const getClassNameOfElasticTab = () => {
    if (notSupportedElasticMsg) return 'text-disableText'
    if (!showLegacyExplicit) {
      return [VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab) ? 'text-primary' : 'text-subText'
    }
    return tab === VERSION.ELASTIC ? 'text-primary' : 'text-subText'
  }

  const getClassNameOfClassicTab = () => {
    if (notSupportedClassicMsg) return 'text-disableText'
    if (tab === VERSION.CLASSIC) return 'text-primary'
    return 'text-subText'
  }

  const getClassNameOfLegacyElasticTab = () => {
    if (notSupportedElasticMsg) return 'text-disableText'
    return tab === VERSION.ELASTIC_LEGACY ? 'text-primary' : 'text-subText'
  }

  const elasticClass = getClassNameOfElasticTab()
  const legacyElasticClass = getClassNameOfLegacyElasticTab()

  useEffect(() => {
    if (!!notSupportedClassicMsg && !!notSupportedElasticMsg) {
      return
    }
    if (!!notSupportedClassicMsg && tab === VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.ELASTIC }
      setSearchParams(newQs)
    } else if (!!notSupportedElasticMsg && tab !== VERSION.CLASSIC) {
      const newQs = { ...qs, tab: VERSION.CLASSIC }
      setSearchParams(newQs)
    }
  }, [setSearchParams, notSupportedElasticMsg, notSupportedClassicMsg, qs, tab])

  return (
    <div className="flex w-max">
      <MouseoverTooltip
        width="fit-content"
        placement="bottom"
        text={
          notSupportedElasticMsg ||
          (dontShowLegacy ? (
            ''
          ) : !showLegacyExplicit ? (
            <div className="flex flex-col gap-4 p-2">
              <div
                role="button"
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-sm font-medium',
                  tab === VERSION.ELASTIC ? 'text-primary' : 'text-subText',
                )}
                onClick={() => handleSwitchTab(VERSION.ELASTIC)}
              >
                <PoolElasticIcon size={16} />
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </div>

              <div
                role="button"
                className={cn(
                  'flex cursor-pointer items-center gap-2 text-sm font-medium',
                  tab === VERSION.ELASTIC_LEGACY ? 'text-primary' : 'text-subText',
                )}
                onClick={() => handleSwitchTab(VERSION.ELASTIC_LEGACY)}
              >
                <PoolElasticIcon size={16} />
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
                {legacyTag(true)}
              </div>
            </div>
          ) : null)
        }
      >
        <div
          className="flex items-center"
          onClick={() => {
            if (isMobile) {
              if (showLegacyExplicit || dontShowLegacy) handleSwitchTab(VERSION.ELASTIC)
            } else handleSwitchTab(VERSION.ELASTIC)
          }}
        >
          <PoolElasticIcon size={20} className={elasticClass} />
          <span
            role="button"
            className={cn(
              TAB_LABEL_CLASS,
              'ml-1 w-auto',
              elasticClass,
              notSupportedElasticMsg ? 'cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
          </span>

          {!showLegacyExplicit && tab === VERSION.ELASTIC_LEGACY && legacyTag()}

          {!dontShowLegacy && !showLegacyExplicit && <DropdownSVG className={elasticClass} />}
        </div>
      </MouseoverTooltip>
      <span className={cn(TAB_LABEL_CLASS, 'mx-3 text-subText')}>|</span>

      {showLegacyExplicit && (
        <>
          <MouseoverTooltip text={notSupportedElasticMsg || ''} placement="top">
            <div
              className="relative flex items-center"
              onClick={() => {
                handleSwitchTab(VERSION.ELASTIC_LEGACY)
              }}
            >
              <PoolElasticIcon size={20} className={legacyElasticClass} />
              <span
                role="button"
                className={cn(
                  TAB_LABEL_CLASS,
                  'ml-1 w-auto',
                  legacyElasticClass,
                  notSupportedElasticMsg ? 'cursor-not-allowed' : 'cursor-pointer',
                )}
              >
                {isFarmPage ? <Trans>Elastic Farms</Trans> : <Trans>Elastic Pools</Trans>}
              </span>
              {legacyTag()}
            </div>
          </MouseoverTooltip>
          <span className={cn(TAB_LABEL_CLASS, 'mx-3 text-subText')}>|</span>
        </>
      )}

      <MouseoverTooltip text={notSupportedClassicMsg || ''}>
        <div
          className="flex items-center"
          onClick={() => {
            handleSwitchTab(VERSION.CLASSIC)
          }}
        >
          <PoolClassicIcon size={20} className={getClassNameOfClassicTab()} />
          <span role="button" className={cn(TAB_LABEL_CLASS, 'ml-1 w-auto cursor-pointer', getClassNameOfClassicTab())}>
            {isFarmPage ? <Trans>Classic Farms</Trans> : <Trans>Classic Pools</Trans>}
          </span>
        </div>
      </MouseoverTooltip>

      <ElasticHackedModal
        isOpen={isOpenElasticHacked}
        onClose={() => {
          if (notSupportedClassicMsg) {
            navigate({ pathname: APP_PATHS.MY_POOLS })
          } else {
            handleSwitchTab(VERSION.CLASSIC)
          }
        }}
        onConfirm={() => {
          navigate({ pathname: APP_PATHS.MY_POOLS })
        }}
      />
    </div>
  )
}

export default ClassicElasticTab
