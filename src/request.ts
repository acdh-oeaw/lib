import type { StandardSchemaV1 } from "@standard-schema/spec";

export type HttpMethod = "delete" | "get" | "head" | "options" | "patch" | "post" | "put";

interface ResponseTypes {
	bytes: Uint8Array<ArrayBuffer>;
	json: unknown;
	text: string;
	void: undefined;
}

export type ResponseType = keyof ResponseTypes;

/** @see {@link https://github.com/oven-sh/bun/issues/23741#issuecomment-3410060027} */
type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

type RequestBody =
	| { body?: BodyInit; json?: never }
	| {
			body?: never;
			/** Serialized with `JSON.stringify`, and sent with a json `content-type`. */
			json: unknown;
	  };

interface BaseRequestOptions extends Omit<RequestInit, "body" | "method" | "signal"> {
	fetch?: Fetch;
	/** @default "get" */
	method?: HttpMethod;
	/**
	 * Retries after network errors, and http 408, 429 and 5xx, for safe methods only. Waits with exponential backoff, or
	 * as long as a `retry-after` header asks, if that fits within the `timeout` and is at most a minute.
	 *
	 * @default 0
	 */
	retries?: number;
	signal?: AbortSignal;
	/**
	 * Milliseconds for the whole request, including retries and reading the body.
	 *
	 * @default 10_000
	 */
	timeout?: number | false;
}

export type RequestOptions<
	TResponseType extends ResponseType = ResponseType,
	TSchema extends StandardSchemaV1 | undefined = undefined,
> = BaseRequestOptions &
	RequestBody & {
		responseType: TResponseType;
		/** Validates a json response body, with any [Standard Schema](https://standardschema.dev), like valibot or zod. */
		schema?: TResponseType extends "json" ? TSchema : never;
	};

export interface RequestResponse<TData> {
	data: TData;
	headers: Headers;
}

type ResponseData<TResponseType extends ResponseType, TSchema> = TResponseType extends "json"
	? TSchema extends StandardSchemaV1
		? StandardSchemaV1.InferOutput<TSchema>
		: unknown
	: ResponseTypes[TResponseType];

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const retryableStatusCodes = new Set([408, 429, 500, 502, 503, 504]);

const errorBodyBytes = 4096;

const maxRetryDelay = 60_000;

/**
 * Throws a `RequestError` subclass for errors at runtime, like an unreachable server or an error status. Invalid
 * arguments, like a malformed url, throw as they are, because they are bugs.
 */
export async function request<
	TResponseType extends ResponseType,
	TSchema extends StandardSchemaV1 | undefined = undefined,
>(
	url: URL | string,
	options: RequestOptions<TResponseType, TSchema>,
): Promise<RequestResponse<ResponseData<TResponseType, TSchema>>> {
	const {
		body: _body,
		fetch = globalThis.fetch,
		headers: _headers,
		json,
		method: _method = "get",
		responseType,
		retries = 0,
		schema,
		signal: callerSignal,
		timeout = 10_000,
		...init
	} = options;

	const method = _method.toUpperCase();
	const href = String(url);
	const headers = new Headers(_headers);

	let body: BodyInit | null = _body ?? null;

	if (json !== undefined) {
		body = JSON.stringify(json);
		if (!headers.has("content-type")) {
			headers.set("content-type", "application/json");
		}
	}

	if (responseType === "json" && !headers.has("accept")) {
		headers.set("accept", "application/json");
	}

	const startedAt = performance.now();
	/** Combines the caller's signal and the timeout without `AbortSignal.any`, which older browsers don't support. */
	const controller = new AbortController();
	const { signal } = controller;

	const timer =
		timeout !== false
			? setTimeout(() => {
					controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
				}, timeout)
			: undefined;

	function onCallerAbort() {
		controller.abort(callerSignal?.reason);
	}

	if (callerSignal?.aborted === true) {
		onCallerAbort();
	} else {
		callerSignal?.addEventListener("abort", onCallerAbort, { once: true });
	}

	/** A stream can only be sent once. */
	const canRetry = safeMethods.has(method) && !(body instanceof ReadableStream);

	function toRequestError(error: unknown) {
		const options = { cause: error, method, url: href };

		if (callerSignal?.aborted === true) {
			return new AbortError({ ...options, cause: callerSignal.reason });
		}

		/** Otherwise only the timeout aborts the signal. */
		if (signal.aborted || isBunSocketTimeout(error)) {
			return new TimeoutError(options);
		}

		if (isNetworkError(error)) {
			return new NetworkError(options);
		}

		return null;
	}

	try {
		for (let attempt = 0; ; attempt++) {
			let failure: HttpError | NetworkError;

			try {
				const response = await fetch(href, { ...init, body, headers, method, signal });

				if (response.ok) {
					const data = await readBody(response);
					return { data: data as ResponseData<TResponseType, TSchema>, headers: response.headers };
				}

				const errorBody = await readStart(response, errorBodyBytes);
				/** `readStart` ignores errors, so a timeout or abort while reading would otherwise become an `HttpError`. */
				signal.throwIfAborted();
				failure = new HttpError({ body: errorBody, method, response, url: href });
			} catch (error) {
				if (error instanceof ParseError || error instanceof ValidationError) {
					throw error;
				}

				const requestError = toRequestError(error);

				if (requestError == null) {
					throw error;
				}

				if (!(requestError instanceof NetworkError)) {
					throw requestError;
				}

				failure = requestError;
			}

			const delay = attempt < retries && canRetry ? getRetryDelay(failure, attempt) : null;
			const remaining = timeout !== false ? timeout - (performance.now() - startedAt) : Infinity;

			if (delay == null || delay >= remaining) {
				throw failure;
			}

			try {
				await sleep(delay, signal);
			} catch (error) {
				throw toRequestError(error) ?? (error as Error);
			}
		}
	} finally {
		clearTimeout(timer);
		callerSignal?.removeEventListener("abort", onCallerAbort);
	}

	async function readBody(response: Response): Promise<unknown> {
		if (responseType === "void" || method === "HEAD") {
			await discardBody(response);
			return undefined;
		}

		let data: unknown;

		try {
			if (responseType === "bytes") {
				data = new Uint8Array(await response.arrayBuffer());
			} else if (responseType === "text") {
				data = await response.text();
			} else {
				/** An empty body, like for http 204, has no json value. */
				const text = await response.text();
				data = text === "" ? undefined : JSON.parse(text);
			}
		} catch (error) {
			if (toRequestError(error) != null) {
				throw error;
			}

			throw new ParseError({ cause: error, method, url: href });
		}

		if (responseType !== "json" || schema == null) {
			return data;
		}

		const result = await schema["~standard"].validate(data);

		if (result.issues != null) {
			throw new ValidationError({ issues: result.issues, method, url: href });
		}

		return result.value;
	}
}

function getRetryDelay(error: HttpError | NetworkError, attempt: number): number | null {
	if (error instanceof HttpError) {
		if (!retryableStatusCodes.has(error.status)) {
			return null;
		}

		const retryAfter = parseRetryAfter(error.headers.get("retry-after"));

		if (retryAfter != null) {
			return retryAfter <= maxRetryDelay ? retryAfter : null;
		}
	}

	/** Up to 30% shorter, so that clients which failed together don't retry together. */
	return Math.min(300 * 2 ** attempt, maxRetryDelay) * (1 - Math.random() * 0.3);
}

/** Either seconds or an http date. */
function parseRetryAfter(value: string | null): number | null {
	if (value == null) {
		return null;
	}

	if (/^\d+$/.test(value)) {
		return Number(value) * 1000;
	}

	const date = Date.parse(value);

	return Number.isNaN(date) ? null : Math.max(date - Date.now(), 0);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		signal.throwIfAborted();

		const controller = new AbortController();

		const timer = setTimeout(() => {
			controller.abort();
			resolve();
		}, ms);

		signal.addEventListener(
			"abort",
			() => {
				clearTimeout(timer);
				reject(signal.reason as Error);
			},
			{ once: true, signal: controller.signal },
		);
	});
}

/** Releases an unread body, so that its connection goes back to the pool. */
async function discardBody(response: Response): Promise<void> {
	try {
		await response.body?.cancel();
	} catch {
		/** Already released. */
	}
}

/** Reads up to `bytes` of the body as text, and discards the rest. */
async function readStart(response: Response, bytes: number): Promise<string> {
	if (response.body == null) {
		return "";
	}

	const reader = response.body.getReader();
	const chunks: Array<Uint8Array> = [];
	let length = 0;

	try {
		while (length < bytes) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			chunks.push(value);
			length += value.byteLength;
		}
	} catch {
		/** The start of the body is only informational. */
	} finally {
		await reader.cancel().catch(() => undefined);
	}

	const data = new Uint8Array(Math.min(length, bytes));
	let offset = 0;

	for (const chunk of chunks) {
		const part = chunk.subarray(0, data.length - offset);
		data.set(part, offset);
		offset += part.length;
	}

	return new TextDecoder().decode(data);
}

/** Works across realms, unlike `instanceof`, and in browsers without `Error.isError`. */
function isTypeError(error: unknown): error is TypeError {
	return (
		Object.prototype.toString.call(error) === "[object Error]" &&
		(error as Error).name === "TypeError"
	);
}

/** Bun rejects with a `TypeError` with code `Timeout` when its socket idle timeout fires. */
function isBunSocketTimeout(error: unknown): boolean {
	return isTypeError(error) && "code" in error && error.code === "Timeout";
}

/** Bun sets these codes on the `TypeError`, Node.js on its `cause`, which is matched by message. */
const networkErrorCodes = new Set([
	"EAI_AGAIN",
	"ECONNABORTED",
	"ECONNREFUSED",
	"ECONNRESET",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"ENOTFOUND",
	"EPIPE",
	"ETIMEDOUT",
]);

const networkErrorMessages = new Set([
	"Failed to fetch",
	"fetch failed",
	"Network connection lost",
	"network error",
	"Network request failed",
	"NetworkError when attempting to fetch resource.",
	"terminated",
	"The Internet connection appears to be offline.",
]);

/**
 * Fetch rejects with a `TypeError` for network errors, but also for invalid requests, so match known codes and
 * messages. Messages adapted from `is-network-error` (MIT).
 *
 * @see {@link https://github.com/sindresorhus/is-network-error}
 */
function isNetworkError(error: unknown): boolean {
	if (!isTypeError(error)) {
		return false;
	}

	if ("code" in error && typeof error.code === "string" && networkErrorCodes.has(error.code)) {
		return true;
	}

	/** Safari also uses this message for other errors, which have a stack. */
	if (error.message === "Load failed") {
		return error.stack === undefined;
	}

	return (
		networkErrorMessages.has(error.message) ||
		error.message.startsWith("error sending request for url")
	);
}

interface RequestErrorOptions {
	cause?: unknown;
	method: string;
	url: string;
}

/** Removes credentials in the url, like `https://user:password@example.com`, which would end up in logs. */
function redactUrl(url: string): string {
	let parsed: URL;

	try {
		parsed = new URL(url);
	} catch {
		/** Relative urls have no credentials. */
		return url;
	}

	if (parsed.username === "" && parsed.password === "") {
		return url;
	}

	parsed.username = "";
	parsed.password = "";

	return parsed.href;
}

export abstract class RequestError extends Error {
	abstract override readonly name: string;
	readonly method: string;
	/** Without credentials. */
	readonly url: string;

	constructor(message: string, options: RequestErrorOptions) {
		const url = redactUrl(options.url);
		super(`${message} - ${options.method} ${url}`, { cause: options.cause });
		this.method = options.method;
		this.url = url;
	}
}

/** The caller's `signal` aborted. */
export class AbortError extends RequestError {
	override readonly name = "AbortError";

	constructor(options: RequestErrorOptions) {
		super("Request aborted", options);
	}
}

/** The request did not finish within its `timeout`, including retries. */
export class TimeoutError extends RequestError {
	override readonly name = "TimeoutError";

	constructor(options: RequestErrorOptions) {
		super("Request timed out", options);
	}
}

/** The server could not be reached, or the connection dropped. */
export class NetworkError extends RequestError {
	override readonly name = "NetworkError";

	constructor(options: RequestErrorOptions) {
		super("Network error", options);
	}
}

/** The response has an error status. `body` holds the start of the response body, the rest is discarded. */
export class HttpError extends RequestError {
	override readonly name = "HttpError";
	readonly status: number;
	readonly headers: Headers;
	readonly body: string;

	constructor(options: RequestErrorOptions & { body: string; response: Response }) {
		const { body, response } = options;
		super(`${String(response.status)} ${response.statusText}`, options);
		this.status = response.status;
		this.headers = response.headers;
		this.body = body;
	}
}

/** The response body is not valid, like malformed json. */
export class ParseError extends RequestError {
	override readonly name = "ParseError";

	constructor(options: RequestErrorOptions) {
		super("Invalid response body", options);
	}
}

/** The response body does not match the `schema`. */
export class ValidationError extends RequestError {
	override readonly name = "ValidationError";
	readonly issues: ReadonlyArray<StandardSchemaV1.Issue>;

	constructor(options: RequestErrorOptions & { issues: ReadonlyArray<StandardSchemaV1.Issue> }) {
		super("Unexpected response body", options);
		this.issues = options.issues;
	}
}

/** Gateway statuses, which mean that a service behind the server is not available. */
const serviceUnavailableStatuses = new Set([502, 503, 504]);

/** The service could not be reached or did not respond in time, so retrying later may succeed. */
export function isServiceUnavailableError(error: unknown): boolean {
	return (
		error instanceof TimeoutError ||
		error instanceof NetworkError ||
		(error instanceof HttpError && serviceUnavailableStatuses.has(error.status))
	);
}
