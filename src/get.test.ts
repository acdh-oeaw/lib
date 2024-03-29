import { suite } from "uvu";
import * as assert from "uvu/assert";

import { get } from "./get.js";

const test = suite("get");

test("should get value from nested object", () => {
	const obj = { one: { two: { three: "test" } } };
	const result = get(obj, "one.two.three");
	assert.is(result, "test");
});

test("should get value from nested array", () => {
	const obj = { one: [{ two: null }, { three: [{ four: "test" }] }] };
	const result = get(obj, "one.1.three.0.four");
	assert.is(result, "test");
});

test("should return undefined for non-existing paths", () => {
	const obj = { one: { two: { three: "test" } } };
	const result = get(obj, "one.three.four");
	assert.is(result, undefined);
});

test.run();
