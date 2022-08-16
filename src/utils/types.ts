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
  [key in keyof DeepPartial<T>]: number | string | EntityCondition<T>;
};

export interface IPaginationOptions {
  page: number;
  limit: number;
  total?: number;
  search?: string;
}
