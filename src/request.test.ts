import { expectTypeOf } from "expect-type";
import { listen, type Listener } from "listhen";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrl } from "./create-url.js";
import { request } from "./request.js";

interface Context {
	server?: Listener;
}

const test = suite<Context>("request");

test.after.each(async (context) => {
	if (context.server != null) {
		await context.server.close();
	}
});

test("should dispatch request and receive response", async (context) => {
	const expected = "hello world";

	context.server = await listen((request, response) => {
		response.end(expected);
	});
	const url = createUrl({ baseUrl: context.server.url });
	const response = await request(url, { responseType: "text" });

	assert.is(response, expected);
});

test("should narrow return type based on responseType parameter", async (context) => {
	context.server = await listen((request, response) => {
		if (request.headers.accept === "multipart/form-data") {
			const data = new URLSearchParams().toString();
			response.setHeader("content-type", "application/x-www-form-urlencoded");
			response.setHeader("content-length", Buffer.byteLength(data));
			response.end(data);
		} else {
			response.end();
		}
	});
	const url = createUrl({ baseUrl: context.server.url });

	expectTypeOf(await request(url, { responseType: "arrayBuffer" })).toEqualTypeOf<ArrayBuffer>();
	expectTypeOf(await request(url, { responseType: "blob" })).toEqualTypeOf<Blob>();
	expectTypeOf(await request(url, { responseType: "formData" })).toEqualTypeOf<FormData>();
	expectTypeOf(await request(url, { responseType: "json" })).toEqualTypeOf<unknown>();
	expectTypeOf(await request(url, { responseType: "raw" })).toEqualTypeOf<Response>();
	expectTypeOf(
		await request(url, { responseType: "stream" }),
		// eslint-disable-next-line n/no-unsupported-features/node-builtins
	).toEqualTypeOf<ReadableStream<Uint8Array> | null>();
	expectTypeOf(await request(url, { responseType: "text" })).toEqualTypeOf<string>();
	expectTypeOf(await request(url, { responseType: "void" })).toEqualTypeOf<null>();
});

test("should allow passing explicit return type for json response", async (context) => {
	context.server = await listen((request, response) => {
		response.end();
	});
	const url = createUrl({ baseUrl: context.server.url });

	interface Data {
		key: string;
	}

	expectTypeOf(await request<Data>(url, { responseType: "json" })).toEqualTypeOf<Data>();
	// @ts-expect-error Not a json response.
	expectTypeOf(await request<Data>(url, { responseType: "text" })).toEqualTypeOf<Data>();
});

test.run();
