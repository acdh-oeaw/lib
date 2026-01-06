import { suite } from "uvu";
import * as assert from "uvu/assert";

import { unique } from "./unique.ts";

const test = suite("unique");

test("should return unique array values", () => {
	assert.equal(unique([1, 2, 3, 4, 3, 2, 1]), [1, 2, 3, 4]);
});

test.run();
