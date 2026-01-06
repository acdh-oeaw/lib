import { expectTypeOf } from "expect-type";
import { listen, type Listener } from "listhen";
import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrl } from "./create-url.ts";
import { HttpError, request } from "./request.ts";

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
	const result = await request(url, { responseType: "text" });

	assert.ok(result.error == null);

	assert.is(result.value.data, expected);
});

test("should return response data and headers", async (context) => {
	const expected = "hello world";
	const contentType = "text/plain";

	context.server = await listen((request, response) => {
		response.setHeader("content-type", contentType);
		response.end(expected);
	});
	const url = createUrl({ baseUrl: context.server.url });
	const result = await request(url, { responseType: "text" });

	assert.ok(result.error == null);

	assert.is(result.value.data, expected);
	assert.is(result.value.headers.get("content-type"), contentType);
});

test("should return http error", async (context) => {
	const expected = "not found";

	context.server = await listen((request, response) => {
		response.statusCode = 404;
		response.end(expected);
	});
	const url = createUrl({ baseUrl: context.server.url });
	const result = await request(url, { responseType: "text" });

	assert.ok(result.error != null);

	assert.is(result.error.name, "HttpError");
	assert.match(result.error.message, "404");
	assert.ok(HttpError.is(result.error));
});

test("should narrow return type based on responseType parameter", async (context) => {
	context.server = await listen((request, response) => {
		if (request.headers.accept === "application/x-www-form-urlencoded") {
			const data = new URLSearchParams().toString();
			response.setHeader("content-type", "application/x-www-form-urlencoded");
			response.setHeader("content-length", Buffer.byteLength(data));
			response.end(data);
		} else {
			response.end();
		}
	});
	const url = createUrl({ baseUrl: context.server.url });

	const arrayBuffer = await request(url, { responseType: "arrayBuffer" });
	assert.ok(arrayBuffer.error == null);
	expectTypeOf(arrayBuffer.value.data).toEqualTypeOf<ArrayBuffer>();

	const blob = await request(url, { responseType: "blob" });
	assert.ok(blob.error == null);
	expectTypeOf(blob.value.data).toEqualTypeOf<Blob>();

	const formData = await request(url, {
		headers: { accept: "application/x-www-form-urlencoded" },
		responseType: "formData",
	});
	assert.ok(formData.error == null);
	expectTypeOf(formData.value.data).toEqualTypeOf<FormData>();

	const json = await request(url, { responseType: "json" });
	assert.ok(json.error == null);
	expectTypeOf(json.value.data).toEqualTypeOf<unknown>();

	const raw = await request(url, { responseType: "raw" });
	assert.ok(raw.error == null);
	expectTypeOf(raw.value.data).toEqualTypeOf<Response>();

	const stream = await request(url, { responseType: "stream" });
	assert.ok(stream.error == null);
	expectTypeOf(stream.value.data).toEqualTypeOf<ReadableStream<Uint8Array> | null>();

	const text = await request(url, { responseType: "text" });
	assert.ok(text.error == null);
	expectTypeOf(text.value.data).toEqualTypeOf<string>();

	const ignore = await request(url, { responseType: "void" });
	assert.ok(ignore.error == null);
	expectTypeOf(ignore.value.data).toEqualTypeOf<null>();
});

test.run();
