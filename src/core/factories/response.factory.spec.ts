import { ResponseFactory } from './response.factory';

describe('ResponseFactory', () => {
  it('wraps a single item in a data object', () => {
    expect(ResponseFactory.data({ id: 1 })).toEqual({
      data: { id: 1 },
    });
  });

  it('wraps an array in a data object', () => {
    expect(ResponseFactory.dataArray([{ id: 1 }, { id: 2 }])).toEqual({
      data: [{ id: 1 }, { id: 2 }],
    });
  });

  it('wraps paginated data with meta', () => {
    expect(
      ResponseFactory.dataPage([{ id: 1 }], {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
      }),
    ).toEqual({
      data: [{ id: 1 }],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
      },
    });
  });
});
