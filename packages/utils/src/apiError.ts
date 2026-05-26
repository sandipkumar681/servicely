export class ApiError extends Error {
  statusCode: number;
  data: null;
  errors: (string | object)[];
  success: false;

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: (string | object)[] = [],
    stack: string = "",
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.errors = errors;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      // @ts-ignore
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
