'use strict';

/**
 * Consumes quoted literal from current stream position and returns it’s inner,
 * unquoted, value
 * @param  {StringReader} stream
 * @return {String} Returns `null` if unable to consume quoted value from current
 * position
 */
export default function(stream) {
	if (!isQuote(stream.peek())) {
		return null;
	}

	const quote = stream.next();
	const start = stream.pos;
	if (!stream.eatQuoted(quote)) {
		throw stream.error(`Unable to find matching ${quote} for string literal`);
	}

	return stream.string.slice(start, stream.pos - 1);
}

/**
 * Check if given character is a valid quote
 * @param  {String}  ch
 * @return {Boolean}
 */
function isQuote(ch) {
	return ch === '"' || ch === "'";
}
