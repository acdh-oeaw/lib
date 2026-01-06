import { suite } from "uvu";
import * as assert from "uvu/assert";

import { omit } from "./omit.ts";

const test = suite("omit");

test("should omit keys", () => {
	const value = { one: 1, two: 2, three: 3 };
	const expected = { two: 2 };

	assert.equal(omit(value, ["one", "three"]), expected);
});

test.run();
