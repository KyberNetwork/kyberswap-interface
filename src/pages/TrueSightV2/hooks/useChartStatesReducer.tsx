import { createContext, useCallback, useContext, useEffect, useReducer } from 'react'

import { KyberAITimeframe } from '../types'

export type ChartStatesType = {
  [chartName: string]: { timeframe?: KyberAITimeframe; showOptions?: Array<string> }
}
export enum CHART_STATES_ACTION_TYPE {
  INITIAL,
  TIMEFRAME_CHANGE,
  TOGGLE_OPTION,
  SET_SHOW_OPTIONS,
}
type Action = {
  type: CHART_STATES_ACTION_TYPE
  payload: any
}

export const ChartStatesContext = createContext<{ state: ChartStatesType; dispatch: React.Dispatch<Action> }>({
  state: {} as ChartStatesType,
  dispatch: () => null,
})

const reducer = (state: ChartStatesType, action: Action) => {
  switch (action.type) {
    case CHART_STATES_ACTION_TYPE.INITIAL: {
      const chartName = action.payload.chartName
      return { ...state, [chartName]: { ...action.payload.initialValues } }
    }
    case CHART_STATES_ACTION_TYPE.TIMEFRAME_CHANGE: {
      const chartName = action.payload.chartName
      return { ...state, [chartName]: { ...state[chartName], timeframe: action.payload.timeframe } }
    }
    case CHART_STATES_ACTION_TYPE.TOGGLE_OPTION: {
      const chartName = action.payload.chartName
      const option = action.payload.option
      let showOptions = state[chartName]?.showOptions || []
      if (showOptions?.includes(option)) {
        showOptions = showOptions.filter(s => s !== option)
      } else {
        showOptions = [...showOptions, option]
      }
      return {
        ...state,
        [chartName]: {
          ...state[chartName],
          showOptions: [...showOptions],
        },
      }
    }
    case CHART_STATES_ACTION_TYPE.SET_SHOW_OPTIONS: {
      const chartName = action.payload.chartName
      return { ...state, [chartName]: { ...state[chartName], showOptions: action.payload.showOptions } }
    }
    default:
      return state
  }
}

export default function useChartStatesReducer(): [ChartStatesType, React.Dispatch<Action>] {
  const [state, dispatch] = useReducer(reducer, {})

  return [state, dispatch]
}

export function useChartStatesContext(
  chartName: string,
  initialValues: { timeframe?: KyberAITimeframe; showOptions?: Array<string> },
) {
  const { state, dispatch } = useContext(ChartStatesContext)

  const customDispatch = useCallback(
    (action: Action) => {
      return dispatch({ ...action, payload: { ...action.payload, chartName } })
    },
    [dispatch, chartName],
  )
  useEffect(() => {
    if (!state[chartName]) {
      dispatch({ type: CHART_STATES_ACTION_TYPE.INITIAL, payload: { initialValues, chartName } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { state: state[chartName], dispatch: customDispatch }
}
