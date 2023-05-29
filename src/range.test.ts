import { suite } from "uvu";
import * as assert from "uvu/assert";

import { range } from "./range.js";

const test = suite("range");

test("should return array with sequential numbers", () => {
	assert.equal(range(1, 3), [1, 2, 3]);
});

test.run();
