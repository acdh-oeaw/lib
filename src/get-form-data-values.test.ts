import { suite } from "uvu";
import * as assert from "uvu/assert";

import { getFormDataValues } from "./get-form-data-values.ts";

const test = suite("getFormDataValues");

test("should convert FormData to object", () => {
	const formData = new FormData();
	formData.append("name", "Me");

	const expected = {
		name: "Me",
	};

	assert.equal(getFormDataValues(formData), expected);
});

test("should skip empty fields", () => {
	const formData = new FormData();
	formData.append("name", "Me");
	formData.append("email", "");

	const expected = {
		name: "Me",
	};

	assert.equal(getFormDataValues(formData), expected);
});

test("should handle arrays and objects", () => {
	const formData = new FormData();
	formData.append("name", "Me");
	formData.append("fruits.0", "apple");
	formData.append("fruits.1", "banana");
	formData.append("colors.0.r", "0");
	formData.append("colors.0.g", "0");
	formData.append("colors.0.b", "0");
	formData.append("colors.1.r", "255");
	formData.append("colors.1.g", "255");
	formData.append("colors.1.b", "255");

	const expected = {
		name: "Me",
		fruits: ["apple", "banana"],
		colors: [
			{ r: "0", g: "0", b: "0" },
			{ r: "255", g: "255", b: "255" },
		],
	};

	assert.equal(getFormDataValues(formData), expected);
});

test.run();
