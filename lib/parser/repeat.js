'use strict';

/**
 * Consumes node repeat token from current stream position and returns its
 * parsed value
 * @param  {StringStream} stream
 * @return {Object}
 */
export default function(stream) {
	if (stream.next() !== '*') {
		stream.backUp(1);
		throw stream.error('Expected * character for repeater');
	}

	const value = stream.consume(/[0-9]/);
	// XXX think about extending repeat syntax with through numbering
	return {count: value ? +value : null};
}
