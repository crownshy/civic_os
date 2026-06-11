<script lang="ts">
	/**
	 * Visual indicator for one group's vote breakdown on a single statement.
	 * Renders a colored ring showing the dominant vote (agree/disagree/pass)
	 * with a small "remainder" arc beneath it, and the dominant percentage
	 * inside the ring.
	 */
	interface Props {
		label: string;
		agreed: number;
		disagreed: number;
		passed: number;
		size?: 'sm' | 'md';
	}

	let { label, agreed, disagreed, passed, size = 'sm' }: Props = $props();

	type Verdict = 'agree' | 'disagree' | 'pass';
	const verdict = $derived<Verdict>(
		agreed >= disagreed && agreed >= passed
			? 'agree'
			: disagreed >= passed
				? 'disagree'
				: 'pass'
	);
	const pct = $derived(
		verdict === 'agree' ? agreed : verdict === 'disagree' ? disagreed : passed
	);
	const ringClass = $derived(
		verdict === 'agree'
			? 'border-primary'
			: verdict === 'disagree'
				? 'border-destructive'
				: 'border-input'
	);
	const ringSize = $derived(size === 'md' ? 'size-9' : 'size-8');
</script>

<div class="flex flex-col items-center gap-0.5">
	<div
		class={`relative ${ringSize} rounded-full border-4 ${ringClass} flex items-center justify-center`}
	>
		<span class="text-foreground text-[10px] font-bold leading-none">{Math.round(pct)}</span>
	</div>
	<span class="text-muted-foreground text-[10px] font-semibold uppercase">{label}</span>
</div>
