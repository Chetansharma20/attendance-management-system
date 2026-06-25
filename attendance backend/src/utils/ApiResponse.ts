class ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors: any[];

  constructor(statusCode: number, data: T, message: string = "success", errors: any[] = []) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.errors = errors;
  }
}

export { ApiResponse };
