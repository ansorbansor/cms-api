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
  const lastPage = totalPage;
  const nextPage = currentPage < totalPage ? currentPage + 1 : null;
  const prevPage =
    currentPage > 1 && currentPage <= lastPage ? currentPage - 1 : null;
  const firstPage = 1;
  const total = count;
  const from =
    prevPage || nextPage
      ? prevPage * limitRow < total
        ? currentPage > 1
          ? 1 + prevPage * limitRow
          : 1
        : null
      : null;
  const to =
    currentPage * limitRow < total
      ? currentPage * limitRow
      : from
      ? from - 1 + (total % limitRow)
      : null;

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
      from: from,
      to: to,
    },
  };
};

export const successResponseListWithoutPaginate = (
  datax: [],
  message: string,
) => {
  return {
    meta: {
      code: HttpStatus.OK,
      message: message,
    },
    data: datax,
  };
};

export const infinityPagination = <T>(
  datas: T[],
  resourcex: { (any, any1?, any2?): any },
  options: IPaginationOptions,
  courseCount?: any,
) => {
  const returnedData = datas.map((data) => {
    return resourcex(
      data,
      options && options.user_id ? options.user_id : null,
      courseCount,
    );
  });

  return {
    data: returnedData,
    page: options && options.page ? options.page : 1,
    limit: options && options.limit ? options.limit : 0,
    total: options && options.total ? options.total : 0,
  };
};
