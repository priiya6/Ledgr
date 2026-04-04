export interface PaginationInput {
  page: number;
  limit: number;
}

export const getPagination = ({ page, limit }: PaginationInput) => ({
  skip: (page - 1) * limit,
  take: limit,
});
