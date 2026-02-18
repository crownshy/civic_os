<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AvatarRow from './AvatarRow.svelte';

	const { Story } = defineMeta({
		title: 'UI/AvatarRow',
		component: AvatarRow,
		tags: ['autodocs']
	});

	const avatars = [
		{ id: 'av-1', color: '#FF6B6B', emoji: '🦊' },
		{ id: 'av-2', color: '#4ECDC4', emoji: '🦉' },
		{ id: 'av-3', color: '#45B7D1', emoji: '🐻' },
		{ id: 'av-4', color: '#96CEB4', emoji: '🦁' },
		{ id: 'av-5', color: '#FFEAA7', emoji: '🐸' },
		{ id: 'av-6', color: '#DDA0DD', emoji: '🦋' },
		{ id: 'av-7', color: '#98D8C8', emoji: '🐬' }
	];
</script>

<Story name="Default" args={{ avatars }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<AvatarRow {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With Selection" args={{ avatars, selected: 'av-3' }}>
	{#snippet children(args)}
		<div class="bg-primary p-8">
			<AvatarRow {...args} />
		</div>
	{/snippet}
</Story>
