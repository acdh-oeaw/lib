import { suite } from "uvu";

import { includes } from "./includes.ts";

const test = suite("includes");

test("should have no type errors when value is a supertype of values", () => {
	const values = ["one", "two"] as const;
	const value = "one" as string;
	// @ts-expect-error `Array.prototype.includes` does not know about supertypes.
	values.includes(value);
	includes(values, value);
});

test("should have type error when value is not a supertype of values", () => {
	const values = ["one", "two"] as const;
	const value = 1;
	// @ts-expect-error Error is expected.
	includes(values, value);
});

test.run();
