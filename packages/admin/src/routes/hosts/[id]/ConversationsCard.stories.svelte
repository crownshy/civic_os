<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ConversationsCard from './ConversationsCard.svelte';

	const { Story } = defineMeta({
		title: 'Hosts/ConversationsCard',
		component: ConversationsCard,
		tags: ['autodocs'],
		args: { canAssign: true }
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

<!-- What a Host admin sees: the same list, with no controls to add or remove. -->
<Story
	name="Host admin (read only)"
	args={{
		canAssign: false,
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
				slug: 'salt-lake',
				title: 'Salt Lake County Conversation',
				status: 'draft',
				access: 'cohost'
			}
		],
		assignable: [{ id: '44444444-4444-4444-4444-444444444444', title: 'Unowned Draft' }]
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

<!-- A Host created in /hosts/new but not yet attached to anything. -->
<Story name="No campaigns" args={{ conversations: [] }} />

<!-- The assign control only appears when there is an unowned Campaign to give. -->
<Story
	name="With assignable campaigns"
	args={{
		conversations: [
			{
				id: '11111111-1111-1111-1111-111111111111',
				slug: 'utah',
				title: 'Utah Statewide Conversation',
				status: 'live',
				access: 'owner'
			}
		],
		assignable: [
			{ id: '44444444-4444-4444-4444-444444444444', title: 'Unassigned Fixture Campaign' },
			{ id: '55555555-5555-5555-5555-555555555555', title: 'Draft Housing Poll' }
		]
	}}
/>
