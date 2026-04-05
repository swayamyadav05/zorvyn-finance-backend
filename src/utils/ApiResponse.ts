interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T;
  public readonly meta?: PaginationMeta;

  constructor(message: string, data: T, meta?: PaginationMeta) {
    this.success = true;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }
}
