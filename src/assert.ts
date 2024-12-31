const defaultErrorMessage = "Assertion failed";

type ErrorMessage = string | (() => Error);

export function assert(value: boolean, error?: ErrorMessage): asserts value;
export function assert<T>(value: T | null | undefined, error?: ErrorMessage): asserts value is T;
export function assert(value: unknown, error?: ErrorMessage): void {
	if (value === false || value == null) {
		if (error == null) {
			throw new Error(defaultErrorMessage);
		}

		if (typeof error === "function") {
			throw error();
		}

		throw new Error(error);
	}
}
