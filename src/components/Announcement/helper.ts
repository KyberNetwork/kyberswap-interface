import axios from 'axios'

export const getListAnnouncement = () => {
  return Promise.resolve() //axios.get('')
}

export const getListInbox = () => {
  return Promise.resolve() //axios.get('')
}

export const ackReadAnnouncement = () => {
  return Promise.resolve() //axios.get('')
}

export const formatNumberOfUnread = (num: number) => (num > 10 ? '10+' : num)
