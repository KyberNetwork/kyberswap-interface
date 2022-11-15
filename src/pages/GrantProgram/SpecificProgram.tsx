import { useHistory } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import Loader from 'components/Loader'
import { APP_PATHS } from 'constants/index'
import useGetGrantProgram from 'hooks/campaigns/useGetGrantProgram'
import useTheme from 'hooks/useTheme'

import SingleProgram from './SingleProgram'

type Props = {
  id: string
}

const SpecificProgram: React.FC<Props> = ({ id }) => {
  const history = useHistory()
  const theme = useTheme()
  const { data, isValidating, error } = useGetGrantProgram(id)

  if (isValidating) {
    return (
      <Flex
        sx={{
          height: '400px',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader />
      </Flex>
    )
  }

  if (error) {
    history.push(APP_PATHS.GRANT_PROGRAMS)

    return (
      <Flex
        sx={{
          height: '400px',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          sx={{
            fontWeight: 400,
            fontSize: '16px',
            lineHeight: '16px',
            color: theme.text,
          }}
        >
          {error || 'Something went wrong'}
        </Text>
      </Flex>
    )
  }

  return <SingleProgram program={data} />
}

export default SpecificProgram
