import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { PoolClassicIcon, PoolElasticIcon } from 'components/Icons'
import Wallet from 'components/Icons/Wallet'
import { MouseoverTooltip } from 'components/Tooltip'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
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
  const small = false
  return (
    <Text
      sx={{
        fontSize: small ? '10px' : '14px',
        fontWeight: '500',
        padding: '2px 8px',
        borderRadius: '999px',
        color: isActive ? theme.primary : theme.subText,
        background: isActive ? rgba(theme.primary, 0.2) : rgba(theme.subText, 0.2),
        marginTop: small ? 0 : '-12px',
        marginLeft: '2px',
      }}
    >
      Legacy
    </Text>
  )
}

function ClassicElasticTab() {
  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()
  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC

  const { chainId, account } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const navigate = useNavigate()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const showLegacyPoolsExplicitly = upToMedium

  const handleClickElastic = () => {
    if (!!notSupportedMsg) {
      return
    }
    const newQs = { ...qs, tab: VERSION.ELASTIC }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const handleClickElasticLegacy = () => {
    if (!!notSupportedMsg) {
      return
    }
    const newQs = { ...qs, tab: VERSION.ELASTIC_LEGACY }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const handleClickClassic = () => {
    if (!!notSupportedMsg) {
      return
    }
    const newQs = { ...qs, tab: VERSION.CLASSIC }
    navigate({ search: stringify(newQs) }, { replace: true })
  }

  const color = !showLegacyPoolsExplicitly
    ? [VERSION.ELASTIC, VERSION.ELASTIC_LEGACY].includes(tab)
      ? !!notSupportedMsg
        ? theme.disableText
        : theme.primary
      : theme.subText
    : tab === VERSION.ELASTIC
    ? !!notSupportedMsg
      ? theme.disableText
      : theme.primary
    : theme.subText

  const renderPoolButtons = () => {
    return (
      <>
        <MouseoverTooltip
          width="fit-content"
          placement="bottom"
          text={
            notSupportedMsg ||
            (!showLegacyPoolsExplicitly ? (
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
            ) : null)
          }
          noArrow
        >
          <Flex
            role="button"
            alignItems={'center'}
            color={
              tab === VERSION.ELASTIC || tab === VERSION.ELASTIC_LEGACY
                ? !!notSupportedMsg
                  ? theme.disableText
                  : theme.primary
                : theme.subText
            }
            onClick={() => {
              if (!!notSupportedMsg) {
                return
              }
              const newQs = { ...qs, tab: VERSION.ELASTIC }
              navigate({ search: stringify(newQs) }, { replace: true })
            }}
          >
            <Flex
              sx={{
                flex: '0 0 20px',
                height: '20px',
              }}
            >
              <PoolElasticIcon
                size={20}
                color={
                  tab === VERSION.ELASTIC || tab === VERSION.ELASTIC_LEGACY
                    ? !!notSupportedMsg
                      ? theme.disableText
                      : theme.primary
                    : theme.subText
                }
              />
            </Flex>
            <Text
              fontWeight={500}
              fontSize={[18, 20, 24]}
              width={'auto'}
              marginLeft="4px"
              sx={{
                whiteSpace: 'nowrap',
                cursor: !!notSupportedMsg ? 'not-allowed' : 'pointer',
              }}
            >
              <Trans>Elastic Pools</Trans>
            </Text>

            {tab === VERSION.ELASTIC_LEGACY && <LegacyTag isActive />}

            <DropdownSVG style={{ color }} />
          </Flex>
        </MouseoverTooltip>

        <Separator />

        <Flex
          role="button"
          alignItems={'center'}
          onClick={handleClickClassic}
          color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
        >
          <Flex
            sx={{
              flex: '0 0 20px',
              height: '20px',
            }}
          >
            <PoolClassicIcon size={20} color={tab === VERSION.CLASSIC ? theme.primary : theme.subText} />
          </Flex>
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            width={'auto'}
            marginLeft="4px"
            sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <Trans>Classic Pools</Trans>
          </Text>
        </Flex>
      </>
    )
  }

  const renderHelperButtons = () => {
    return (
      <>
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
          <Wallet />
          <Text
            as="span"
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            <Trans>Wallet Analytics</Trans> ↗
          </Text>
        </ExternalLink>

        <Tutorial
          type={tab === VERSION.ELASTIC ? TutorialType.ELASTIC_POOLS : TutorialType.CLASSIC_POOLS}
          customIcon={
            <Flex
              sx={{ gap: '4px', cursor: 'pointer' }}
              fontSize="14px"
              alignItems="center"
              fontWeight="500"
              color={theme.subText}
              role="button"
            >
              <TutorialIcon />
              <Text
                as="span"
                sx={{
                  whiteSpace: 'nowrap',
                }}
              >
                <Trans>Video Tutorial</Trans>
              </Text>
            </Flex>
          }
        />
      </>
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
          width="max-content"
          sx={{
            gap: '8px',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          {renderPoolButtons()}
        </Flex>

        <Flex
          sx={{
            gap: '24px',
            flex: 1,
            justifyContent: 'space-between',
          }}
        >
          {renderHelperButtons()}
        </Flex>
      </Flex>
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
