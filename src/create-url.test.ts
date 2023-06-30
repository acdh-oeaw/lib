import { suite } from "uvu";
import * as assert from "uvu/assert";

import { createUrl } from "./create-url.js";
import { createUrlSearchParams } from "./create-url-search-params.js";

const test = suite("createUrl");

test("should create URL", () => {
	assert.throws(() => {
		// @ts-expect-error It is expected to throw.
		return createUrl({ pathname: "/" });
	}, /Invalid URL/);

	assert.is(
		String(createUrl({ baseUrl: "https://example.com", pathname: "/" })),
		"https://example.com/",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				hash: "top",
			}),
		),
		"https://example.com/path#top",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				searchParams: new URLSearchParams("key=value"),
			}),
		),
		"https://example.com/path?key=value",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				searchParams: createUrlSearchParams({ key: "value" }),
			}),
		),
		"https://example.com/path?key=value",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				searchParams: createUrlSearchParams({ key: ["first", "second"] }),
			}),
		),
		"https://example.com/path?key=first&key=second",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				searchParams: createUrlSearchParams({
					first: ["first", null, undefined, "second"],
					null: null,
					undefined: undefined,
					second: "second",
				}),
			}),
		),
		"https://example.com/path?first=first&first=second&second=second",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com",
				pathname: "/path",
				searchParams: createUrlSearchParams({ key: "value" }),
				hash: "top",
			}),
		),
		"https://example.com/path?key=value#top",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: new URL("https://example.com/path"),
				searchParams: createUrlSearchParams({ key: "value" }),
			}),
		),
		"https://example.com/path?key=value",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: "https://example.com/path/",
				pathname: "nested",
				searchParams: createUrlSearchParams({ key: "value" }),
			}),
		),
		"https://example.com/path/nested?key=value",
	);

	assert.is(
		String(
			createUrl({
				baseUrl: new URL("https://example.com/path/"),
				pathname: "nested",
				searchParams: createUrlSearchParams({ key: "value" }),
			}),
		),
		"https://example.com/path/nested?key=value",
	);
});

test.run();
