'use strict';

/**
 * Consumes node repeat token from current stream position and returns its
 * parsed value
 * @param  {StringReader} stream
 * @return {Object}
 */
export default function(stream) {
	if (stream.eat('*')) {
		const value = stream.consume(/[0-9]/);
		// XXX think about extending repeat syntax with through numbering
		return {count: value ? +value : null};
	}

	return null;
}
