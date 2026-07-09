import { suite } from "uvu";
import * as assert from "uvu/assert";

import { times } from "./times.ts";

const test = suite("times");

test("should return iterator with count n", () => {
	let count = 0;

	for (const _ of times(3)) {
		count++;
	}

	assert.equal(count, 3);
});

test("should transform into array of length n", () => {
	assert.equal([...times(3)].length, 3);
});

test.run();
