import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isNonEmptyString } from "./is-nonempty-string.ts";

const test = suite("isNonEmptyString");

test("should return true for non-empty string", () => {
	assert.ok(isNonEmptyString("stefan"));
});

test("should return false for empty string", () => {
	assert.not(isNonEmptyString(""));
});

test("should return false for non-string values", () => {
	assert.not(isNonEmptyString(1));
});

test.run();
