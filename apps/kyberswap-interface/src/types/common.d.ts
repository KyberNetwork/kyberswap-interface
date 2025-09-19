type CommonRes<T> = {
  code: number
  message: string
  data: T
}

type CommonPagingData<T> = T & {
  totalItems?: number
  pagination?: { totalItems: number }
}

type CommonPagingRes<T> = {
  code: number
  message: string
  data: CommonPagingData<T>
}
