import { Flex } from 'rebass'

import CurrentChainButton from 'pages/MyEarnings/CurrentChainButton'
import MultipleChainSelect from 'pages/MyEarnings/MultipleChainSelect'

const ChainSelect = () => {
  return (
    <Flex
      alignItems="center"
      sx={{
        gap: '16px',
      }}
    >
      <CurrentChainButton />
      <MultipleChainSelect />
    </Flex>
  )
}

export default ChainSelect
