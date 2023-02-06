import { Trans } from '@lingui/macro'
import { stringify } from 'querystring'
import { useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import { PoolClassicIcon, PoolElasticIcon } from 'components/Icons'
import Wallet from 'components/Icons/Wallet'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { isInEnum } from 'utils/string'

function ClassicElasticTab() {
  const { tab: tabQS = VERSION.ELASTIC, ...qs } = useParsedQueryString<{ tab: string }>()
  const tab = isInEnum(tabQS, VERSION) ? tabQS : VERSION.ELASTIC

  const { chainId } = useActiveWeb3React()
  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId]

  const theme = useTheme()
  const navigate = useNavigate()
  const upToSmall = useMedia('(max-width: 768px)')

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Flex
        width="max-content"
        sx={{
          gap: '24px',
        }}
      >
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
          <PoolElasticIcon
            size={20}
            color={tab === VERSION.ELASTIC ? (!!notSupportedMsg ? theme.disableText : theme.primary) : theme.subText}
          />
          <Text
            fontWeight={500}
            fontSize={[18, 20, 24]}
            width={'auto'}
            marginLeft="4px"
            sx={{
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
          <PoolClassicIcon size={20} color={tab === VERSION.CLASSIC ? theme.primary : theme.subText} />
          <Text fontWeight={500} fontSize={[18, 20, 24]} width={'auto'} marginLeft="4px" sx={{ cursor: 'pointer' }}>
            <Trans>Classic Pools</Trans>
          </Text>
        </Flex>
      </Flex>

      <Flex sx={{ gap: '24px' }}>
        <ExternalLink
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: theme.subText,
          }}
          href="https://docs.kyberswap.com/classic/guides/yield-farming-guide"
        >
          <Wallet />
          <Text as="span">
            <Trans>Wallet Analytics ↗</Trans>
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
              {!upToSmall && <Trans>Video Tutorial</Trans>}
            </Flex>
          }
        />
      </Flex>
    </Flex>
  )
}

export default ClassicElasticTab
