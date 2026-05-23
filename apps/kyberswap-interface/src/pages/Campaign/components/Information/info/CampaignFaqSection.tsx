import { useState } from 'react'
import { Minus, Plus } from 'react-feather'

import { ButtonIcon } from 'components/PageWrappers'

import { FaqItem } from './types'

function FaqRow({ q, a }: FaqItem) {
  const [show, setShow] = useState(false)

  return (
    <>
      <div className="mt-4 flex justify-between">
        <li className="flex-1">{q}</li>
        <ButtonIcon onClick={() => setShow(prev => !prev)}>
          {show ? <Minus size={14} /> : <Plus size={14} />}
        </ButtonIcon>
      </div>

      <p
        className="mx-4 mr-8 overflow-hidden italic text-subText transition-all duration-300 ease-in-out"
        style={{
          maxHeight: show ? '1000px' : 0,
          opacity: show ? 1 : 0,
        }}
      >
        {a}
      </p>
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
