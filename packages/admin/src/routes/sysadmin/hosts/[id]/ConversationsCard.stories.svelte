<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConversationsCard from './ConversationsCard.svelte';

	const { Story } = defineMeta({
		title: 'Sysadmin/ConversationsCard',
		component: ConversationsCard,
		tags: ['autodocs']
	});
</script>

<!-- A Host with one Campaign of its own and one it was added to as a co-host. -->
<Story
	name="Owned and co-hosted"
	args={{
		conversations: [
			{
				id: '11111111-1111-1111-1111-111111111111',
				slug: 'utah',
				title: 'Utah Statewide Conversation',
				status: 'live',
				access: 'owner'
			},
			{
				id: '22222222-2222-2222-2222-222222222222',
				slug: 'oregon',
				title: 'Central Oregon Housing',
				status: 'draft',
				access: 'cohost'
			}
		]
	}}
/>

<!-- Status styling across all three states. -->
<Story
	name="Every status"
	args={{
		conversations: [
			{
				id: '11111111-1111-1111-1111-111111111111',
				slug: 'live-campaign',
				title: 'Live Campaign',
				status: 'live',
				access: 'owner'
			},
			{
				id: '22222222-2222-2222-2222-222222222222',
				slug: 'draft-campaign',
				title: 'Draft Campaign',
				status: 'draft',
				access: 'owner'
			},
			{
				id: '33333333-3333-3333-3333-333333333333',
				slug: 'finished-campaign',
				title: 'Finished Campaign',
				status: 'complete',
				access: 'owner'
			}
		]
	}}
/>

<!-- A Host created in /sysadmin/hosts/new but not yet attached to anything. -->
<Story name="No campaigns" args={{ conversations: [] }} />
