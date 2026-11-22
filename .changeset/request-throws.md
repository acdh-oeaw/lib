---
"@acdh-oeaw/lib": major
---

`request()` throws errors instead of returning a `Result`, and adds validation, retries, and safer timeouts.

- Throws a subclass of `RequestError` for failures at runtime: `AbortError`, `TimeoutError`, `NetworkError`,
  `HttpError`, `ParseError` and `ValidationError`. Narrow with `instanceof`. Invalid arguments, like a malformed url,
  throw as they are. The `static is()` methods are removed
- `HttpError` has `status`, `headers` and `body`, the first 4 KiB of the response body, instead of the `Response`. The
  rest of the body is discarded, so that the connection goes back to the pool
- `schema` validates a json response body with any Standard Schema, like valibot or zod
- `json` sends a json body. `body` only accepts `BodyInit`
- `responseType` is `"bytes"`, `"json"`, `"text"` or `"void"`. An empty json body returns `undefined`
- `timeout` is for the whole request, including retries and reading the body
- Retries only safe methods, and respects `retry-after`
- Error messages contain the method and url, without credentials
- Works without `AbortSignal.any`, and detects network errors and timeouts in Bun
- Adds `isServiceUnavailableError()`, for timeouts, network errors and gateway statuses
