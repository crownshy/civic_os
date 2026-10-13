import type { PollStatus } from '@civicos/shared/data/poll-status';
import type { PollStatusTarget } from '$lib/api/poll-status';

export interface PollStatusCopy {
	/** Short form for the header badge. */
	badge: string;
	/** Long form for headings ("Your Open Poll is LIVE."). */
	label: string;
	tone: string;
	/** What participants see in this state. */
	summary: string;
	actions: { label: string; next: PollStatusTarget }[];
}

// The header menu and the Open Poll Status card both read this, so the two
// cannot describe a status differently.
export const pollStatusCopy: Record<PollStatus, PollStatusCopy> = {
	draft: {
		badge: 'DRAFT',
		label: 'NOT LIVE YET.',
		tone: 'text-muted-foreground',
		summary: 'Only your team can see it. Go live to start collecting responses.',
		actions: [{ label: 'Go live.', next: 'live' }]
	},
	live: {
		badge: 'LIVE',
		label: 'LIVE.',
		tone: 'text-success',
		summary: 'Collecting responses.',
		actions: [
			{ label: 'Pause the poll.', next: 'paused' },
			{ label: 'Mark it done.', next: 'complete' }
		]
	},
	paused: {
		badge: 'PAUSED',
		label: 'PAUSED.',
		tone: 'text-primary',
		summary: 'Not collecting responses. Participants can still open the Campaign page.',
		actions: [
			{ label: 'Turn the poll back on.', next: 'live' },
			{ label: 'Mark it done.', next: 'complete' }
		]
	},
	complete: {
		badge: 'DONE',
		label: 'DONE.',
		tone: 'text-muted-foreground',
		summary: 'This poll is complete. Participants see the results instead of the poll.',
		actions: [{ label: 'Reopen the poll.', next: 'live' }]
	}
};
