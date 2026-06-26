<script lang="ts">
	import type { Snippet } from 'svelte';
	import FilterToggle from './FilterToggle.svelte';
	import Card from '@civicos/shared/ui/Card.svelte';

	interface Props {
		title: string;
		description: string;
		excludePasses?: boolean;
		excludeHosts?: boolean;
		onExcludePassesChange?: (next: boolean) => void;
		onExcludeHostsChange?: (next: boolean) => void;
		children: Snippet;
	}

	let {
		title,
		description,
		excludePasses = $bindable(false),
		excludeHosts = $bindable(true),
		onExcludePassesChange,
		onExcludeHostsChange,
		children
	}: Props = $props();
</script>

<section class="flex flex-col gap-4">
	<h2 class="text-foreground text-display font-semibold leading-tight">{title}</h2>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-foreground/80 max-w-3xl text-body">{description}</p>
		<div class="flex items-center gap-2">
			<FilterToggle
				label="Exclude passes"
				bind:checked={excludePasses}
				onchange={onExcludePassesChange}
			/>
			<FilterToggle
				label="Exclude host statements"
				bind:checked={excludeHosts}
				onchange={onExcludeHostsChange}
			/>
		</div>
	</div>

	<Card class="hover:border-muted-foreground/40 shadow-card transition-colors duration-200">
		<div class="flex flex-col">
			<div
				class="text-muted-foreground/60 grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(10rem,14rem)_2.5rem_auto_auto] items-center gap-4 px-4 py-2 text-caption font-semibold uppercase"
			>
				<div>#</div>
				<div>Statement</div>
				<div>Theme</div>
				<div class="text-right">Count</div>
				<div>Groups</div>
				<div class="pr-4">Action</div>
			</div>
			{@render children()}
		</div>
	</Card>
</section>
