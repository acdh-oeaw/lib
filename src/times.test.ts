import { suite } from "uvu";
import * as assert from "uvu/assert";

import { times } from "./times.ts";

const test = suite("times");

test("should return array of length n", () => {
	assert.equal(times(3).length, 3);
});

test.run();
