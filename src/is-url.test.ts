import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isUrl } from "./is-url.ts";

const test = suite("isUrl");

test("should return true for fully qualified URLs", () => {
	assert.ok(isUrl("https://www.example.com/path"));
});

test("should return false for non-url values", () => {
	assert.not(isUrl("example"));
});

test("should return false for URLs missing scheme", () => {
	assert.not(isUrl("www.example.com/path"));
});

test("should return true for URL with valid scheme", () => {
	assert.ok(isUrl("mailto:stefan@example.com"));
});

test.run();
