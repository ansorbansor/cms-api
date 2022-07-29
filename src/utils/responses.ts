import { HttpException } from '@nestjs/common';
import { IPaginationOptions } from './types';

export const successResponse = <T>(data: T, message: string) => {
  return {
    meta: {
      message: message,
    },
    data: data,
  };
};

export const failedResponse = (status: number, message: string) => {
  return new HttpException(
    {
      errors: {
        status: status,
        message: message,
      },
    },
    status,
  );
};

export const infinityPagination = <T>(
  datas: T[],
  resourcex: { (any): any },
  options: IPaginationOptions,
) => {
  const returnedData = datas.map((data) => {
    return resourcex(data);
  });

  return {
    data: returnedData,
    page: options.page,
    hasNextPage: returnedData.length === options.limit,
  };
};
