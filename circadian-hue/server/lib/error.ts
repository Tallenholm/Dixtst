export interface ErrorResponse {
  error_code: string
  message: string
}

export const error = (error_code: string, message: string): ErrorResponse => ({
  error_code,
  message,
})
