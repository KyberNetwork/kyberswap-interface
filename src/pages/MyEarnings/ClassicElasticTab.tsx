import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { PoolClassicIcon, PoolElasticIcon } from 'components/Icons'
import Wallet from 'components/Icons/Wallet'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { PROMM_ANALYTICS_URL } from 'constants/index'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { ExternalLink, MEDIA_WIDTHS } from 'theme'
import { isInEnum } from 'utils/string'

function ClassicElasticTab() {
  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()
  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC

  const { chainId, account } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const navigate = useNavigate()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const renderPoolButtons = () => {
    return (
      <>
        <Flex
          role="button"
          alignItems={'center'}
          color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
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
              color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
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
        </Flex>

        <Flex
          role="button"
          alignItems={'center'}
          onClick={() => {
            const newQs = { ...qs, tab: VERSION.CLASSIC }
            navigate({ search: stringify(newQs) }, { replace: true })
          }}
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
            gap: '24px',
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
          gap: '24px',
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
