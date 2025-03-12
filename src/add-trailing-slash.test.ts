import { suite } from "uvu";
import * as assert from "uvu/assert";

import { addTrailingSlash } from "./add-trailing-slash.js";

const test = suite("get");

test("should add trailing slash", () => {
	assert.is(addTrailingSlash("/one"), "/one/");
});

test("should return unmodified string when passed a string with trailing slash", () => {
	assert.is(addTrailingSlash("/one/"), "/one/");
});

test("should return unmodified string when passed a slash", () => {
	assert.is(addTrailingSlash("/"), "/");
});

test.run();
