import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrlSearchParams } from "./create-url-search-params.js";

const test = suite("createUrlSearchParams");

test("should create URLSearchParams", () => {
	assert.is(String(createUrlSearchParams({ key: "value" })), "key=value");

	assert.is(String(createUrlSearchParams({ key: ["first", "second"] })), "key=first&key=second");

	assert.is(
		String(
			createUrlSearchParams({
				first: ["first", null, undefined, "second"],
				null: null,
				undefined: undefined,
				second: "second",
			}),
		),
		"first=first&first=second&second=second",
	);
});

test.run();
