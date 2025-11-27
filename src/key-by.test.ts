import { suite } from "uvu";
import * as assert from "uvu/assert";

import { keyBy, keyByToMap } from "./key-by.js";

const test = suite("keyBy");

test("should key by value", () => {
	const values = [
		{ id: "1", category: "a" },
		{ id: "2", category: "b" },
		{ id: "3", category: "b" },
		{ id: "4", category: "a" },
	];

	const expected = Object.assign(
		{},
		{
			1: { id: "1", category: "a" },
			2: { id: "2", category: "b" },
			3: { id: "3", category: "b" },
			4: { id: "4", category: "a" },
		},
	);

	assert.equal(
		keyBy(values, (value) => {
			return value.id;
		}),
		expected,
	);
});

test("should key by value and return Map", () => {
	const values = [
		{ id: "1", category: "a" },
		{ id: "2", category: "b" },
		{ id: "3", category: "b" },
		{ id: "4", category: "a" },
	];

	const expected = new Map([
		["1", { id: "1", category: "a" }],
		["2", { id: "2", category: "b" }],
		["3", { id: "3", category: "b" }],
		["4", { id: "4", category: "a" }],
	]);

	assert.equal(
		keyByToMap(values, (value) => {
			return value.id;
		}),
		expected,
	);
});

test.run();
