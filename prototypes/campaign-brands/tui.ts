/**
 * THROWAWAY. `pnpm prototype:brands`.
 *
 * Reads the real `packages/shared/src/data/brand.ts` and the real
 * `theme.css`, so nothing here can drift from what ships. Delete it once the
 * questions in NOTES.md have answers.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
	BRAND_TOKENS,
	brandCss,
	isValidBrandValue,
	readBrand,
	readHostBrand,
	resolveBrand,
	sanitizeBrandCss
} from '../../packages/shared/src/data/brand.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

function heading(n: number, title: string) {
	console.log(`\n${bold(`${n}. ${title}`)}\n${dim('─'.repeat(72))}`);
}

// --- 1. The cascade ----------------------------------------------------------
// One Conversation's metadata, exactly as comhairle would return it anonymously.

const metadata = {
	place: { slug: 'dundee', name: 'Dundee, Scotland' },
	hostBrand: {
		tokens: { background: '#f4f1ea', primary: '#1f4b6e', radius: '0.75rem' },
		css: '--shell-border: #6b7c8c'
	},
	brand: {
		tokens: { primary: '#8c2f39', accent: '#f0dfe1' },
		css: null
	}
};

heading(1, 'The cascade, resolved');

const host = readHostBrand(metadata);
const campaign = readBrand(metadata);
const resolved = resolveBrand(host, campaign);

console.log(dim('  Host    '), JSON.stringify(host?.tokens));
console.log(dim('  Campaign'), JSON.stringify(campaign?.tokens));
console.log(dim('  Resolved'), JSON.stringify(resolved.tokens));
console.log(`\n${brandCss(resolved).replace(/^/gm, '  ')}`);
console.log(
	dim(
		'\n  :root:root, not :root, so the block does not depend on where SvelteKit\n' +
			'  places <svelte:head> content relative to the stylesheet links.'
	)
);

// --- 2. What a Host cannot write --------------------------------------------

heading(2, 'Values that do not survive the read');

const probes: [string, string][] = [
	['a colour', '#8c2f39'],
	['a modern colour', 'oklch(0.55 0.14 25)'],
	['a rule escape', 'red; } html { display: none } .x {'],
	['a remote fetch', 'url(//tracker.test/p.png)'],
	['an indirection', 'var(--something-else)']
];

for (const [label, value] of probes) {
	const ok = isValidBrandValue('color', value);
	console.log(`  ${ok ? green('kept   ') : red('dropped')}  ${label.padEnd(18)} ${dim(value)}`);
}

console.log();
const hostile = 'body { position: fixed; inset: 0; z-index: 99; background: #fff }';
console.log(`  ${red('dropped')}  ${'a page cover'.padEnd(18)} ${dim(hostile)}`);
console.log(`           ${dim(`sanitizeBrandCss → ${sanitizeBrandCss(hostile)}`)}`);
console.log(
	dim(
		'\n  This is the open question, not a settled answer. "Custom CSS" here means\n' +
			'  custom properties and nothing else, because a Host who can write a rule\n' +
			'  can cover the participant page with one (ADR 0005 banned `class` on the\n' +
			'  same reasoning). Real rules need an iframe or a CSP first.'
	)
);

// --- 3. What a rebrand does not reach ---------------------------------------
// The point of the exercise. A Host sets all 17 tokens; which of civicos's own
// variables still carry BLOOM's colours?

heading(3, 'Variables a Brand cannot reach');

const themeCss = readFileSync(resolve(ROOT, 'packages/civicos/src/lib/styles/theme.css'), 'utf8');
const rootBlock = themeCss.slice(themeCss.indexOf(':root'), themeCss.indexOf('.dark'));
const declared = [...rootBlock.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]);
const brandable = new Set(BRAND_TOKENS.map((t) => t.cssVar));
const unreachable = declared.filter((v) => !brandable.has(v));

function usageCount(cssVar: string): number {
	const utility = cssVar.replace(/^--/, '');
	try {
		const out = execFileSync(
			'grep',
			['-rlE', `(var\\(${cssVar}\\)|-${utility}\\b)`, 'packages/civicos/src', 'packages/shared/src'],
			{ cwd: ROOT, encoding: 'utf8' }
		);
		return out.trim().split('\n').filter(Boolean).length;
	} catch {
		return 0;
	}
}

const ranked = unreachable
	.map((v) => ({ v, files: usageCount(v) }))
	.sort((a, b) => b.files - a.files);

console.log(
	`  ${declared.length} variables in theme.css, ${brandable.size} of them brandable.\n` +
		`  The other ${unreachable.length} keep BLOOM's colours no matter what a Host sets.\n`
);
console.log(`  ${dim('files'.padStart(5))}  ${dim('variable')}`);
for (const { v, files } of ranked.filter((r) => r.files > 0).slice(0, 12)) {
	console.log(`  ${String(files).padStart(5)}  ${v}`);
}
console.log(
	dim(
		`\n  ...and ${ranked.length - 12} more. --destructive alone is in ${ranked[0].files} files;\n` +
			"  a Host who rebrands still gets BLOOM's error red."
	)
);

// --- 4. The layer that is not here ------------------------------------------

heading(4, 'The layer with no home');

console.log(
	'  Organization.metadata.brand is the real Host layer, and civicos cannot\n' +
		'  read it: /organizations answers 401 anonymously. So it is mirrored onto\n' +
		'  every Conversation the Host runs, as metadata.hostBrand.\n\n' +
		`  ${red('Nothing in this repo writes that mirror yet.')} The admin Brand card writes\n` +
		'  the Campaign layer only. A Host with four Campaigns is four writes, and\n' +
		'  a Campaign moved to another Host keeps the old look until\n' +
		'  something rewrites it. That is the same staleness metadata.poll and\n' +
		'  metadata.org already carry, at four times the surface.\n'
);

console.log(dim(`\n${'─'.repeat(72)}\nNOTES.md has the questions this raises.\n`));
