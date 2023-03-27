export const chunk = <T>(arr: readonly T[], chunkSize: number): T[][] => {
  const result = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize))
  }

  return result
}

export const includes = <T>(
  srcStr: readonly T[] | T[],
  searchElement: any,
  fromIndex?: number | undefined,
): searchElement is T => {
  return (srcStr as any[]).includes(searchElement, fromIndex)
}
