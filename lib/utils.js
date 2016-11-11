'use strict';

/**
 * Check if given character is a valid quote
 * @param  {String}  ch
 * @return {Boolean}
 */
export function isQuote(ch) {
	return ch === '"' || ch === "'";
}

/**
 * Returns last item from given array
 * @param  {Array} arr
 * @return {*}
 */
export function last(arr) {
	return arr[arr.length - 1];
}
