import { createServer, type Server } from "node:net";
import { runInNewContext } from "node:vm";

import { expectTypeOf } from "expect-type";
import { suite } from "uvu";
import * as assert from "uvu/assert";
import * as v from "valibot";

import {
	AbortError,
	HttpError,
	isServiceUnavailableError,
	NetworkError,
	ParseError,
	request,
	TimeoutError,
	ValidationError,
} from "./request.ts";

const url = "https://example.com/api?page=2";

type Handler = (request: Request) => Response;

/** Records each request, and responds with the next handler, or the last one. */
function createFetch(...handlers: Array<Handler>) {
	const requests: Array<Request> = [];

	// eslint-disable-next-line @typescript-eslint/require-await
	async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		const request = new Request(input, init);
		requests.push(request);
		const handler = handlers[Math.min(requests.length, handlers.length) - 1];
		if (handler == null) {
			throw new Error("Missing handler.");
		}
		return handler(request);
	}

	return { fetch, requests };
}

/** Returns what the promise rejects with. */
async function getError(promise: Promise<unknown>): Promise<unknown> {
	try {
		await promise;
	} catch (error) {
		return error;
	}

	throw new Error("Expected the promise to reject.");
}

/** A response whose body stays open after `text`, and records whether it was cancelled. */
function createResponse(text: string, init?: ResponseInit) {
	const state = { isCancelled: false };

	const body = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new TextEncoder().encode(text));
		},
		cancel() {
			state.isCancelled = true;
		},
	});

	return { response: new Response(body, init), state };
}

/** Settles only when aborted. */
function fetchUntilAborted(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	return new Promise((_resolve, reject) => {
		init?.signal?.addEventListener("abort", () => {
			reject(init.signal?.reason as Error);
		});
	});
}

function throwError(error: Error): never {
	throw error;
}

/** Resolves with a port that refuses connections. */
async function getClosedPort(): Promise<number> {
	const server = await listen(createServer());
	const { port } = server.address() as { port: number };
	await close(server);
	return port;
}

function listen(server: Server): Promise<Server> {
	return new Promise((resolve) => {
		server.listen(0, "127.0.0.1", () => {
			resolve(server);
		});
	});
}

function close(server: Server): Promise<void> {
	return new Promise((resolve) => {
		server.close(() => {
			resolve();
		});
	});
}

function getUrl(server: Server): string {
	const { port } = server.address() as { port: number };
	return `http://127.0.0.1:${String(port)}/`;
}

/* ================================================================================================
 * Responses.
 * ============================================================================================= */

const test = suite("request");

test("returns json data and headers", async () => {
	const { fetch } = createFetch(() => Response.json({ id: 1 }, { headers: { "x-total": "1" } }));

	const response = await request(url, { fetch, responseType: "json" });

	assert.equal(response.data, { id: 1 });
	assert.is(response.headers.get("x-total"), "1");
});

test("validates json data with a standard schema", async () => {
	const { fetch } = createFetch(() => Response.json({ id: "1" }));
	const schema = v.object({ id: v.pipe(v.string(), v.transform(Number)) });

	const response = await request(url, { fetch, responseType: "json", schema });

	expectTypeOf(response.data).toEqualTypeOf<{ id: number }>();
	assert.is(response.data.id, 1);
});

test("validates json data with an async standard schema", async () => {
	const { fetch } = createFetch(() => Response.json({ id: "1" }));
	const schema = v.objectAsync({
		id: v.pipeAsync(
			v.string(),
			v.transformAsync((id) => Promise.resolve(Number(id))),
		),
	});

	const response = await request(url, { fetch, responseType: "json", schema });

	assert.is(response.data.id, 1);
});

test("only accepts a schema for json", async () => {
	const { fetch } = createFetch(() => new Response("1"));
	const schema = v.pipe(v.string(), v.transform(Number));

	// @ts-expect-error -- the schema would not apply
	const response = await request(url, { fetch, responseType: "text", schema });

	assert.is(response.data, "1");
});

test("throws a ValidationError for data that does not match the schema", async () => {
	const { fetch } = createFetch(() => Response.json({ id: 1 }));
	const schema = v.object({ id: v.string() });

	const error = await getError(request(url, { fetch, responseType: "json", schema }));

	assert.instance(error, ValidationError);
	assert.is((error as ValidationError).issues.length, 1);
});

test("throws a ParseError for malformed json", async () => {
	const { fetch } = createFetch(() => new Response("{"));

	const error = await getError(request(url, { fetch, responseType: "json" }));

	assert.instance(error, ParseError);
});

test("returns undefined for an empty json body", async () => {
	const { fetch } = createFetch(
		() => new Response(null, { status: 204 }),
		() => new Response(""),
	);

	const responses = [
		await request(url, { fetch, responseType: "json" }),
		await request(url, { fetch, responseType: "json" }),
	];

	assert.equal(
		responses.map((response) => response.data),
		[undefined, undefined],
	);
});

test("returns bytes", async () => {
	const { fetch } = createFetch(() => new Response("ok"));

	const response = await request(url, { fetch, responseType: "bytes" });

	assert.instance(response.data, Uint8Array);
	assert.is(new TextDecoder().decode(response.data), "ok");
});

test("does not accept both body and json", async () => {
	const { fetch, requests } = createFetch(() => new Response());

	// @ts-expect-error -- only one of them can be sent
	await request(url, { body: "body", fetch, json: {}, method: "post", responseType: "void" });

	assert.is(requests.length, 1);
});

test("sends a json body", async () => {
	const { fetch, requests } = createFetch(() => new Response());

	await request(url, { fetch, json: { id: 1 }, method: "post", responseType: "void" });

	assert.is(requests[0]?.headers.get("content-type"), "application/json");
	assert.is(await requests[0]?.text(), '{"id":1}');
});

test("only sets an accept header for json", async () => {
	const { fetch, requests } = createFetch(() => new Response("{}"));

	await request(url, { fetch, responseType: "json" });
	await request(url, { fetch, responseType: "text" });

	assert.equal(
		requests.map((request) => request.headers.get("accept")),
		["application/json", null],
	);
});

test("discards the body for responseType void", async () => {
	const { response, state } = createResponse("ignored");
	const { fetch } = createFetch(() => response);

	await request(url, { fetch, responseType: "void" });

	assert.ok(state.isCancelled);
});

test.run();

/* ================================================================================================
 * Errors.
 * ============================================================================================= */

const errors = suite("request errors");

errors("throws an HttpError with the start of the body, and discards the rest", async () => {
	const { response, state } = createResponse("x".repeat(10_000), {
		status: 404,
		statusText: "Not Found",
	});
	const { fetch } = createFetch(() => response);

	const error = await getError(request(url, { fetch, responseType: "text" }));

	assert.instance(error, HttpError);
	assert.is((error as HttpError).status, 404);
	assert.is((error as HttpError).body.length, 4096);
	assert.ok(state.isCancelled);
});

errors("includes the method and url in the message", async () => {
	const { fetch } = createFetch(
		() => new Response(null, { status: 500, statusText: "Internal Server Error" }),
	);

	const error = await getError(request(url, { fetch, responseType: "void" }));

	assert.is(
		(error as Error).message,
		"500 Internal Server Error - GET https://example.com/api?page=2",
	);
});

errors("leaves out credentials in the url", async () => {
	/** Node.js's `Request` rejects urls with credentials, Bun's sends them. */
	function fetch(): Promise<Response> {
		return Promise.resolve(new Response(null, { status: 401, statusText: "Unauthorized" }));
	}

	const error = await getError(
		request("https://user:secret@example.com/api", { fetch, responseType: "void" }),
	);

	assert.is((error as HttpError).message, "401 Unauthorized - GET https://example.com/api");
	assert.is((error as HttpError).url, "https://example.com/api");
});

errors("throws a TimeoutError when the timeout fires while reading the body", async () => {
	const { fetch } = createFetch((request) => {
		const body = new ReadableStream({
			start(controller) {
				request.signal.addEventListener("abort", () => {
					controller.error(request.signal.reason);
				});
			},
		});
		return new Response(body);
	});

	const error = await getError(request(url, { fetch, responseType: "text", timeout: 10 }));

	assert.instance(error, TimeoutError);
});

errors("throws a TimeoutError when the timeout fires while reading an error body", async () => {
	const { fetch } = createFetch((request) => {
		const body = new ReadableStream({
			start(controller) {
				request.signal.addEventListener("abort", () => {
					controller.error(request.signal.reason);
				});
			},
		});
		return new Response(body, { status: 503 });
	});

	const error = await getError(request(url, { fetch, responseType: "void", timeout: 10 }));

	assert.instance(error, TimeoutError);
});

errors("throws a NetworkError for a cross-realm TypeError", async () => {
	const cause = runInNewContext('new TypeError("fetch failed")') as Error;
	const { fetch } = createFetch(() => throwError(cause));

	const error = await getError(request(url, { fetch, responseType: "void" }));

	assert.not.instance(cause, TypeError);
	assert.instance(error, NetworkError);
});

errors("throws an AbortError when the caller aborts", async () => {
	const controller = new AbortController();
	controller.abort();

	const error = await getError(request(url, { responseType: "void", signal: controller.signal }));

	assert.instance(error, AbortError);
});

errors("aborts without AbortSignal.any, which older browsers don't support", async () => {
	const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "any");
	assert.ok(descriptor);
	// @ts-expect-error -- missing in older browsers
	delete AbortSignal.any;

	try {
		const controller = new AbortController();
		const promise = request(url, {
			fetch: fetchUntilAborted,
			responseType: "void",
			signal: controller.signal,
		});
		controller.abort();

		const abortError = await getError(promise);
		const timeoutError = await getError(
			request(url, { fetch: fetchUntilAborted, responseType: "void", timeout: 10 }),
		);

		assert.instance(abortError, AbortError);
		assert.instance(timeoutError, TimeoutError);
	} finally {
		Object.defineProperty(AbortSignal, "any", descriptor);
	}
});

for (const code of [
	"EAI_AGAIN",
	"ECONNABORTED",
	"ECONNREFUSED",
	"ECONNRESET",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"ENOTFOUND",
	"EPIPE",
	"ETIMEDOUT",
]) {
	errors(`throws a NetworkError for Bun's ${code} error`, async () => {
		const { fetch } = createFetch(() =>
			throwError(Object.assign(new TypeError("Connection failed"), { code })),
		);

		const error = await getError(request(url, { fetch, responseType: "void" }));

		assert.instance(error, NetworkError);
	});
}

errors("throws a TimeoutError for Bun's socket timeout", async () => {
	const { fetch } = createFetch(() =>
		throwError(Object.assign(new TypeError("The operation timed out."), { code: "Timeout" })),
	);

	const error = await getError(request(url, { fetch, responseType: "void" }));

	assert.instance(error, TimeoutError);
});

for (const message of [
	"Failed to fetch",
	"fetch failed",
	"NetworkError when attempting to fetch resource.",
]) {
	errors(`throws a NetworkError for the "${message}" message`, async () => {
		const { fetch } = createFetch(() => throwError(new TypeError(message)));

		const error = await getError(request(url, { fetch, responseType: "void" }));

		assert.instance(error, NetworkError);
	});
}

errors("throws a NetworkError when fetch cannot connect", async () => {
	const port = await getClosedPort();

	const error = await getError(
		request(`http://127.0.0.1:${String(port)}/`, { responseType: "void" }),
	);

	assert.instance(error, NetworkError);
});

errors("throws a NetworkError when fetch loses the connection", async () => {
	const server = await listen(
		createServer((socket) => {
			socket.destroy();
		}),
	);

	try {
		const error = await getError(request(getUrl(server), { responseType: "void" }));

		assert.instance(error, NetworkError);
	} finally {
		await close(server);
	}
});

errors("rethrows other errors as they are", async () => {
	const cause = new TypeError("Invalid request");
	const { fetch } = createFetch(() => throwError(cause));

	const error = await getError(request(url, { fetch, responseType: "void" }));

	assert.is(error, cause);
});

errors("throws invalid urls as they are", async () => {
	const error = await getError(request("not a url", { responseType: "void" }));

	assert.instance(error, TypeError);
});

errors(
	"isServiceUnavailableError is true for timeouts, network errors, and gateway statuses",
	() => {
		const options = { method: "GET", url };

		function createHttpError(status: number): HttpError {
			return new HttpError({ ...options, body: "", response: new Response(null, { status }) });
		}

		assert.ok(isServiceUnavailableError(new TimeoutError(options)));
		assert.ok(isServiceUnavailableError(new NetworkError(options)));
		assert.ok(isServiceUnavailableError(createHttpError(502)));
		assert.ok(isServiceUnavailableError(createHttpError(503)));
		assert.ok(isServiceUnavailableError(createHttpError(504)));

		assert.not.ok(isServiceUnavailableError(createHttpError(500)));
		assert.not.ok(isServiceUnavailableError(createHttpError(404)));
		assert.not.ok(isServiceUnavailableError(new ParseError(options)));
		assert.not.ok(isServiceUnavailableError(new Error("Unexpected")));
	},
);

errors.run();

/* ================================================================================================
 * Retries.
 * ============================================================================================= */

const retries = suite("request retries");

for (const { status, calls } of [
	{ status: 400, calls: 1 },
	{ status: 404, calls: 1 },
	{ status: 408, calls: 3 },
	{ status: 429, calls: 3 },
	{ status: 503, calls: 3 },
]) {
	retries(`retries http ${String(status)} ${String(calls)} time(s)`, async () => {
		const { fetch, requests } = createFetch(
			() => new Response(null, { status, headers: { "retry-after": "0" } }),
		);

		await request(url, { fetch, responseType: "void", retries: 2 }).catch(() => null);

		assert.is(requests.length, calls);
	});
}

retries("returns the response of a successful retry", async () => {
	const { fetch } = createFetch(
		() => new Response(null, { status: 503, headers: { "retry-after": "0" } }),
		() => new Response("ok"),
	);

	const response = await request(url, { fetch, responseType: "text", retries: 1 });

	assert.is(response.data, "ok");
});

retries("retries network errors", async () => {
	const { fetch } = createFetch(
		() => throwError(new TypeError("fetch failed")),
		() => new Response("ok"),
	);

	const response = await request(url, { fetch, responseType: "text", retries: 1 });

	assert.is(response.data, "ok");
});

retries("does not retry methods that are not safe", async () => {
	const { fetch, requests } = createFetch(
		() => new Response(null, { status: 503, headers: { "retry-after": "0" } }),
	);

	await request(url, { fetch, method: "post", responseType: "void", retries: 2 }).catch(() => null);

	assert.is(requests.length, 1);
});

retries("discards the body of each failed attempt", async () => {
	const states: Array<{ isCancelled: boolean }> = [];
	const { fetch } = createFetch(() => {
		const { response, state } = createResponse("x".repeat(10_000), {
			status: 503,
			headers: { "retry-after": "0" },
		});
		states.push(state);
		return response;
	});

	await request(url, { fetch, responseType: "void", retries: 1 }).catch(() => null);

	assert.equal(states, [{ isCancelled: true }, { isCancelled: true }]);
});

retries("does not retry when retry-after exceeds the remaining timeout", async () => {
	const { fetch, requests } = createFetch(
		() => new Response(null, { status: 503, headers: { "retry-after": "60" } }),
	);

	const error = await getError(request(url, { fetch, responseType: "void", retries: 2 }));

	assert.instance(error, HttpError);
	assert.is(requests.length, 1);
});

retries("does not retry when retry-after exceeds a minute, also without a timeout", async () => {
	const { fetch, requests } = createFetch(
		() => new Response(null, { status: 503, headers: { "retry-after": "2592000" } }),
	);

	const error = await getError(
		request(url, { fetch, responseType: "void", retries: 1, timeout: false }),
	);

	assert.instance(error, HttpError);
	assert.is(requests.length, 1);
});

retries("throws an AbortError when the caller aborts while waiting for a retry", async () => {
	const { fetch } = createFetch(
		() => new Response(null, { status: 503, headers: { "retry-after": "5" } }),
	);

	const error = await getError(
		request(url, { fetch, responseType: "void", retries: 1, signal: AbortSignal.timeout(50) }),
	);

	assert.instance(error, AbortError);
});

retries.run();
