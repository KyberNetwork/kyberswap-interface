import { useState } from 'react'
import { Minus, Plus } from 'react-feather'

import { Collapse } from 'components/Collapse'
import { ButtonIcon } from 'components/PageWrappers'
import { FaqItem } from 'pages/Campaign/components/Information/info/types'

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

      <Collapse open={show} className="duration-300">
        <p className="pl-4 pr-8 italic text-subText">{a}</p>
      </Collapse>
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
