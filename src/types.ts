export type Fn<
	TParams extends Array<unknown> = Array<unknown>,
	TResult = unknown,
	TThisContext = unknown,
> = (this: TThisContext, ...params: TParams) => TResult;

export type Nullable<T> = T | null | undefined;

export type Primitive = boolean | number | string;

export type TimerId = ReturnType<typeof setTimeout>;
