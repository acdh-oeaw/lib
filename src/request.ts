import { HttpError } from "./error.js";
import { promise } from "./promise.js";
import { wait } from "./wait.js";

type Fetch = typeof globalThis.fetch;

interface Hooks {
	beforeRequest?: (context: RequestContext) => Promise<void> | void;
	beforeRetry?: (context: RequestContext) => Promise<void> | void;
	beforeError?: (context: RequestContext) => Promise<void> | void;
	afterResponse?: (context: RequestContext) => Promise<void> | void;
}

type HttpMethod = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

type ResponseType =
	| "arrayBuffer"
	| "blob"
	| "formData"
	| "json"
	| "raw"
	| "stream"
	| "text"
	| "void";

interface RetryConfig {
	delay?: (context: RequestContext) => number;
	shouldRetry?: (context: RequestContext) => boolean;
}

const retryMethods = new Set(["delete", "get", "head", "options", "put", "trace"]);

const retryStatusCodes = new Set([408, 409, 413, 425, 429, 500, 502, 503, 504]);

function shouldRetry(context: RequestContext) {
	if (context.count >= 3) {
		return false;
	}

	if (context.response == null || !(context.error instanceof HttpError)) {
		return false;
	}

	if (!retryMethods.has(context.request.method)) {
		return false;
	}

	if (!retryStatusCodes.has(context.response.status)) {
		return false;
	}

	const header = context.response.headers.get("retry-after");

	if (context.response.status === 413 && header == null) {
		return false;
	}

	if (header != null) {
		const delay = Number(header);

		if (delay < 1 || delay > 10_000) {
			return false;
		}
	}

	return true;
}

function delay(context: RequestContext) {
	const header = context.response?.headers.get("retry-after");

	if (header != null) {
		return Number(header);
	}

	return 250;
}

const defaultRetryConfig: Required<RetryConfig> = {
	delay,
	shouldRetry,
};

const contentTypes = {
	json: new Set(["application/json", "application/ld+json"]),
	text: new Set([
		"application/html",
		"application/xhtml+xml",
		"application/xml",
		"image/svg+xml",
		"text/html",
		"text/plain",
		"text/xml",
	]),
};

function getContentType(context: RequestContext): ResponseType {
	const header = context.response?.headers.get("content-type")?.split(";", 1).at(0);

	if (header == null) {
		return "void";
	}

	if (contentTypes.json.has(header)) {
		return "json";
	}

	if (contentTypes.text.has(header)) {
		return "text";
	}

	return "raw";
}

interface RequestContext {
	count: number;
	fetch: Fetch;
	request: Request;
	response: Response | null;
	error: Error | null;
}

export interface RequestConfig extends Omit<RequestInit, "body"> {
	body?: Record<string, unknown> | RequestInit["body"];
	/** @internal */
	count?: number;
	fetch?: Fetch;
	hooks?: Hooks;
	method?: HttpMethod;
	responseType?: ResponseType | ((context: RequestContext) => ResponseType);
	retries?: RetryConfig;
	/** @default 10_000 */
	timeout?: number | false;
}

interface ResponseTypeToReturnType {
	arrayBuffer: ArrayBuffer;
	blob: Blob;
	formData: FormData;
	json: unknown;
	raw: Response;
	// eslint-disable-next-line n/no-unsupported-features/node-builtins
	stream: ReadableStream<Uint8Array> | null;
	text: string;
	void: null;
}

export async function request<T extends ResponseType>(
	input: RequestInfo | URL,
	config: RequestConfig & { responseType?: T | ((context: RequestContext) => T) },
): Promise<ResponseTypeToReturnType[T]>;

export async function request(input: RequestInfo | URL, config: RequestConfig): Promise<unknown> {
	const {
		count = 0,
		fetch = globalThis.fetch.bind(globalThis),
		hooks,
		responseType = getContentType,
		retries,
		timeout = 10_000,
		...options
	} = config;

	const controller = new AbortController();

	if (options.signal != null) {
		const signal = options.signal;

		if (signal.aborted) {
			controller.abort(signal.reason);
		} else {
			// TODO: remove event listener
			signal.addEventListener(
				"abort",
				() => {
					controller.abort(signal.reason);
				},
				{ once: true },
			);
		}
	}

	options.signal = controller.signal;

	const timer =
		timeout !== false
			? setTimeout(() => {
					const reason = new DOMException("TimeoutError", "TimeoutError");
					controller.abort(reason);
				}, timeout)
			: null;

	// TODO: Need to merge headers when `input` is instanceof `Request`.
	options.headers = new Headers(options.headers);

	if (!options.headers.has("accept")) {
		if (responseType === "json") {
			options.headers.set("accept", "application/json");
		} else if (responseType === "text") {
			options.headers.set("accept", "text/*");
		} else if (responseType === "formData") {
			options.headers.set("accept", "multipart/form-data");
		} else {
			options.headers.set("accept", "*/*");
		}
	}

	if (options.body !== null && typeof options.body === "object") {
		if (options.body.constructor.name === "Object") {
			options.body = JSON.stringify(options.body);

			if (!options.headers.has("content-type")) {
				options.headers.set("content-type", "application/json");
			}
		} else if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
			options.headers.delete("content-type");
		}
	}

	const context: RequestContext = {
		count,
		fetch,
		request: new Request(input, options as RequestInit),
		response: null,
		error: null,
	};

	if (hooks?.beforeRequest != null) {
		await hooks.beforeRequest(context);
	}

	try {
		context.response ??= await context.fetch(context.request);

		if (!context.response.ok) {
			throw new HttpError(context.request, context.response);
		}

		if (hooks?.afterResponse != null) {
			await hooks.afterResponse(context);
		}

		const contentType = typeof responseType === "function" ? responseType(context) : responseType;

		if (
			contentType === "json" &&
			(context.response.status === 204 || context.response.headers.get("content-length") === "0")
		) {
			return "";
		} else if (contentType === "raw") {
			return context.response;
		} else if (contentType === "stream") {
			return context.response.body;
		} else if (contentType === "void") {
			return null;
		}

		// eslint-disable-next-line @typescript-eslint/return-await, @typescript-eslint/no-unsafe-return
		return context.response[contentType]();
	} catch (error) {
		context.error = error as Error;

		const retryConfig = { ...defaultRetryConfig, ...retries };

		if (retryConfig.shouldRetry(context)) {
			const delay = retryConfig.delay(context);

			const { error } = await promise(() => {
				return wait(delay, controller.signal);
			});

			if (error == null) {
				if (hooks?.beforeRetry != null) {
					await hooks.beforeRetry(context);
				}

				// eslint-disable-next-line @typescript-eslint/return-await
				return request(context.request, { count: count + 1 });
			} else {
				context.error = error as Error;
			}
		}

		if (hooks?.beforeError != null) {
			await hooks.beforeError(context);
		}

		throw context.error;
	} finally {
		if (timer != null) {
			clearTimeout(timer);
		}
	}
}
