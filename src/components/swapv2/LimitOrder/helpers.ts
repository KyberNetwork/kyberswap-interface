import axios from 'axios'

export const submitOrder = (data: any) => {
  return axios.post(`${process.env.REACT_APP_LIMIT_ORDER_API}/v1/orders`, data)
}
