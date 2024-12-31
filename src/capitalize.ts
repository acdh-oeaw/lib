export function capitalize(value: string, locale?: string): string {
	const charCode = value.codePointAt(0);
	if (charCode === undefined) {
		return "";
	}
	const firstChar = String.fromCodePoint(charCode);
	return firstChar.toLocaleUpperCase(locale) + value.slice(firstChar.length);
}
