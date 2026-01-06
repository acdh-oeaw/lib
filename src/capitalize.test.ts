import { suite } from "uvu";
import * as assert from "uvu/assert";

import { capitalize } from "./capitalize.ts";

const test = suite("capitalize");

test("should capitalize string", () => {
	assert.is(capitalize("test"), "Test");
});

/** @see https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript#answer-53930826 */
test("should handle unicode characters", () => {
	assert.is(capitalize("𐐶𐐲𐑌𐐼𐐲𐑉"), "𐐎𐐲𐑌𐐼𐐲𐑉");
});

test("should use locale-aware capitalization rules", () => {
	assert.is(capitalize("istanbul", "tr"), "İstanbul");
});

test.run();
