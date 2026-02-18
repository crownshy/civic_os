<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConversationCard from './ConversationCard.svelte';

	const { Story } = defineMeta({
		title: 'UI/ConversationCard',
		component: ConversationCard,
		tags: ['autodocs']
	});

	const mockConversation = {
		id: 'conv-001',
		title: 'CONVERSATION 01',
		date: 'JAN 01 2026',
		organization: 'INTERFAITH COUNCIL',
		deliberationId: 'delib-001'
	};
</script>

<Story name="Default" args={{ conversation: mockConversation }}>
	{#snippet children(args)}
		<ConversationCard {...args} />
	{/snippet}
</Story>
