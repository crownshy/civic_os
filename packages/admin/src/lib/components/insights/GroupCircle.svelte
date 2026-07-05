<script lang="ts">
	/**
	 * Visual indicator for one group's vote breakdown on a single statement.
	 * Renders a colored ring showing the dominant vote (agree/disagree/pass)
	 * with the dominant percentage inside the ring.
	 */
	interface Props {
		label?: string;
		agreed: number;
		disagreed: number;
		passed: number;
		size?: 'sm' | 'md';
		/** Show the group label beneath the ring. Off in dense statement rows. */
		showLabel?: boolean;
	}

	let { label = '', agreed, disagreed, passed, size = 'sm', showLabel = true }: Props = $props();

	type Verdict = 'agree' | 'disagree' | 'pass';
	const verdict = $derived<Verdict>(
		agreed >= disagreed && agreed >= passed ? 'agree' : disagreed >= passed ? 'disagree' : 'pass'
	);
	const pct = $derived(verdict === 'agree' ? agreed : verdict === 'disagree' ? disagreed : passed);
	const ringClass = $derived(
		verdict === 'agree'
			? 'border-consensus'
			: verdict === 'disagree'
				? 'border-destructive'
				: 'border-border'
	);
	const ringSize = $derived(size === 'md' ? 'size-11' : 'size-10');
</script>

<div class="flex flex-col items-center gap-0.5">
	<div
		class={`relative ${ringSize} rounded-full border-[5px] ${ringClass} flex items-center justify-center`}
	>
		<span class="font-ui text-foreground text-caption font-bold leading-none">{Math.round(pct)}</span>
	</div>
	{#if showLabel && label}
		<span class="text-muted-foreground text-caption font-semibold uppercase">{label}</span>
	{/if}
</div>
