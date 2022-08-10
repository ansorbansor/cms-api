import { HttpException, HttpStatus } from '@nestjs/common';
import { IPaginationOptions } from './types';

export const successResponse = <T>(data: T, message: string) => {
  return {
    meta: {
      code: HttpStatus.OK,
      message: message,
    },
    data: data,
  };
};

export const failedResponse = (status: number, message: string) => {
  return new HttpException(
    {
      meta: {
        code: status,
        message: message,
      },
      data: null,
    },
    status,
  );
};

export const successResponseList = (datax: any, message: string) => {
  return {
    meta: {
      code: HttpStatus.OK,
      message: message,
    },
    data: datax.data,
    page: datax.page,
    hasNextPage: datax.hasNextPage,
  };
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
