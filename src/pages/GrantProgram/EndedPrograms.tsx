import { Trans } from '@lingui/macro'
import { ChevronRight } from 'react-feather'
import { useHistory } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import HourGlass from 'assets/images/hourglass2.png'
import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import useGetGrantPrograms from 'hooks/campaigns/useGetGrantPrograms'
import useTheme from 'hooks/useTheme'
import { MEDIA_WIDTHS } from 'theme'
import { GrantProgram } from 'types/grantProgram'
import { convertToSlug } from 'utils/string'

import Banner from './Banner'
import CountdownTimer from './CountdownTimer'
import Stats from './SingleProgram/Stats'

const ButtonWrapper = styled.div`
  position: absolute;
  right: 8px;
  bottom: 8px;

  width: 36px;
  height: 36px;

  display: flex;
  justify-content: center;
  align-items: center;

  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
`

const EndedProgram: React.FC<{ program: GrantProgram }> = ({ program }) => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const history = useHistory()
  const theme = useTheme()

  const handleClick = () => {
    const longName = convertToSlug(program.name)
    const url = `${APP_PATHS.GRANT_PROGRAMS}/${longName}-${program.id}`
    history.push(url)
  }

  return (
    <Flex
      sx={{
        width: '100%',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <Flex
        flexWrap="wrap"
        justifyContent="center"
        width="100%"
        sx={{
          position: 'relative',
          gap: '4px',
        }}
      >
        <Flex
          sx={{
            position: 'relative',
            width: '100%',
            cursor: 'pointer',
          }}
          role="button"
          onClick={handleClick}
        >
          <Banner src={upToExtraSmall ? program?.mobileBanner : program?.desktopBanner} alt={program?.name} />
          <ButtonWrapper>
            <ChevronRight color={theme.white} />
          </ButtonWrapper>
        </Flex>
        <CountdownTimer startTime={program.startTime} endTime={program.endTime} />
      </Flex>

      {upToExtraSmall ? null : (
        <Stats participants={program.totalParticipants} trades={program.totalTrades} volume={program.totalVolume} />
      )}
    </Flex>
  )
}

const StyledImage = styled.img`
  width: 100%;
  height: auto;
`

const EmptyState = () => {
  const theme = useTheme()
  return (
    <Flex
      sx={{
        paddingTop: '48px',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <Flex width="180px">
        <StyledImage alt="reward" src={HourGlass} />
      </Flex>
      <Text
        sx={{
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '24px',
          color: theme.subText,
        }}
      >
        <Trans>Currently there are no campaigns</Trans>
      </Text>
    </Flex>
  )
}

const EndedPrograms: React.FC = () => {
  const now = Date.now() / 1000
  const { data, isValidating } = useGetGrantPrograms()
  const programs = (data?.data?.competitions || []).filter(prog => prog.endTime < now)

  if (isValidating) {
    return <Loader />
  }

  if (programs.length > 0) {
    return (
      <Flex
        sx={{
          flexDirection: 'column',
          width: '100%',
          gap: '48px',
        }}
      >
        {programs.map((prog, i) => {
          return <EndedProgram key={i} program={prog} />
        })}
      </Flex>
    )
  }

  return <EmptyState />
}

export default EndedPrograms
