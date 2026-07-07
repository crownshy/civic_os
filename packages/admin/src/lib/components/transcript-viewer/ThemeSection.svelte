<script lang="ts" module>
	export interface Quote {
		text: string;
		reference?: { sourceId?: string };
	}
	export interface Claim {
		title: string;
		quotes?: Quote[];
	}
	export interface Subtopic {
		id: string;
		title: string;
		description?: string;
		claims?: Claim[];
	}
</script>

<script lang="ts">
	interface Props {
		subtopic: Subtopic;
		open?: boolean;
		onQuoteClick?: (quote: Quote) => void;
	}

	let { subtopic, open = false, onQuoteClick = () => {} }: Props = $props();

	let expanded = $state(open);

	// Flatten claims → quotes, carrying the claim title as each quote's summary line.
	const quotes = $derived(
		(subtopic.claims ?? []).flatMap((claim) =>
			(claim.quotes ?? []).map((q) => ({ summary: claim.title, quote: q })),
		),
	);
</script>

<section class="border-t border-neutral-200 last:border-b">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex h-12 w-full items-center gap-2.5 px-5 text-left"
	>
		{#if expanded}
			<span class="size-2 shrink-0 rounded-full bg-red-500"></span>
			<span class="text-2xl font-medium text-black">{subtopic.title}</span>
		{:else}
			<span class="text-lg font-medium text-black">{subtopic.title}</span>
		{/if}
		{#if quotes.length > 0}
			<span class="text-sm font-medium text-red-500">
				{quotes.length}
				{quotes.length === 1 ? "QUOTE" : "QUOTES"}
			</span>
		{/if}
	</button>

	{#if expanded}
		<div class="pb-2">
			{#each quotes as item, i (i)}
				<div class="relative overflow-hidden">
					<div class="absolute inset-y-0 left-0 w-[5px] bg-red-500"></div>
					<div class="flex flex-col gap-[5px] px-6 py-2.5">
						{#if item.summary}
							<p class="text-xs font-medium leading-4 text-red-500">
								{item.summary}
							</p>
						{/if}
						<p class="text-lg leading-6 font-normal text-neutral-900">
							“{item.quote.text}”
						</p>
						{#if item.quote.reference?.sourceId}
							<button
								type="button"
								onclick={() => onQuoteClick(item.quote)}
								class="w-fit text-xs font-medium leading-4 text-red-500"
							>
								VIEW IN CONTEXT →
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>
