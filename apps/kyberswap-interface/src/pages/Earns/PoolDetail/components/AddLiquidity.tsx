import { PropsWithChildren } from 'react'

import {
  AddLiquidityContent,
  AddLiquidityFormColumn,
  AddLiquidityRouteColumn,
  AddLiquiditySlot,
  SectionCard,
  SectionTitle,
} from '../styled'

type AddLiquidityProps = PropsWithChildren<{
  // You can add any additional props here if needed in the future
}>

const AddLiquidity = ({ children }: AddLiquidityProps) => {
  return (
    <AddLiquidityContent>
      <AddLiquidityFormColumn>
        <SectionCard>
          <SectionTitle>Form</SectionTitle>
        </SectionCard>
      </AddLiquidityFormColumn>

      <AddLiquidityRouteColumn>
        <SectionCard>
          <SectionTitle>Route</SectionTitle>
        </SectionCard>
        <AddLiquiditySlot>{children}</AddLiquiditySlot>
      </AddLiquidityRouteColumn>
    </AddLiquidityContent>
  )
}

export default AddLiquidity
