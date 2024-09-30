import { useState } from 'react'
import DropdownIcon from '../assets/dropdown.svg'
import styled from 'styled-components'
import { BPS, SlippageInput } from './Settings'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
  margin-top: 12px;
  width: fit-content;
  cursor: pointer;
`

const SlippageText = styled.div`
  color: ${({ theme }) => theme.text};
`
export default function Slippage({
  slippage,
  setSlippage,
}: {
  slippage: number
  setSlippage: (value: number) => void
}) {
  const [show, setShow] = useState(false)

  return (
    <>
      <Wrapper role="button" onClick={() => setShow(prev => !prev)}>
        <span>Max slippage:</span>
        <SlippageText>{(slippage * 100) / BPS}%</SlippageText>
        <DropdownIcon style={{ transform: `rotate(${show ? '180deg' : 0})` }} />
      </Wrapper>
      {show && <SlippageInput setSlippage={setSlippage} slippage={slippage} />}
    </>
  )
}
