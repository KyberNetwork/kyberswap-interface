// const useTrade = ({
//   fromToken,
//   toToken,
//   fromValue,
//   selectedPool,
// }: {
//   fromToken: Currency | null
//   toToken: Currency | null
//   fromValue: CurrencyAmount<Currency> | null
//   selectedPool: Pool | null
// }) => {
//   const trade = useMemo(() => {
//     try {
//       return fromToken && toToken && fromValue && selectedPool
//         ? Trade.exactIn(new Route([selectedPool], fromToken, toToken), fromValue)
//         : null
//     } catch (e) {
//       return null
//     }
//   }, [fromToken, fromValue, selectedPool, toToken])
//   return trade
// }

// export default useTrade
export {}
