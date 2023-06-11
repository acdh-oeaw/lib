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

test.run();
