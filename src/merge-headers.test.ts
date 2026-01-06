import { suite } from "uvu";
import * as assert from "uvu/assert";

import { mergeHeaders } from "./merge-headers.ts";

const test = suite("mergeHeaders");

test("should merge Headers", () => {
	assert.equal(
		Array.from(
			mergeHeaders(
				new Headers([
					["first", "first"],
					["second", "first"],
				]),
				new Headers([
					["first", "second"],
					["third", "first"],
				]),
			),
		),
		[
			["first", "first, second"],
			["second", "first"],
			["third", "first"],
		],
	);
});

test.run();
