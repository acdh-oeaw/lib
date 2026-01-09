import { suite } from "uvu";
import * as assert from "uvu/assert";

import { range } from "./range.ts";

const test = suite("range");

test("should return iterator with sequential numbers", () => {
	const numbers = [];

	for (const n of range(1, 3)) {
		numbers.push(n);
	}

	assert.equal(numbers, [1, 2, 3]);
});

test("should transform into array with sequential numbers", () => {
	assert.equal([...range(1, 3)], [1, 2, 3]);
});

test.run();
