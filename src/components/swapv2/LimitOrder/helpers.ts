import axios from 'axios'

const formatData = (data: any) => data.data.data

export const submitOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders`, data).then(formatData)
}

export const hashOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders/hash`, data).then(formatData)
}

export const getEncodeMakerAmount = (orderTakingAmount: string, orderMakingAmount: string) => {
  return axios
    .post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/encode/getMakerAmount`, { orderMakingAmount, orderTakingAmount })
    .then(formatData)
}
export const getEncodeTakerAmount = (orderTakingAmount: string, orderMakingAmount: string) => {
  return axios
    .post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/encode/getTakerAmount`, { orderMakingAmount, orderTakingAmount })
    .then(formatData)
}
export const getEncodePredicate = (chainId: string, address: string, expiredAt: number) => {
  return axios
    .post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/encode/predicate`, {
      chainId,
      address,
      expiredAt,
    })
    .then(formatData)
}
