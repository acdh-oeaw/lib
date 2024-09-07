import { get } from "./get.js";

const regex = /\{(.+?)\}/g;

export function template(value: string, values: Record<string, unknown>): string {
	return value.replace(regex, (match, capture: string) => {
		const replaced = get(values, capture);
		if (typeof replaced === "string" || typeof replaced === "number") return String(replaced);
		return match;
	});
}
