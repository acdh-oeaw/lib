import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isThenable } from "./is-thenable.ts";

const test = suite("isThenable");

test("should return true for thenables", () => {
	assert.ok(isThenable(Promise.resolve("stefan")));
});

test("should return false for non-thenables", () => {
	assert.not.ok(isThenable("stefan"));
});

test.run();
