'use strict';

import consumeQuoted from './quoted';

/**
 * Consumes text node, e.g. contents of `{...}` and returns its inner value
 * @param  {StringStream} stream [description]
 * @return {String} Returns `null` if unable to consume text node from current
 * position
 */
export default function(stream) {
	if (stream.peek() !== '{') {
		return null;
	}

	const start = stream.pos + 1;
	let stack = 0;

	while (!stream.eol()) {
		if (consumeQuoted(stream) !== null) {
			continue;
		}

		const ch = stream.next();
		if (ch === '{') {
			stack++;
			continue;
		} else if (ch === '}') {
			stack--;
			if (!stack) {
				return stream.string.slice(start, stream.pos - 1);
			}
		} else if (ch === '\\') {
			stream.next();
			continue;
		}
	}

	throw stream.error('Unable to find matching } for text node');
}
