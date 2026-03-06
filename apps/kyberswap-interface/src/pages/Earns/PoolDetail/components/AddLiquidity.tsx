import { ReactNode } from 'react'

import {
  AddLiquidityBody,
  AddLiquidityFormShell,
  AddLiquidityLayout,
  AddLiquidityRouteShell,
  AddLiquidityWidgetShell,
  RouteMockBranch,
  RouteMockConnector,
  RouteMockFlow,
  RouteMockLabel,
  RouteMockNode,
  RouteMockRow,
  RouteMockValue,
  SectionCard,
  SectionTitle,
} from '../styled'

interface AddLiquidityProps {
  form: ReactNode
  children?: ReactNode
  token0Symbol?: string
  token1Symbol?: string
  protocol?: string
  pairLabel?: string
}

const AddLiquidity = ({ form, children, token0Symbol, token1Symbol, protocol, pairLabel }: AddLiquidityProps) => {
  return (
    <AddLiquidityBody>
      <AddLiquidityLayout>
        <AddLiquidityFormShell>
          <AddLiquidityWidgetShell>{form}</AddLiquidityWidgetShell>
        </AddLiquidityFormShell>
        <AddLiquidityRouteShell>
          <SectionCard>
            <SectionTitle>Route</SectionTitle>
            <RouteMockFlow>
              <RouteMockRow>
                <RouteMockNode>
                  <RouteMockLabel>Input</RouteMockLabel>
                  <RouteMockValue>Any supported token</RouteMockValue>
                </RouteMockNode>
                <RouteMockConnector />
                <RouteMockNode>
                  <RouteMockLabel>Router</RouteMockLabel>
                  <RouteMockValue>{protocol || 'Best Route'}</RouteMockValue>
                </RouteMockNode>
              </RouteMockRow>

              <RouteMockRow>
                <RouteMockBranch>
                  <RouteMockNode>
                    <RouteMockLabel>Output Token 0</RouteMockLabel>
                    <RouteMockValue>{token0Symbol || 'Token 0'}</RouteMockValue>
                  </RouteMockNode>
                  <RouteMockNode>
                    <RouteMockLabel>Output Token 1</RouteMockLabel>
                    <RouteMockValue>{token1Symbol || 'Token 1'}</RouteMockValue>
                  </RouteMockNode>
                </RouteMockBranch>
                <RouteMockConnector />
                <RouteMockNode>
                  <RouteMockLabel>LP Position</RouteMockLabel>
                  <RouteMockValue>{pairLabel || 'Pool Position'}</RouteMockValue>
                </RouteMockNode>
              </RouteMockRow>
            </RouteMockFlow>
          </SectionCard>
          {children}
        </AddLiquidityRouteShell>
      </AddLiquidityLayout>
    </AddLiquidityBody>
  )
}

export default AddLiquidity
