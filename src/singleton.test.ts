import { suite } from "uvu";
import * as assert from "uvu/assert";

import { singleton } from "./singleton.ts";

const test = suite("singleton");

test("should create singleton", () => {
	function createService() {
		return {
			hello() {
				return "world";
			},
		};
	}

	const service = singleton(() => createService());

	assert.is(service(), service());
});

test.run();
