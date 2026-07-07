<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent,
	} from "@civicos/shared/ui/accordion";

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

	export interface Topic {
		id: string;
		title: string;
		description?: string;
		subtopics?: Subtopic[];
	}

	interface Props {
		topics?: Topic[];
		onQuoteClick?: (quote: Quote) => void;
	}

	let { topics = [], onQuoteClick = () => {} }: Props = $props();
</script>

<div class="bg-card flex flex-col rounded-lg">
	<div class="border-border border-b px-5 py-4">
		<h2 class="text-foreground text-lg font-semibold">Categories & Themes</h2>
	</div>

	<div>
		<div class="p-4">
			{#each topics as topic (topic.id)}
				{#if topic.subtopics && topic.subtopics.length > 0}
					{#each topic.subtopics as subtopic (subtopic.id)}
						<h2 class="text-foreground font-semibold mt-10">
							{subtopic.title}
						</h2>

						{#if subtopic.claims && subtopic.claims.length > 0}
							<div class="mt-2 flex flex-col gap-2">
								{#each subtopic.claims.slice(0, 3) as claim}
									{#if claim.quotes && claim.quotes.length > 0}
										{#each claim.quotes as quote}
											<button
												type="button"
												class="group mt-1 w-full text-left"
												onclick={() => onQuoteClick(quote)}
												title="Jump to this moment in the audio"
											>
												<h3 class="text-sm text-accent-foreground">
													{claim.title}
												</h3>
												<blockquote
													class="text-muted-foreground border-primary group-hover:text-foreground group-hover:border-primary/80 border-l-2 pl-2 leading-relaxed italic transition-colors"
												>
													"{quote.text}"
												</blockquote>
												<span
													class="text-primary/60 group-hover:text-primary mt-0.5 flex items-center gap-1 text-[10px] transition-colors"
												>
													▶ play in context
												</span>
											</button>
										{/each}
									{/if}
								{/each}
							</div>
						{/if}
					{/each}
				{/if}
			{/each}
		</div>
	</div>
</div>
