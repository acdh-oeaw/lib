import { suite } from "uvu";
import * as assert from "uvu/assert";

import { clamp } from "./clamp.ts";

const test = suite("clamp");

test("should clamp values", () => {
	assert.is(clamp(1, 2, 3), 2);
	assert.is(clamp(1, 0, 3), 1);
	assert.is(clamp(2, 4, 3), 3);
});

test.run();
