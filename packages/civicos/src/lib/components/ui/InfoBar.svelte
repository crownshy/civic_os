<script lang="ts">
	import Button from './Button.svelte';
	import { page } from '$app/state';
	import { campaignPath } from '@civicos/shared/data/place';
	import { cn } from '$lib/utils';

	interface Props {
		placeName: string;
		onBack?: () => void;
		backLabel?: string;
		buttonText?: string;
		onEnd?: () => void;
		/** Renders END as a disabled placeholder, so a skeleton header is the same
		 *  shape as the screen it stands in for. */
		skeleton?: boolean;
		variant?: 'default' | 'light' | 'dark';
		class?: string;
	}

	let {
		placeName,
		onBack,
		backLabel = '← BACK TO VOTING',
		buttonText = 'ABOUT →',
		onEnd,
		skeleton = false,
		variant = 'default',
		class: className
	}: Props = $props();

	// The Campaign's own homepage, which carries the Host's Context copy, their
	// FAQ and who is hosting. This used to be a fixed link to `/campaign/ai`, a
	// page outside the `[campaign]` route that always rendered the USA catch-all,
	// so ABOUT took a participant from their Campaign to a marketing page about
	// somebody else's. Every screen this bar appears on is under `[campaign]`,
	// so the params are always there.
	const aboutHref = $derived(campaignPath(page.params.campaign, page.params.org));

	const variantStyles = {
		default: '',
		light:
			'text-white/80 [&_button]:text-white/80 [&_button]:bg-white/10 [&_button]:hover:bg-white/20',
		dark: ''
	};
</script>

<div
	class={cn(
		'flex items-center justify-between py-3.75 pr-3.75 pl-6',
		variantStyles[variant],
		className
	)}
>
	{#if onBack}
		<Button variant="soft" size="xs" onclick={onBack}>
			{backLabel}
		</Button>
	{:else}
		<div class="flex items-center gap-1.5">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="currentColor"
				class={cn('text-foreground/80', variant === 'light' && 'text-white/80')}
			>
				<path
					d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
				/>
			</svg>
			<span
				class={cn(
					'font-mono text-sm font-medium text-foreground/70',
					variant === 'light' && 'text-white/70'
				)}>{placeName.toUpperCase()}</span
			>
		</div>
	{/if}

	<div class="flex items-center gap-1.5">
		<Button
			variant={variant === 'light' ? 'ghost' : 'soft'}
			size="xs"
			href={aboutHref}
			class={variant === 'light' ? 'bg-white/10 text-white/80' : ''}
		>
			{buttonText}
		</Button>
		{#if onEnd || skeleton}
			<Button variant="destructive" size="xs" disabled={skeleton} onclick={onEnd}>END</Button>
		{/if}
	</div>
</div>
