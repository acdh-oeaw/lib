import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createHeaders } from "./create-headers.js";

const test = suite("createHeaders");

test("should create Headers", () => {
	assert.equal(
		Array.from(
			createHeaders({
				"content-type": "application/json",
				accept: ["text/html", null, undefined, "text/xml"],
				null: null,
				undefined: undefined,
			}),
		),
		[
			["accept", "text/html, text/xml"],
			["content-type", "application/json"],
		],
	);
});

test("should allow passing Headers", () => {
	assert.equal(Array.from(createHeaders(new Headers([["content-type", "application/json"]]))), [
		["content-type", "application/json"],
	]);
});

test("should allow passing Array", () => {
	assert.equal(
		Array.from(
			createHeaders([
				["accept", "text/html"],
				["accept", "text/xml"],
				["null", null],
				["undefined", undefined],
				["content-type", "application/json"],
			]),
		),
		[
			["accept", "text/html, text/xml"],
			["content-type", "application/json"],
		],
	);
});

test.run();
