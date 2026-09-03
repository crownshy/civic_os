<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ParticipantAsksCard from '$lib/components/setup/ParticipantAsksCard.svelte';
	import { DEFAULT_ASK_TOGGLES } from '@civicos/shared/data/participant-asks';

	const { Story } = defineMeta({
		title: 'Setup/ParticipantAsksCard',
		component: ParticipantAsksCard,
		tags: ['autodocs'],
		args: {
			title: 'Participant Asks',
			subtitle:
				'What we ask participants for besides their votes. Each one shows up while they vote and again on the thank-you page.',
			toggles: DEFAULT_ASK_TOGGLES,
			onToggle: async () => {}
		}
	});
</script>

<Story name="All on" />

<Story
	name="Some off"
	args={{ toggles: { contribute: true, email: false, feedback: false, share: true } }}
/>

<!-- No onToggle: the switches render but cannot be operated. -->
<Story name="Read only" args={{ onToggle: undefined }} />
