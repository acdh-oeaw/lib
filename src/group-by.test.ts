import { suite } from "uvu";
import * as assert from "uvu/assert";

import { groupBy, groupByToMap } from "./group-by.js";

const test = suite("groupBy");

test("should group by value", () => {
	const values = [
		{ id: "1", category: "a" },
		{ id: "2", category: "b" },
		{ id: "3", category: "b" },
		{ id: "4", category: "a" },
	];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const expected = Object.assign(Object.create(null), {
		a: [
			{ id: "1", category: "a" },
			{ id: "4", category: "a" },
		],
		b: [
			{ id: "2", category: "b" },
			{ id: "3", category: "b" },
		],
	});

	assert.equal(
		groupBy(values, (value) => {
			return value.category;
		}),
		expected,
	);
});

test("should group by value and return Map", () => {
	const values = [
		{ id: "1", category: "a" },
		{ id: "2", category: "b" },
		{ id: "3", category: "b" },
		{ id: "4", category: "a" },
	];

	const expected = new Map([
		[
			"a",
			[
				{ id: "1", category: "a" },
				{ id: "4", category: "a" },
			],
		],
		[
			"b",
			[
				{ id: "2", category: "b" },
				{ id: "3", category: "b" },
			],
		],
	]);

	assert.equal(
		groupByToMap(values, (value) => {
			return value.category;
		}),
		expected,
	);
});

test("should group by multiple values", () => {
	const values = [
		{ id: "1", categories: ["a", "c"] },
		{ id: "2", categories: ["b"] },
		{ id: "3", categories: ["b", "a"] },
		{ id: "4", categories: ["a"] },
	];

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const expected = Object.assign(Object.create(null), {
		a: [
			{ id: "1", categories: ["a", "c"] },
			{ id: "3", categories: ["b", "a"] },
			{ id: "4", categories: ["a"] },
		],
		b: [
			{ id: "2", categories: ["b"] },
			{ id: "3", categories: ["b", "a"] },
		],
		c: [{ id: "1", categories: ["a", "c"] }],
	});

	assert.equal(
		groupBy(values, (value) => {
			return value.categories;
		}),
		expected,
	);
});

test("should group by multiple values and return Map", () => {
	const values = [
		{ id: "1", categories: ["a", "c"] },
		{ id: "2", categories: ["b"] },
		{ id: "3", categories: ["b", "a"] },
		{ id: "4", categories: ["a"] },
	];

	const expected = new Map([
		[
			"a",
			[
				{ id: "1", categories: ["a", "c"] },
				{ id: "3", categories: ["b", "a"] },
				{ id: "4", categories: ["a"] },
			],
		],
		[
			"b",
			[
				{ id: "2", categories: ["b"] },
				{ id: "3", categories: ["b", "a"] },
			],
		],
		["c", [{ id: "1", categories: ["a", "c"] }]],
	]);

	assert.equal(
		groupByToMap(values, (value) => {
			return value.categories;
		}),
		expected,
	);
});

test.run();
