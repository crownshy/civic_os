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

	// Initial expanded state only — the parent auto-opens the first section, then
	// the user toggles freely (so this intentionally captures `open` once).
	// svelte-ignore state_referenced_locally
	let expanded = $state(open);

	// Flatten claims → quotes, carrying the claim title as each quote's summary line.
	const quotes = $derived(
		(subtopic.claims ?? []).flatMap((claim) =>
			(claim.quotes ?? []).map((q) => ({ summary: claim.title, quote: q })),
		),
	);
</script>

<section class="border-t border-border last:border-b">
	<button
		type="button"
		onclick={() => (expanded = !expanded)}
		class="flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-5 py-2 text-left transition-colors hover:bg-primary/10"
	>
		{#if expanded}
			<span class="size-2 shrink-0 rounded-full bg-primary"></span>
			<span class="text-2xl font-medium text-foreground">{subtopic.title}</span>
		{:else}
			<span class="text-lg font-medium text-foreground">{subtopic.title}</span>
		{/if}
		{#if quotes.length > 0}
			<span class="text-sm font-medium text-primary">
				{quotes.length}
				{quotes.length === 1 ? "QUOTE" : "QUOTES"}
			</span>
		{/if}
	</button>

	{#if expanded}
		<div class="pb-2">
			{#each quotes as item, i (i)}
				{@const seekable = !!item.quote.reference?.sourceId}
				<svelte:element
					this={seekable ? "button" : "div"}
					type={seekable ? "button" : undefined}
					onclick={seekable ? () => onQuoteClick(item.quote) : undefined}
					role={seekable ? "button" : undefined}
					class={`group relative block w-full overflow-hidden text-left transition-colors ${
						seekable ? "cursor-pointer hover:bg-primary/10" : ""
					}`}
				>
					<div class="absolute inset-y-0 left-0 w-[5px] bg-primary"></div>
					<div class="flex flex-col gap-[5px] px-6 py-2.5">
						{#if item.summary}
							<p class="text-xs font-medium leading-4 text-primary">
								{item.summary}
							</p>
						{/if}
						<p class="text-lg leading-6 font-normal text-foreground">
							“{item.quote.text}”
						</p>
						{#if seekable}
							<span
								class="w-fit text-xs font-medium leading-4 text-primary transition-all group-hover:underline"
							>
								VIEW IN CONTEXT →
							</span>
						{/if}
					</div>
				</svelte:element>
			{/each}
		</div>
	{/if}
</section>
