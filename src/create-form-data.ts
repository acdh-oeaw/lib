type FormDataValue =
	| string
	| number
	| boolean
	| File
	| Blob
	| null
	| undefined
	| Array<FormDataValue>
	| { [key: string]: FormDataValue };

export function createFormData(input: Record<string, FormDataValue>): FormData {
	const formData = new FormData();

	function set(value: FormDataValue, path: string) {
		if (value == null) {
			return;
		}

		if (value instanceof Blob) {
			formData.set(path, value);
			return;
		}

		if (Array.isArray(value)) {
			value.forEach((value, index) => {
				set(value, `${path}.${String(index)}`);
			});
			return;
		}

		if (typeof value === "object") {
			Object.entries(value).forEach(([key, value]) => {
				set(value, `${path}.${key}`);
			});
			return;
		}

		formData.set(path, String(value));
	}

	Object.entries(input).forEach(([key, value]) => {
		set(value, key);
	});

	return formData;
}
