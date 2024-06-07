import { suite } from "uvu";
import * as assert from "uvu/assert";

import { isoDate } from "./iso-date.js";

const test = suite("isoDate");

test("should format date as yyyy-mm-dd", () => {
	assert.is(isoDate(new Date(Date.UTC(1978, 8, 26))), "1978-09-26");
});

test("should format dates before 1000 as yyyy-mm-dd", () => {
	assert.is(isoDate(new Date(Date.UTC(978, 8, 26))), "978-09-26");
});

test.run();
