import { suite } from "uvu";
import * as assert from "uvu/assert";

import { template } from "./template.ts";

const test = suite("template");

test("should replace values", () => {
	const result = template("There are {fruits.apples} apples and {fruits.oranges} oranges.", {
		fruits: {
			apples: 3,
			oranges: 2,
		},
	});
	assert.is(result, "There are 3 apples and 2 oranges.");
});

test.run();
