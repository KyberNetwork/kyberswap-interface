import React from 'react'
import { Flex } from 'rebass'

import { MouseoverTooltip } from 'components/Tooltip'

const Test = () => {
  return (
    <Flex
      flexDirection={'column'}
      sx={{
        paddingTop: '32px',
        gap: '120px',
      }}
    >
      {(['left', 'right', 'top', 'bottom'] as const).map(placement => {
        return (
          <React.Fragment key={placement}>
            <MouseoverTooltip text={<div>Estimated change in price due to</div>} placement={placement}>
              <span>Tooltip 1</span>
            </MouseoverTooltip>

            <MouseoverTooltip
              text={
                <div>
                  Estimated change in price due to. Estimated change in price due to. Estimated change in price due to.
                  Estimated change in price due to.
                </div>
              }
              placement={placement}
            >
              <span>Tooltip 1</span>
            </MouseoverTooltip>
          </React.Fragment>
        )
      })}
    </Flex>
  )
}

export default Test
