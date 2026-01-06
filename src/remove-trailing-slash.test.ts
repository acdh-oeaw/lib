import { suite } from "uvu";
import * as assert from "uvu/assert";

import { removeTrailingSlash } from "./remove-trailing-slash.ts";

const test = suite("get");

test("should remove trailing slash", () => {
	assert.is(removeTrailingSlash("/one/"), "/one");
});

test("should return unmodified string when passed a string without trailing slash", () => {
	assert.is(removeTrailingSlash("/one"), "/one");
});

test("should return unmodified string when passed a slash", () => {
	assert.is(removeTrailingSlash("/"), "/");
});

test.run();
