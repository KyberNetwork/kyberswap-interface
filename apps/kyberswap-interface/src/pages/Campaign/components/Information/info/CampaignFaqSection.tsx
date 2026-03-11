import { useState } from 'react'
import { Minus, Plus } from 'react-feather'
import { Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { ButtonIcon } from 'pages/Pools/styleds'

import { FaqItem } from './types'

function FaqRow({ q, a }: FaqItem) {
  const [show, setShow] = useState(false)
  const theme = useTheme()

  return (
    <>
      <Flex justifyContent="space-between" marginTop="1rem">
        <li style={{ flex: 1 }}>{q}</li>
        <ButtonIcon onClick={() => setShow(prev => !prev)}>
          {show ? <Minus size={14} /> : <Plus size={14} />}
        </ButtonIcon>
      </Flex>

      <Text
        color={theme.subText}
        marginX="16px"
        marginRight="32px"
        fontStyle="italic"
        sx={{
          maxHeight: show ? '1000px' : 0,
          opacity: show ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {a}
      </Text>
    </>
  )
}

export default function CampaignFaqSection({ items }: { items: FaqItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <FaqRow key={index} q={item.q} a={item.a} />
      ))}
    </>
  )
}
