<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConversationCard from './ConversationCard.svelte';

	const { Story } = defineMeta({
		title: 'Data Display/ConversationCard',
		component: ConversationCard,
		tags: ['autodocs']
	});
</script>

<Story
	name="Default"
	args={{
		conversation: {
			id: 'conv-001',
			title: 'Conversation 01',
			date: 'Jan 01 2026',
			organization: 'Interfaith Council',
			deliberationId: 'delib-001'
		}
	}}
>
	{#snippet children(args)}
		<div class="p-6">
			<ConversationCard {...args} />
		</div>
	{/snippet}
</Story>

<Story name="List" args={{}}>
	{#snippet children(args)}
		<div class="flex flex-col gap-2 p-6">
			<ConversationCard
				conversation={{
					id: 'conv-001',
					title: 'Conversation 01',
					date: 'Jan 01 2026',
					organization: 'Interfaith Council',
					deliberationId: 'delib-001'
				}}
			/>
			<ConversationCard
				conversation={{
					id: 'conv-002',
					title: 'Conversation 02',
					date: 'Jan 01 2026',
					organization: 'Interfaith Council',
					deliberationId: 'delib-001'
				}}
			/>
		</div>
	{/snippet}
</Story>
