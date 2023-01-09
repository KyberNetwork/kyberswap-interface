const usePoolTransactionsStat = (
  poolAddress: string,
):
  | {
      add: number
      mint: number
      burn: number
    }
  | undefined => {
  return { add: 0, mint: 0, burn: 0 }
}

export default usePoolTransactionsStat
