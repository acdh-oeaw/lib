import { set } from "./set.js";

export function getFormDataValues(formData: FormData): unknown {
	const data = {};

	for (const [key, value] of formData.entries()) {
		/** Internally used by react server actions. */
		if (key.startsWith("$ACTION_")) continue;

		/** Empty input field. */
		if (value === "") continue;

		set(data, key, value);
	}

	return data;
}
