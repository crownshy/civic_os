/**
 * PROTOTYPE SHELL — throwaway. Run: `pnpm prototype:places`
 *
 * Thin terminal driver over model.ts. Everything interesting is in the model;
 * this only reads keys and re-renders. Delete this file when the question in
 * NOTES.md has an answer.
 */

import {
	SEED,
	campaignsIn,
	conflicts,
	editQuestion,
	linkPlace,
	overrideQuestion,
	placesOf,
	pollKey,
	questionOf,
	resolve,
	unlinkPlace,
	type Outcome,
	type World
} from './model.ts';

const B = (s: string) => `\x1b[1m${s}\x1b[0m`;
const D = (s: string) => `\x1b[2m${s}\x1b[0m`;
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;

let world: World = SEED;
let note = 'Seeded with the Utah / Oregon / catch-all engagement as it actually ran.';
let probe: { subdomain: string; segment: string | null } = { subdomain: 'chile', segment: 'ai' };

function describe(r: ReturnType<typeof resolve>): string {
	switch (r.kind) {
		case 'poll':
			return G(`serve ${pollKey(r.poll)}  ${D(`(${r.poll.hostOrg}, ${r.poll.votes} votes)`)}`);
		case 'redirect':
			return G(`redirect -> ${r.to}  ${D('(only one campaign here)')}`);
		case 'place-index':
			return Y(`PLACE INDEX needed: ${r.campaigns.join(', ')}  ${D('(no page for this exists)')}`);
		case 'empty-place':
			return R('404  no campaigns run here');
		case 'unknown-place':
			return R('404  unknown subdomain  ' + D('(nginx never routes this to us today)'));
		case 'no-such-campaign':
			return R(`404  no campaign "${r.slug}" anywhere`);
		case 'wrong-place':
			return r.elsewhere.length === 1
				? R(`404  + "GO TO ${r.elsewhere[0].toUpperCase()}"`)
				: R(`404  runs in ${r.elsewhere.length} places (${r.elsewhere.join(', ')})  `) +
						Y('which one does the button point at?');
	}
}

function render() {
	const lines: string[] = [];
	lines.push(B('CAMPAIGN <-> PLACE') + D('   many-to-many; each pair is one comhairle conversation'));
	lines.push(D('  acting as: ') + (world.actingOrg === '*' ? 'BLOOM super user' : world.actingOrg));
	lines.push('');

	lines.push(B('PLACES') + D('  (subdomains)'));
	for (const p of world.places)
		lines.push(`  ${p.slug.padEnd(10)} ${D(p.name.padEnd(18))} ${D(`${campaignsIn(world, p.slug).length} campaign(s)`)}`);
	lines.push('');

	lines.push(B('CAMPAIGNS') + D('  (path segments)'));
	for (const c of world.campaigns)
		lines.push(`  ${c.slug.padEnd(10)} ${D(c.title.padEnd(24))} ${D(`in: ${placesOf(world, c.slug).join(', ') || 'nowhere'}`)}`);
	lines.push('');

	lines.push(B('POLLS') + D('  campaign x place -> Conversation + Polis step'));
	if (!world.polls.length) lines.push(D('  none'));
	for (const p of world.polls) {
		const q = questionOf(world, p);
		lines.push(
			`  ${pollKey(p).padEnd(14)} ${D(p.hostOrg.padEnd(34))} ${String(p.votes).padStart(4)} votes ${p.questionOverride ? Y('local') : D('inherits')}`
		);
		lines.push(D(`      "${q.slice(0, 88)}${q.length > 88 ? '...' : ''}"`));
	}
	lines.push('');

	lines.push(B('URL PROBE') + D(`   ${probe.subdomain}.bloomproject.us/${probe.segment ?? ''}`));
	lines.push('  ' + describe(resolve(world, probe.subdomain, probe.segment)));
	lines.push('');

	const c = conflicts(world);
	lines.push(B('UNDECIDED') + D('  things this model allows that the URL scheme cannot express'));
	if (!c.length) lines.push(G('  none'));
	for (const line of c) lines.push('  ' + Y('* ') + line);
	lines.push('');

	lines.push(D('> ') + note);
	lines.push('');
	lines.push(
		D('[l]') + ' link campaign->place  ' + D('[u]') + ' unlink  ' + D('[c]') + ' new campaign  ' +
		D('[p]') + ' new place'
	);
	lines.push(
		D('[e]') + ' edit campaign question  ' + D('[o]') + ' localise one poll  ' + D('[v]') + ' add votes'
	);
	lines.push(
		D('[w]') + ' switch acting org  ' + D('[t]') + ' set URL probe  ' + D('[r]') + ' reset  ' + D('[q]') + ' quit'
	);

	console.clear();
	console.log(lines.join('\n'));
}

// --- input ------------------------------------------------------------------

const rl = (await import('node:readline/promises')).createInterface({
	input: process.stdin,
	output: process.stdout
});

async function ask(q: string): Promise<string> {
	const answer = await rl.question(D(q));
	return answer.trim();
}

function apply(outcome: Outcome) {
	if (outcome.ok) {
		world = outcome.world;
		note = G(outcome.note);
	} else {
		note = R(outcome.reason);
	}
}

const actions: Record<string, () => Promise<void>> = {
	async l() {
		const campaign = await ask('campaign slug: ');
		const place = await ask('place slug: ');
		const host = (await ask('owning host org: ')) || 'Bloom Project';
		apply(linkPlace(world, campaign, place, host));
	},
	async u() {
		apply(unlinkPlace(world, await ask('campaign slug: '), await ask('place slug: ')));
	},
	async c() {
		const slug = await ask('new campaign slug: ');
		if (!slug) return;
		if (world.campaigns.some((x) => x.slug === slug)) {
			note = R(`A campaign "${slug}" already exists. Slugs are the path segment, so they collide.`);
			return;
		}
		const title = (await ask('title: ')) || slug;
		world = {
			...world,
			campaigns: [...world.campaigns, { slug, title, question: `(unset for ${slug})`, seedStatements: [] }]
		};
		note = G(`Added campaign "${slug}". It runs nowhere until you link a place.`);
	},
	async p() {
		const slug = await ask('new place slug (subdomain): ');
		if (!slug) return;
		if (world.places.some((x) => x.slug === slug)) {
			note = R(`Place "${slug}" already exists.`);
			return;
		}
		world = { ...world, places: [...world.places, { slug, name: (await ask('name: ')) || slug }] };
		note = G(`Added place "${slug}". DNS and ingress for ${slug}.bloomproject.us are a separate job.`);
	},
	async e() {
		apply(editQuestion(world, await ask('campaign slug: '), await ask('new question: ')));
	},
	async o() {
		apply(
			overrideQuestion(
				world,
				await ask('campaign slug: '),
				await ask('place slug: '),
				await ask('this poll\'s wording: ')
			)
		);
	},
	async v() {
		const campaign = await ask('campaign slug: ');
		const place = await ask('place slug: ');
		const n = Number(await ask('votes to add: ')) || 1;
		world = {
			...world,
			polls: world.polls.map((p) =>
				p.campaignSlug === campaign && p.placeSlug === place ? { ...p, votes: p.votes + n } : p
			)
		};
		note = `Added ${n} votes to ${campaign}@${place}.`;
	},
	async w() {
		const org = await ask('acting org (* for BLOOM super user): ');
		world = { ...world, actingOrg: org || '*' };
		note = `Now acting as ${world.actingOrg}.`;
	},
	async t() {
		const sub = await ask('subdomain: ');
		const seg = await ask('path segment (blank = place root): ');
		probe = { subdomain: sub, segment: seg || null };
		note = 'Probe updated.';
	},
	async r() {
		world = SEED;
		note = 'Reset to the seeded engagement.';
	}
};

render();
for (;;) {
	const key = (await ask('\n> ')).toLowerCase();
	if (key === 'q') break;
	const action = actions[key];
	if (action) await action();
	else note = D(`Unknown key "${key}".`);
	render();
}
rl.close();
console.log('\nCapture what this taught you in prototypes/campaign-places/NOTES.md\n');
