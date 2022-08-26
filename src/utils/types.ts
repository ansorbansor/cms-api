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
  provider?: number[];
  category?: number[];
  topic?: number[];
  level?: number[];
  duration?: number[];
  language?: number[];
  price?: number[];
  schedule?: number[];
  rating?: number[];
  liked_by?: number;
  user_id?: number;
  owned?: boolean;
  liked?: boolean;
  blacklist?: boolean;
  status?: number;
}
