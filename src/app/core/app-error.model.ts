export interface AppError {
  status: number;
  title: string;
  detail: string;
  codigo?: string;
  campos?: Record<string, string>;
}
