import CryptoJS from 'crypto-js'

export const encryptString = (rawText: string, secret: string) => {
  return CryptoJS.AES.encrypt(rawText, secret).toString()
}

export const decryptString = (encryptedText: string, secret: string) => {
  return CryptoJS.AES.decrypt(encryptedText, secret).toString(CryptoJS.enc.Utf8)
}
