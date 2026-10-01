<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { LocalizedEventDto } from '@crownshy/api-client/api';
	import ConversationEventCard from './ConversationEventCard.svelte';

	const { Story } = defineMeta({
		title: 'Composites/ConversationEventCard',
		component: ConversationEventCard,
		tags: ['autodocs']
	});

	// The formatters the events layout hands down.
	const dateFormatter = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' });
	const timeFormatter = new Intl.DateTimeFormat('en', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});

	const base = {
		id: '0b0e0f00-0000-4000-8000-000000000001',
		conversationId: '0b0e0f00-0000-4000-8000-000000000002',
		createdAt: '2026-10-01T00:00:00Z',
		description: '',
		agenda: [],
		signupMode: 'open',
		startTime: '2026-11-14T20:00:00Z',
		endTime: '2026-11-14T21:30:00Z'
	};

	const inPerson: LocalizedEventDto = {
		...base,
		name: 'Community listening session',
		format: 'in_person',
		location: {
			venue_name: 'Springville Library',
			address_line_1: '45 S Main St',
			city: 'Springville',
			state_province: 'UT',
			postal_code: '84663',
			country_code: 'US'
		}
	};

	const online: LocalizedEventDto = { ...base, name: 'AI & Our Communities', format: 'online' };
</script>

<Story name="In person">
	{#snippet template()}
		<div class="max-w-md p-6">
			<ConversationEventCard event={inPerson} {dateFormatter} {timeFormatter} />
		</div>
	{/snippet}
</Story>

<Story name="Online">
	{#snippet template()}
		<div class="max-w-md p-6">
			<ConversationEventCard event={online} {dateFormatter} {timeFormatter} />
		</div>
	{/snippet}
</Story>
