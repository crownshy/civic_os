<script lang="ts">
	import type { Snippet } from 'svelte';
	import FilterToggle from './FilterToggle.svelte';

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
	<h2 class="text-foreground text-3xl font-semibold leading-tight">{title}</h2>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-foreground/80 max-w-3xl text-base">{description}</p>
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

	<div class="flex flex-col">
		<div
			class="text-muted-foreground/60 grid grid-cols-[1.5rem_1fr_2.5rem_auto] items-center gap-4 px-4 py-2 text-xs font-semibold uppercase"
		>
			<div>#</div>
			<div>Statement</div>
			<div class="text-right">Count</div>
			<div class="pr-4">Groups</div>
		</div>
		{@render children()}
	</div>
</section>
