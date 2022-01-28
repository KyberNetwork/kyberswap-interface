import { createAction } from '@reduxjs/toolkit'

export const selectPercent = createAction<{ percent: number }>('burnProAmm/selectBurnPercent')
