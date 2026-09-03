/**
 * One-dimensional spacing, used by the Consensus page to lay group markers out
 * along a shared bar without letting two of them overlap.
 */

/**
 * Nudges positions apart so no two are closer than `minGap`, keeping every one
 * inside [lo, hi] and preserving their left-to-right order.
 *
 * Two passes: the first walks left to right pushing each position clear of its
 * predecessor, which can push the rightmost past `hi`; the second walks back
 * pulling them in. Positions arrive in group order, not sorted order, so the
 * ordering is computed once and both passes follow it.
 */
export function nudgeApart(
	positions: readonly number[],
	minGap: number,
	lo: number,
	hi: number
): number[] {
	const order = positions.map((_, i) => i).sort((a, b) => positions[a] - positions[b]);
	const out = positions.slice();

	order.forEach((i, n) => {
		out[i] =
			n === 0 ? Math.max(lo, positions[i]) : Math.max(positions[i], out[order[n - 1]] + minGap);
	});

	for (let n = order.length - 1; n >= 0; n--) {
		const i = order[n];
		const limit = n === order.length - 1 ? hi : out[order[n + 1]] - minGap;
		out[i] = Math.max(lo, Math.min(out[i], limit));
	}

	return out;
}
