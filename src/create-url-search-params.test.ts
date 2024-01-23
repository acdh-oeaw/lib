import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrlSearchParams } from "./create-url-search-params.js";

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

test("should treat Next.js' ReadonlyURLSearchParams as URLSearchParams", () => {
	/** @see https://github.com/vercel/next.js/blob/canary/packages/next/src/client/components/navigation.ts#L25 */
	class ReadonlyURLSearchParams {
		urlSearchParams: URLSearchParams;

		entries: URLSearchParams["entries"];
		forEach: URLSearchParams["forEach"];
		get: URLSearchParams["get"];
		getAll: URLSearchParams["getAll"];
		has: URLSearchParams["has"];
		keys: URLSearchParams["keys"];
		values: URLSearchParams["values"];
		toString: URLSearchParams["toString"];
		size: URLSearchParams["size"];

		constructor(urlSearchParams: URLSearchParams) {
			this.urlSearchParams = urlSearchParams;

			this.entries = urlSearchParams.entries.bind(urlSearchParams);
			this.forEach = urlSearchParams.forEach.bind(urlSearchParams);
			this.get = urlSearchParams.get.bind(urlSearchParams);
			this.getAll = urlSearchParams.getAll.bind(urlSearchParams);
			this.has = urlSearchParams.has.bind(urlSearchParams);
			this.keys = urlSearchParams.keys.bind(urlSearchParams);
			this.values = urlSearchParams.values.bind(urlSearchParams);
			this.toString = urlSearchParams.toString.bind(urlSearchParams);
			this.size = urlSearchParams.size;
		}

		[Symbol.iterator]() {
			return this.urlSearchParams[Symbol.iterator]();
		}
	}

	const searchParams = createUrlSearchParams(
		// @ts-expect-error We don't explicitly add `ReadonlyURLSearchParams` to our types.
		new ReadonlyURLSearchParams(new URLSearchParams({ count: "one" })),
	);

	assert.instance(searchParams, URLSearchParams);
	assert.is(String(searchParams), "count=one");
});

test.run();
