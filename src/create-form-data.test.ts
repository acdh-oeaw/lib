import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createFormData } from "./create-form-data.ts";

const test = suite("createFormData");

test("should create FormData", () => {
	assert.equal(
		Array.from(
			createFormData({
				items: [{ name: "foo" }, null, undefined, { name: "bar" }],
				total: 2,
				null: null,
				undefined: undefined,
			}),
		),
		[
			["items.0.name", "foo"],
			["items.3.name", "bar"],
			["total", "2"],
		],
	);
});

test.run();
