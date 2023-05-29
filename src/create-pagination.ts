import { range } from "./range.js";

export interface PaginationParams {
	page: number;
	pages: number;
	edges?: number;
	neighbors?: number;
}

export type PaginationItem =
	| { type: "ellipsis"; position: "end" | "start" }
	| { type: "page"; page: number };

/**
 * @see https://github.com/bramus/js-pagination-sequence/blob/main/src/index.js
 */
export function createPagination(params: PaginationParams): Array<PaginationItem> {
	const { page, pages, edges = 2, neighbors = 2 } = params;

	const length = 1 + neighbors * 2 + edges * 2 + 2;

	if (pages <= length) {
		return range(1, pages).map(createPage);
	}

	const half = length / 2;
	const currentPage = Math.min(page, pages);

	if (currentPage < half) {
		const start = range(1, Math.ceil(half) + neighbors);
		const end = edges > 0 ? range(pages - (edges - 1), pages) : [];

		return [...start.map(createPage), createEllipsis("end"), ...end.map(createPage)];
	}

	if (currentPage > pages - half) {
		const start = edges > 0 ? range(1, edges) : [];
		const end = range(
			Math.min(pages - Math.floor(half) - neighbors, currentPage - neighbors),
			pages,
		);

		return [...start.map(createPage), createEllipsis("start"), ...end.map(createPage)];
	}

	const start = range(1, edges);
	const center = range(currentPage - neighbors, currentPage + neighbors);
	const end = range(pages - (edges - 1), pages);

	return [
		...start.map(createPage),
		center[0] === edges + 2 ? createPage(edges + 1) : createEllipsis("start"),
		...center.map(createPage),
		createEllipsis("end"),
		...end.map(createPage),
	];
}

function createPage(page: number): PaginationItem {
	return { type: "page", page };
}

function createEllipsis(position: "end" | "start"): PaginationItem {
	return { type: "ellipsis", position };
}
