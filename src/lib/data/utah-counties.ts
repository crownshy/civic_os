/**
 * Maps Utah zip codes to county names.
 * Covers the three focus counties (Cache, Salt Lake, Utah) plus major others.
 * Falls back to "Utah" (the state) for unknown zips.
 */

const ZIP_TO_COUNTY: Record<string, string> = {
	// --- Salt Lake County ---
	'84006': 'Salt Lake',
	'84020': 'Salt Lake',
	'84044': 'Salt Lake',
	'84047': 'Salt Lake',
	'84065': 'Salt Lake',
	'84070': 'Salt Lake',
	'84081': 'Salt Lake',
	'84084': 'Salt Lake',
	'84088': 'Salt Lake',
	'84092': 'Salt Lake',
	'84093': 'Salt Lake',
	'84094': 'Salt Lake',
	'84095': 'Salt Lake',
	'84101': 'Salt Lake',
	'84102': 'Salt Lake',
	'84103': 'Salt Lake',
	'84104': 'Salt Lake',
	'84105': 'Salt Lake',
	'84106': 'Salt Lake',
	'84107': 'Salt Lake',
	'84108': 'Salt Lake',
	'84109': 'Salt Lake',
	'84110': 'Salt Lake',
	'84111': 'Salt Lake',
	'84112': 'Salt Lake',
	'84113': 'Salt Lake',
	'84114': 'Salt Lake',
	'84115': 'Salt Lake',
	'84116': 'Salt Lake',
	'84117': 'Salt Lake',
	'84118': 'Salt Lake',
	'84119': 'Salt Lake',
	'84120': 'Salt Lake',
	'84121': 'Salt Lake',
	'84122': 'Salt Lake',
	'84123': 'Salt Lake',
	'84124': 'Salt Lake',
	'84125': 'Salt Lake',
	'84126': 'Salt Lake',
	'84127': 'Salt Lake',
	'84128': 'Salt Lake',
	'84130': 'Salt Lake',
	'84131': 'Salt Lake',
	'84132': 'Salt Lake',
	'84133': 'Salt Lake',
	'84138': 'Salt Lake',
	'84141': 'Salt Lake',
	'84143': 'Salt Lake',
	'84145': 'Salt Lake',
	'84147': 'Salt Lake',
	'84150': 'Salt Lake',
	'84151': 'Salt Lake',
	'84152': 'Salt Lake',
	'84157': 'Salt Lake',
	'84158': 'Salt Lake',
	'84165': 'Salt Lake',
	'84170': 'Salt Lake',
	'84171': 'Salt Lake',
	'84180': 'Salt Lake',
	'84184': 'Salt Lake',
	'84190': 'Salt Lake',
	'84199': 'Salt Lake',

	// --- Utah County ---
	'84003': 'Utah',
	'84004': 'Utah',
	'84005': 'Utah',
	'84013': 'Utah',
	'84042': 'Utah',
	'84043': 'Utah',
	'84045': 'Utah',
	'84057': 'Utah',
	'84058': 'Utah',
	'84059': 'Utah',
	'84062': 'Utah',
	'84097': 'Utah',
	'84601': 'Utah',
	'84602': 'Utah',
	'84603': 'Utah',
	'84604': 'Utah',
	'84605': 'Utah',
	'84606': 'Utah',
	'84620': 'Utah',
	'84626': 'Utah',
	'84633': 'Utah',
	'84645': 'Utah',
	'84651': 'Utah',
	'84653': 'Utah',
	'84655': 'Utah',
	'84660': 'Utah',
	'84663': 'Utah',
	'84664': 'Utah',

	// --- Cache County ---
	'84318': 'Cache',
	'84319': 'Cache',
	'84321': 'Cache',
	'84322': 'Cache',
	'84325': 'Cache',
	'84327': 'Cache',
	'84328': 'Cache',
	'84332': 'Cache',
	'84333': 'Cache',
	'84335': 'Cache',
	'84338': 'Cache',
	'84339': 'Cache',
	'84341': 'Cache',

	// --- Davis County ---
	'84010': 'Davis',
	'84014': 'Davis',
	'84015': 'Davis',
	'84025': 'Davis',
	'84037': 'Davis',
	'84040': 'Davis',
	'84041': 'Davis',
	'84054': 'Davis',
	'84056': 'Davis',
	'84075': 'Davis',
	'84087': 'Davis',

	// --- Weber County ---
	'84067': 'Weber',
	'84201': 'Weber',
	'84310': 'Weber',
	'84315': 'Weber',
	'84401': 'Weber',
	'84402': 'Weber',
	'84403': 'Weber',
	'84404': 'Weber',
	'84405': 'Weber',
	'84407': 'Weber',
	'84408': 'Weber',
	'84409': 'Weber',
	'84412': 'Weber',
	'84414': 'Weber',
	'84415': 'Weber',

	// --- Washington County ---
	'84720': 'Washington',
	'84738': 'Washington',
	'84745': 'Washington',
	'84770': 'Washington',
	'84780': 'Washington',
	'84790': 'Washington',
};

export function getCountyFromZip(zip: string): string {
	const trimmed = zip.trim();
	if (ZIP_TO_COUNTY[trimmed]) return ZIP_TO_COUNTY[trimmed];

	// Fallback: prefix-based heuristic
	const prefix = trimmed.slice(0, 3);
	switch (prefix) {
		case '841': return 'Salt Lake';
		case '846': return 'Utah';
		case '843': return 'Cache';
		case '840': return 'Davis';
		case '844': return 'Weber';
		case '847': return 'Washington';
		default: return 'Utah';
	}
}
