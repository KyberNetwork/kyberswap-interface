import { Trans } from '@lingui/macro'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import campaignApi from 'services/campaign'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import useTheme from 'hooks/useTheme'

import SingleProgram from './SingleProgram'

const Wrapper = styled.div`
  display: flex;
  height: 400px;
  width: 100%;
  justify-content: center;
  align-items: center;
`

type Props = {
  id: string
}

const SpecificProgram: React.FC<Props> = ({ id }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { data, isLoading, isError } = campaignApi.useGetGrantProgramQuery({ id })

  if (isLoading) {
    return (
      <Wrapper>
        <Loader />
      </Wrapper>
    )
  }

  if (isError) {
    navigate(APP_PATHS.GRANT_PROGRAMS)

    return (
      <Wrapper>
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '16px',
            color: theme.text,
          }}
        >
          <Trans>Something went wrong</Trans>
        </Text>
      </Wrapper>
    )
  }

  return <SingleProgram program={data} />
}

export default SpecificProgram
