<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		heading: string;
		description: string;
		subheading?: string;
		hasProgressIndicator?: boolean;
		subheadingColor?: string;
		kind?: 'primary' | 'secondary';
		children?: Snippet;
	}

	let {
		heading,
		description,
		subheading,
		hasProgressIndicator = false,
		subheadingColor,
		kind = 'primary',
		children
	}: Props = $props();

	const isPrimary = $derived(kind === 'primary');
</script>

<div
	class="relative rounded-xl p-6 border {isPrimary
		? 'bg-card border-muted-foreground/20'
		: 'bg-card/10 border-card/20'}"
>
	<div class="flex gap-4">
		{#if hasProgressIndicator}
			<!-- Progress Indicator Column -->
			<div class="flex flex-col items-center {isPrimary ? 'gap-2' : ''} shrink-0">
				{#if isPrimary}
					<!-- Primary: Circle at top, line below -->
					{#if subheading}
						<!-- Pulsing indicator for LIVE NOW -->
						<div class="relative">
							<div class="absolute inset-0 bg-destructive/20 rounded-full blur-sm"></div>
							<div class="relative w-4 h-4 {subheadingColor || 'bg-destructive'} rounded-full"></div>
						</div>
					{:else}
						<!-- Simple circle for other states -->
						<div class="w-4 h-4 bg-muted-foreground/20 rounded-full"></div>
					{/if}
					<!-- Vertical line that fills remaining height -->
					<div class="w-px flex-1 {subheadingColor || 'bg-destructive'}"></div>
				{:else}
					<!-- Secondary: Line spans full height, circle overlays it -->
					<div class="relative flex-1 flex flex-col items-center">
						<!-- Full-height line -->
						<div class="absolute inset-y-0 w-px {subheadingColor || 'bg-card/20'}"></div>
						<!-- Circle overlaid on line -->
						<div class="relative w-4 h-4 bg-card/20 rounded-full mt-3"></div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content Column -->
		<div class="flex-1 min-w-0">
			{#if subheading}
				<span
					class="font-mono text-xs font-medium {subheadingColor ||
						(isPrimary ? 'text-destructive' : 'text-card/70')} block mb-3"
				>
					{subheading}
				</span>
			{/if}

			<h3
				class="font-display tracking-display text-3xl font-medium leading-tight mb-3 {isPrimary
					? 'text-primary'
					: 'text-card'}"
			>
				{heading}
			</h3>

			<p
				class="font-sans text-sm font-medium leading-5 mb-6 {isPrimary
					? 'text-muted-foreground'
					: 'text-card'}"
			>
				{description}
			</p>

			{#if children}
				{@render children()}
			{/if}
		</div>
	</div>
</div>
