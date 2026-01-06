import { suite } from "uvu";
import * as assert from "uvu/assert";

import { mergeUrlSearchParams } from "./merge-url-search-params.ts";

const test = suite("mergeUrlSearchParams");

test("should merge URLSearchParams", () => {
	assert.is(
		String(
			mergeUrlSearchParams(
				new URLSearchParams([
					["first", "first"],
					["second", "first"],
				]),
				new URLSearchParams([
					["first", "second"],
					["third", "first"],
				]),
			),
		),
		"first=first&second=first&first=second&third=first",
	);
});

test.run();
