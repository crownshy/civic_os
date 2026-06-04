<script lang="ts">
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { InfoBar, Button, EmojiCircle } from '$lib/components/ui';
	import type { RegionConfig } from '$lib/config/regions';

	export type CheckpointVariant = 'contribute' | 'email' | 'feedback' | 'share';

	interface Props {
		countyName: string;
		region: RegionConfig;
		variant?: CheckpointVariant;
		remaining?: number;
		onPrimary: () => void;
		onKeepGoing: () => void;
		onEnd?: () => void;
	}

	let {
		countyName,
		region,
		variant = 'contribute',
		remaining,
		onPrimary,
		onKeepGoing,
		onEnd
	}: Props = $props();

	const content = {
		contribute: {
			emoji: '💬',
			title: 'You’re shaping the conversation.',
			body: 'Feel like something’s missing from the conversation? You can always add your own ideas using the panel at the bottom of the screen.',
			primary: 'ADD STATEMENT'
		},
		email: {
			emoji: '✉️',
			title: 'Stay in touch!',
			body: 'Share your email to receive updates on this conversation and opportunities to share your voice on this issue.',
			primary: 'ENTER EMAIL'
		},
		feedback: {
			emoji: '📝',
			title: 'What do you think?',
			body: 'Give us a quick star rating to let us know how this experience is for you, and how we can improve.',
			primary: 'GIVE FEEDBACK'
		},
		share: {
			emoji: '👋',
			title: 'Bring your friends.',
			body: 'TIP: Want to see what everyone else is saying? Share your email address at the end, and we’ll follow up later with the results.',
			primary: 'SHARE'
		}
	} as const;

	const c = $derived(content[variant]);
</script>

<div
	class="flex h-full flex-col bg-gradient-primary"
	in:scale={{ start: 0.9, duration: 500, easing: cubicOut }}
>
	<InfoBar {region} {countyName} {onEnd} />

	<div class="flex flex-1 flex-col items-center justify-center overflow-y-auto px-8">
		<EmojiCircle emoji={c.emoji} size="lg" />
		<p
			class="mt-8 text-center font-display text-3xl leading-10 font-medium tracking-display text-foreground"
		>
			{c.title}
		</p>
		<p class="mt-4 text-center font-sans text-lg font-medium text-foreground/80">
			{c.body}
		</p>
	</div>

	<div class="flex shrink-0 flex-col gap-3 border-t border-background px-7 py-8">
		{#if remaining != null}
			<p class="text-center font-sans text-base font-medium text-foreground/60">
				{remaining} statements left. Hit <span class="font-bold text-destructive">END</span> when you’re
				done.
			</p>
		{/if}
		<div class="flex items-center gap-3.5">
			<Button variant="secondary" fullWidth onclick={onPrimary}>{c.primary}</Button>
			<Button variant="primary" fullWidth onclick={onKeepGoing}>CONTINUE</Button>
		</div>
	</div>
</div>
