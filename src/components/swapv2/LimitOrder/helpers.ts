import axios from 'axios'

const formatData = (data: any) => data.data.data
export const getListOrder = (params: any) => {
  return axios.get(`${'https://limit-order-rk.dev.kyberengineering.io/api'}/v1/orders`, { params }).then(formatData)
}

export const submitOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders`, data).then(formatData)
}

export const hashOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders/hash`, data).then(formatData)
}
