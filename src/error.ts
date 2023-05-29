export class HttpError extends Error {
	name = "HttpError";
	request: Request;
	response: Response;

	constructor(request: Request, response: Response, message?: string) {
		super(message ?? response.statusText);

		this.request = request;
		this.response = response;
	}
}
