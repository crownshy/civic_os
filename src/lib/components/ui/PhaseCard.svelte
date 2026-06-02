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
	class="relative rounded-xl border p-6 {isPrimary
		? 'border-muted-foreground/20 bg-card'
		: 'border-card/20 bg-card/10'}"
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
							<div class="absolute inset-0 rounded-full bg-destructive/20 blur-sm"></div>
							<div
								class="relative h-4 w-4 {subheadingColor || 'bg-destructive'} rounded-full"
							></div>
						</div>
					{:else}
						<!-- Simple circle for other states -->
						<div class="h-4 w-4 rounded-full bg-muted-foreground/20"></div>
					{/if}
					<!-- Vertical line that fills remaining height -->
					<div class="w-px flex-1 {subheadingColor || 'bg-destructive'}"></div>
				{:else}
					<!-- Secondary: Line spans full height, circle overlays it -->
					<div class="relative flex flex-1 flex-col items-center">
						<!-- Full-height line -->
						<div class="absolute inset-y-0 w-px {subheadingColor || 'bg-card/20'}"></div>
						<!-- Circle overlaid on line -->
						<div class="relative mt-3 h-4 w-4 rounded-full bg-card/20"></div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content Column -->
		<div class="min-w-0 flex-1">
			{#if subheading}
				<span
					class="font-mono text-xs font-medium {subheadingColor ||
						(isPrimary ? 'text-destructive' : 'text-card/70')} mb-3 block"
				>
					{subheading}
				</span>
			{/if}

			<h3
				class="mb-3 font-sans text-3xl leading-tight font-bold {isPrimary
					? 'text-primary'
					: 'text-card'}"
			>
				{heading}
			</h3>

			<p
				class="mb-6 font-sans text-sm leading-5 font-medium {isPrimary
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
