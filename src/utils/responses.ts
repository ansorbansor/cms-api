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
  const count = datax.total;
  const currentPage = datax.page;
  const limitRow = datax.limit;
  const totalPage = Math.ceil(count / limitRow);
  const nextPage =
    currentPage < totalPage
      ? currentPage + 1
      : currentPage == totalPage
      ? currentPage
      : null;
  const prevPage =
    currentPage > 1 ? currentPage - 1 : currentPage <= 1 ? 1 : null;
  const firstPage = 1;
  const lastPage = totalPage;
  const total = count;

  return {
    meta: {
      code: HttpStatus.OK,
      message: message,
    },
    data: datax.data,
    pagination: {
      current_page: currentPage,
      next_page: nextPage,
      prev_page: prevPage,
      first_page: firstPage,
      last_page: lastPage,
      limit: limitRow,
      total: total,
      total_page: totalPage,
    },
  };
};

export const infinityPagination = <T>(
  datas: T[],
  resourcex: { (any, any1): any },
  options: IPaginationOptions,
) => {
  const returnedData = datas.map((data) => {
    return resourcex(data, options.user_id);
  });

  return {
    data: returnedData,
    page: options.page,
    limit: options.limit,
    total: options.total,
  };
};
