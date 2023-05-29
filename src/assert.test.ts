import { suite } from "uvu";
import * as assert from "uvu/assert";

import { assert as a } from "./assert.js";

const test = suite("assert");

test("should not throw when condition is true", () => {
	assert.not.throws(() => {
		// eslint-disable-next-line prefer-const
		let one = 1;
		// eslint-disable-next-line prefer-const
		let two = 2;

		a(one < two);
	});
});

test("should throw when condition is false", () => {
	assert.throws(() => {
		// eslint-disable-next-line prefer-const
		let one = 1;
		// eslint-disable-next-line prefer-const
		let two = 2;

		a(one === two);
	});
});

test("should throw when value is null", () => {
	assert.throws(() => {
		a(null);
	});
});

test("should throw when value is undefined", () => {
	assert.throws(() => {
		a(undefined);
	});
});

test("should use custom error message", () => {
	const message = "This is obviously wrong!";

	assert.throws(() => {
		a(undefined, message);
	}, message);
});

test("should use custom error", () => {
	const message = "Not found.";
	class NotFoundError extends Error {
		name = "NotFoundError";
	}

	assert.throws(
		() => {
			a(undefined, () => {
				return new NotFoundError(message);
			});
		},
		(error: unknown) => {
			return error instanceof Error && error.name === "NotFoundError" && error.message === message;
		},
	);
});

test.run();
