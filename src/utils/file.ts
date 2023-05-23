const cache: { [url: string]: Promise<string | ArrayBuffer | null> | undefined } = {}

export const toDataURL = async (url: string): Promise<string | ArrayBuffer | null> => {
  const cached = cache[url]
  if (cached) return await cached
  const result = fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve: (value: string | ArrayBuffer | null) => void, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        }),
    )
  cache[url] = result
  return result
}
