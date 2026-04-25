export class ApiValidateError extends Error {
  constructor() {
    super('Data error. Please try again later.')
  }
}
