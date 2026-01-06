import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isPlainObject } from "./is-plain-object.ts";

const test = suite("isPlainObject");

test("should return true for objects", () => {
	assert.ok(isPlainObject({ name: "stefan" }));
});

test("should return true for null prototype objects", () => {
	assert.ok(isPlainObject(Object.create(null)));
});

test("should return false for primitive values", () => {
	assert.not.ok(isPlainObject("stefan"));
});

test("should return false for dates", () => {
	assert.not.ok(isPlainObject(new Date()));
});

test("should return false for maps", () => {
	assert.not.ok(isPlainObject(new Map([["name", "stefan"]])));
});

test.run();
