import isNetworkError from "is-network-error";

import { err, ok, type Result } from "./result.ts";
import { wait } from "./wait.ts";

export type ResponseType =
	| "arrayBuffer"
	| "blob"
	| "formData"
	| "json"
	| "raw"
	| "stream"
	| "text"
	| "void";

export type HttpMethod = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

/**
 * We rely on `JSON.stringify` semantics for treating `undefined`, and don't want type errors for
 * `undefined` values in objects.
 */
type JsonPrimitive = string | number | boolean | null | undefined;
type JsonValue = JsonPrimitive | Array<JsonValue> | { [key: string]: JsonValue };

export type RequestBody = BodyInit | JsonValue | null;

export interface RequestOptions<TResponseType extends ResponseType> extends Omit<
	RequestInit,
	"body" | "method"
> {
	body?: RequestBody;
	fetch?: typeof globalThis.fetch;
	method?: HttpMethod;
	responseType: TResponseType;
	/**
	 * @default 0
	 */
	retries?: number;
	/**
	 * Timeout in milliseconds.
	 *
	 * @default 10_000
	 */
	timeout?: number | false;
}

export type RequestError = AbortError | HttpError | NetworkError | TimeoutError;

export type RequestResult<TData> = Result<{ data: TData; headers: Headers }, RequestError>;

/** ===============================================================================================
 * Request.
 =============================================================================================== */

export async function request(
	url: URL,
	options: RequestOptions<"arrayBuffer">,
): Promise<RequestResult<ArrayBuffer>>;

export async function request(
	url: URL,
	options: RequestOptions<"blob">,
): Promise<RequestResult<Blob>>;

export async function request(
	url: URL,
	options: RequestOptions<"formData">,
): Promise<RequestResult<FormData>>;

export async function request(
	url: URL,
	options: RequestOptions<"json">,
): Promise<RequestResult<unknown>>;

export async function request<TData>(
	url: URL,
	options: RequestOptions<"json">,
): Promise<RequestResult<TData>>;

export async function request(
	url: URL,
	options: RequestOptions<"raw">,
): Promise<RequestResult<Response>>;

export async function request(
	url: URL,
	options: RequestOptions<"stream">,
): Promise<RequestResult<ReadableStream<Uint8Array> | null>>;

export async function request(
	url: URL,
	options: RequestOptions<"text">,
): Promise<RequestResult<string>>;

export async function request(
	url: URL,
	options: RequestOptions<"void">,
): Promise<RequestResult<null>>;

export async function request(
	url: URL,
	options: RequestOptions<ResponseType>,
): Promise<RequestResult<unknown>> {
	const {
		body: initBody,
		fetch = globalThis.fetch,
		headers: initHeaders,
		method: initMethod,
		responseType,
		retries = 0,
		signal: externalSignal,
		timeout = 10_000,
		...fetchOptions
	} = options;

	const method = initMethod != null ? (initMethod.toUpperCase() as Uppercase<HttpMethod>) : "GET";

	const headers = new Headers(initHeaders);

	if (!headers.has("accept")) {
		if (responseType === "json") {
			headers.set("accept", "application/json");
		} else if (responseType === "text") {
			headers.set("accept", "text/plain");
		} else {
			headers.set("accept", "*/*");
		}
	}

	let body: BodyInit | null = null;

	if (initBody !== undefined) {
		if (isJsonBody(initBody)) {
			body = JSON.stringify(initBody);

			if (!headers.has("content-type")) {
				headers.set("content-type", "application/json");
			}
		} else {
			body = initBody;
		}
	}

	let attempts = 0;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		const timeoutSignal = timeout === false ? undefined : AbortSignal.timeout(timeout);

		const signal =
			externalSignal && timeoutSignal
				? AbortSignal.any([externalSignal, timeoutSignal])
				: (externalSignal ?? timeoutSignal ?? null);

		const request = new Request(url, { ...fetchOptions, body, headers, method, signal });

		try {
			const response = await fetch(request);

			if (!response.ok) {
				throw new HttpError(request, response);
			}

			if (method === "HEAD") {
				const data = null;
				return ok({ data, headers: response.headers });
			}

			switch (responseType) {
				case "json": {
					if (response.status === 204 || response.headers.get("content-length") === "0") {
						await response.body?.cancel();
						const data = null;
						return ok({ data, headers: response.headers });
					}

					const data = (await response.json()) as unknown;
					return ok({ data, headers: response.headers });
				}

				case "void": {
					await response.body?.cancel();
					const data = null;
					return ok({ data, headers: response.headers });
				}

				case "raw": {
					const data = response;
					return ok({ data, headers: response.headers });
				}

				case "stream": {
					const data = response.body;
					return ok({ data, headers: response.headers });
				}

				case "text": {
					const data = await response.text();
					return ok({ data, headers: response.headers });
				}

				case "arrayBuffer": {
					const data = await response.arrayBuffer();
					return ok({ data, headers: response.headers });
				}

				case "blob": {
					const data = await response.blob();
					return ok({ data, headers: response.headers });
				}

				case "formData": {
					const data = await response.formData();
					return ok({ data, headers: response.headers });
				}
			}
		} catch (error) {
			attempts += 1;

			if (error instanceof Error) {
				/** error instanceof DOMException */
				if (
					error.name === "TimeoutError" ||
					/** Older implementations did not use "TimeoutError". */
					timeoutSignal?.aborted
				) {
					return err(new TimeoutError(request, error));
				}

				/** error instanceof DOMException */
				if (error.name === "AbortError") {
					return err(new AbortError(request, error));
				}

				const retry = shouldRetry(error, attempts, retries);

				if (retry != null) {
					await wait(retry.delay, externalSignal ?? undefined);
					continue;
				}

				if (error instanceof HttpError) {
					return err(error);
				}

				if (isNetworkError(error)) {
					return err(new NetworkError(request, error));
				}
			}

			throw error;
		}
	}
}

/** ===============================================================================================
 * Errors.
 =============================================================================================== */

/** HttpError. */
export class HttpError extends Error {
	private static readonly type = "HttpError" as const;
	request: Request;
	response: Response;

	static is(error: unknown): error is HttpError {
		if (error instanceof HttpError) {
			return true;
		}

		return error instanceof Error && error.name === HttpError.type;
	}

	constructor(
		request: Request,
		response: Response,
		message = `${response.statusText} (${String(response.status)}) for ${request.method} ${request.url}`,
	) {
		super(message);

		this.name = HttpError.type;
		this.request = request;
		this.response = response;
	}
}

/** AbortError. */
export class AbortError extends Error {
	private static readonly type = "AbortError" as const;
	request: Request;

	static is(error: unknown): error is AbortError {
		if (error instanceof AbortError) {
			return true;
		}

		return error instanceof Error && error.name === AbortError.type;
	}

	constructor(
		request: Request,
		cause: Error,
		message = `Request aborted for ${request.method} ${request.url}`,
	) {
		super(message, { cause });

		this.name = AbortError.type;
		this.request = request;
	}
}

/** TimeoutError. */
export class TimeoutError extends Error {
	private static readonly type = "TimeoutError" as const;
	request: Request;

	static is(error: unknown): error is TimeoutError {
		if (error instanceof TimeoutError) {
			return true;
		}

		return error instanceof Error && error.name === TimeoutError.type;
	}

	constructor(
		request: Request,
		cause: Error,
		message = `Request timed out for ${request.method} ${request.url}`,
	) {
		super(message, { cause });

		this.name = TimeoutError.type;
		this.request = request;
	}
}

/** NetworkError. */
export class NetworkError extends Error {
	private static readonly type = "NetworkError" as const;
	request: Request;

	static is(error: unknown): error is NetworkError {
		if (error instanceof NetworkError) {
			return true;
		}

		return error instanceof Error && error.name === NetworkError.type;
	}

	constructor(
		request: Request,
		cause: Error,
		message = `Network error for ${request.method} ${request.url}`,
	) {
		super(message, { cause });

		this.name = NetworkError.type;
		this.request = request;
	}
}

/** ===============================================================================================
 * Utilities.
 =============================================================================================== */

function isJsonBody(body: unknown): body is JsonValue {
	if (body === null) {
		return true;
	}

	if (typeof body !== "object") {
		return false;
	}

	/** BodyInit. */
	if (
		body instanceof ArrayBuffer ||
		body instanceof Blob ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		body instanceof ReadableStream
	) {
		return false;
	}

	return true;
}

function backoff(attempts: number): number {
	return 1000 * Math.pow(2, attempts - 1) * 0.3;
}

/**
 * In rest apis, only `patch` and `post` are not idempotent.
 * However, in rpc apis, `delete` and `put` may have side-effects as well.
 */
const retryMethods = new Set<Uppercase<HttpMethod>>([
	// "DELETE",
	"GET",
	"HEAD",
	"OPTIONS",
	// "PATCH",
	// "POST",
	// "PUT",
	"TRACE",
]);

const retryStatusCodes = new Set([
	408, 413, 429, 500, 502, 503, 504, /** The following are cloudflare-specific status codes. */ 521,
	522, 524,
]);

const retryAfterStatusCodes = new Set([413, 429, 503]);

function getRetryAfterDelay(response: Response): number | null {
	if (!retryAfterStatusCodes.has(response.status)) {
		return null;
	}

	const retryAfter = response.headers.get("retry-after");

	if (retryAfter == null) {
		return null;
	}

	/** The `retry-after` header can be specified as a date, or in seconds. */
	const seconds = Number(retryAfter);

	if (!Number.isNaN(seconds)) {
		return 1000 * seconds;
	}

	const timestamp = new Date(retryAfter).getTime();

	if (!Number.isNaN(timestamp)) {
		return timestamp - Date.now();
	}

	return null;
}

function shouldRetry(error: unknown, attempt: number, retries: number): { delay: number } | null {
	if (attempt >= retries + 1) {
		return null;
	}

	if (error instanceof HttpError) {
		if (
			retryMethods.has(error.request.method as Uppercase<HttpMethod>) &&
			retryStatusCodes.has(error.response.status)
		) {
			const retryAfter = getRetryAfterDelay(error.response);

			if (retryAfter != null) {
				return { delay: retryAfter };
			}

			if (error.response.status === 413) {
				return null;
			}

			return { delay: backoff(attempt) };
		}
	}

	if (isNetworkError(error)) {
		return { delay: backoff(attempt) };
	}

	return null;
}

export function getContentType(response: Response): string | null {
	const contentTypeHeader = response.headers.get("content-type");

	return contentTypeHeader?.split(";").at(0)?.trim() ?? null;
}

/** ===============================================================================================
 * Polyfills.
 *
 * @see {@link https://caniuse.com/mdn-api_abortsignal_any_static}
 * @see {@link https://caniuse.com/mdn-api_abortsignal_timeout_static}
 =============================================================================================== */

if (!Object.prototype.hasOwnProperty.call(AbortSignal, "timeout")) {
	AbortSignal.timeout = function timeout(ms: number): AbortSignal {
		const controller = new AbortController();

		setTimeout(() => {
			controller.abort(new DOMException("TimeoutError", "TimeoutError"));
		}, ms);

		return controller.signal;
	};
}

if (!Object.prototype.hasOwnProperty.call(AbortSignal, "any")) {
	AbortSignal.any = function any(signals: Array<AbortSignal>): AbortSignal {
		const controller = new AbortController();

		function onAbort(this: AbortSignal) {
			controller.abort(this.reason);
			cleanup();
		}

		function cleanup() {
			for (const signal of signals) {
				signal.removeEventListener("abort", onAbort);
			}
		}

		for (const signal of signals) {
			if (signal.aborted) {
				controller.abort(signal.reason);
				cleanup();
				break;
			}

			signal.addEventListener("abort", onAbort, { once: true });
		}

		return controller.signal;
	};
}
