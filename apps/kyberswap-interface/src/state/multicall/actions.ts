export interface ListenerOptions {
  // how often this data should be fetched, by default 1
  readonly blocksPerFetch?: number
  readonly gasRequired?: number | undefined
}
