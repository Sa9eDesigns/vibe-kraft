/**
 * Browserless Error Classes
 */

export class BrowserlessError extends Error {
  public readonly statusCode?: number;
  public readonly code?: string;
  public readonly response?: any;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    response?: any
  ) {
    super(message);
    this.name = 'BrowserlessError';
    this.statusCode = statusCode;
    this.code = code;
    this.response = response;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BrowserlessError);
    }
  }
}

export class BrowserlessAuthenticationError extends BrowserlessError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'BrowserlessAuthenticationError';
  }
}

export class BrowserlessTimeoutError extends BrowserlessError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'BrowserlessTimeoutError';
  }
}

export class BrowserlessRateLimitError extends BrowserlessError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'BrowserlessRateLimitError';
  }
}

export class BrowserlessValidationError extends BrowserlessError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'BrowserlessValidationError';
  }
}

export class BrowserlessNetworkError extends BrowserlessError {
  constructor(message: string = 'Network error') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'BrowserlessNetworkError';
  }
}

export class BrowserlessServerError extends BrowserlessError {
  constructor(message: string = 'Server error') {
    super(message, 500, 'SERVER_ERROR');
    this.name = 'BrowserlessServerError';
  }
}

/**
 * Factory function to create appropriate error based on status code
 */
export function createBrowserlessError(
  message: string,
  statusCode?: number,
  code?: string,
  response?: any
): BrowserlessError {
  switch (statusCode) {
    case 401:
    case 403:
      return new BrowserlessAuthenticationError(message);
    case 408:
      return new BrowserlessTimeoutError(message);
    case 429:
      return new BrowserlessRateLimitError(message);
    case 400:
      return new BrowserlessValidationError(message);
    case 500:
    case 502:
    case 503:
    case 504:
      return new BrowserlessServerError(message);
    default:
      if (!statusCode || statusCode === 0) {
        return new BrowserlessNetworkError(message);
      }
      return new BrowserlessError(message, statusCode, code, response);
  }
}
