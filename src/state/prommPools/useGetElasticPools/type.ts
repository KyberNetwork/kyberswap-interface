import { ElasticPoolDetail } from 'types/pool'

export type CommonReturn = {
  isLoading: boolean
  isError: boolean
  data?: {
    [address: string]: ElasticPoolDetail
  }
}
