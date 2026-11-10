<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Mail, MapPin } from '@lucide/svelte';
	import BottomSheet from './BottomSheet.svelte';
	import Button from './Button.svelte';
	import FieldRow from './FieldRow.svelte';

	const { Story } = defineMeta({
		title: 'Composites/BottomSheet',
		component: BottomSheet,
		tags: ['autodocs']
	});
</script>

<Story name="Join">
	{#snippet template()}
		<BottomSheet open label="AI & Springville" title="Join the Conversation">
			<p class="mx-auto mt-4 max-w-sm text-center font-sans text-base text-foreground">
				To participate, you must be a real person living in this area.
			</p>
			<div class="mt-6 flex flex-col gap-2">
				<FieldRow>
					{#snippet icon()}<Mail class="size-4" />{/snippet}
					<span class="text-lg text-foreground/70">Your email...</span>
				</FieldRow>
				<FieldRow filled>
					{#snippet icon()}<MapPin class="size-4" />{/snippet}
					<span class="text-lg">84101, Salt Lake County</span>
				</FieldRow>
			</div>
			{#snippet footer()}
				<Button fullWidth class="font-display text-xl normal-case">Let's go!</Button>
			{/snippet}
		</BottomSheet>
	{/snippet}
</Story>
