import { log } from "./log.ts";

export function warn(value: boolean | null | undefined, message: string): void {
	if (value === false || value == null) {
		log.warn(message);
	}
}
