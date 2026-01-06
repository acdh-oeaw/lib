import { suite } from "uvu";
import * as assert from "uvu/assert";

import { pick } from "./pick.ts";

const test = suite("pick");

test("should pick keys", () => {
	const value = { one: 1, two: 2, three: 3 };
	const expected = { one: 1, three: 3 };

	assert.equal(pick(value, ["one", "three"]), expected);
});

test.run();
