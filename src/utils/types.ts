export declare type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]> | T[P];
};

export type FindOptions<T> = {
  where: EntityCondition<T>;
};

export type EntityCondition<T> = {
  [key in keyof DeepPartial<T>]: number | string | boolean | EntityCondition<T>;
};

export interface IPaginationOptions {
  page: number;
  limit: number;
  total?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  role?: number[];
  provider?: string[];
  user_id?: number;
  status?: number;
  status_bool?: boolean;
  status_string?: string;
  is_admin?: boolean;
  employeePosition?: number;
  type?: number;
  source?: string;
}
