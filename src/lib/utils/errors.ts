export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const isNetworkError = (error: unknown): boolean => {
  return (
    error instanceof TypeError &&
    error.message.includes('fetch')
  )
}

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
