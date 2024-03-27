import { suite } from "uvu";
import * as assert from "uvu/assert";

import { set } from "./set.js";

const test = suite("set");

test("should set nested object key", () => {
	const obj = {};
	set(obj, "one.two.three", "test");
	assert.equal(obj, { one: { two: { three: "test" } } });
});

test("should set nested object or array key", () => {
	const obj = {};
	set(obj, "one.0.three", "test");
	assert.equal(obj, { one: [{ three: "test" }] });
});

test("should set nested object key with array path segments", () => {
	const obj = {};
	set(obj, ["one", "two", "three"], "test");
	assert.equal(obj, { one: { two: { three: "test" } } });
});

test("should set nested array item", () => {
	const obj = {};
	set(obj, "one.0.0.two", "test");
	assert.equal(obj, { one: [[{ two: "test" }]] });
});

test("should set sparse array item", () => {
	const obj = {};
	set(obj, "one.1.1.two", "test");
	// eslint-disable-next-line no-sparse-arrays
	assert.equal(obj, { one: [, [, { two: "test" }]] });
});

test("should preserve keys on original object", () => {
	const obj = { one: { other: true } };
	set(obj, ["one", "two", "three"], "test");
	assert.equal(obj, { one: { two: { three: "test" }, other: true } });
});

test.run();
