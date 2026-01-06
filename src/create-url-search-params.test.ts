import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrlSearchParams } from "./create-url-search-params.ts";

const test = suite("createUrlSearchParams");

test("should create URLSearchParams", () => {
	assert.is(String(createUrlSearchParams({ key: "value" })), "key=value");

	assert.is(String(createUrlSearchParams({ key: ["first", "second"] })), "key=first&key=second");

	assert.is(
		String(
			createUrlSearchParams({
				first: ["first", null, undefined, "second"],
				null: null,
				undefined: undefined,
				second: "second",
			}),
		),
		"first=first&first=second&second=second",
	);
});

test("should allow passing URLSearchParams", () => {
	assert.is(String(createUrlSearchParams(new URLSearchParams([["key", "value"]]))), "key=value");
});

test("should allow passing FormData", () => {
	const formData = new FormData();
	formData.append("first", "first");
	formData.append("first", "second");
	formData.append("second", "second");

	assert.is(String(createUrlSearchParams(formData)), "first=first&first=second&second=second");
});

test("should allow passing Array", () => {
	assert.is(
		String(
			createUrlSearchParams([
				["first", "first"],
				["first", null],
				["first", undefined],
				["first", "second"],
				["second", "second"],
			]),
		),
		"first=first&first=second&second=second",
	);
});

test("should allow passing string", () => {
	assert.is(String(createUrlSearchParams("first=first&first=second")), "first=first&first=second");
});

test.run();
