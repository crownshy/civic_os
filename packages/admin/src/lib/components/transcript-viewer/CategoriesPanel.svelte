<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent
	} from '@civicos/shared/ui/accordion';

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

<div class="bg-card flex h-full flex-col rounded-lg max-lg:h-[600px]">
	<div class="border-border border-b px-5 py-4">
		<h2 class="text-foreground text-lg font-semibold">Categories & Themes</h2>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="p-4">
			<Accordion type="multiple" class="flex flex-col gap-2">
				{#each topics as topic (topic.id)}
					<AccordionItem
						value={topic.id}
						class="bg-secondary/50 border-border rounded-md border px-3"
					>
						<AccordionTrigger class="text-foreground py-3 text-sm font-medium hover:no-underline">
							{topic.title}
						</AccordionTrigger>
						<AccordionContent>
							<p class="text-muted-foreground mb-3 text-sm leading-relaxed">{topic.description}</p>

							{#if topic.subtopics && topic.subtopics.length > 0}
								<Accordion type="multiple" class="flex flex-col gap-1.5">
									{#each topic.subtopics as subtopic (subtopic.id)}
										<AccordionItem
											value={subtopic.id}
											class="bg-background border-border/50 rounded border px-3"
										>
											<AccordionTrigger
												class="text-foreground py-2.5 text-xs font-medium hover:no-underline"
											>
												{subtopic.title}
											</AccordionTrigger>
											<AccordionContent>
												<p class="text-muted-foreground mb-2 text-xs leading-relaxed">
													{subtopic.description}
												</p>

												{#if subtopic.claims && subtopic.claims.length > 0}
													<div class="mt-2 flex flex-col gap-2">
														<span class="text-primary text-xs font-semibold tracking-wide uppercase">
															Key Claims ({subtopic.claims.length})
														</span>
														{#each subtopic.claims.slice(0, 3) as claim}
															<div class="bg-card rounded p-2.5">
																<p class="text-foreground mb-1.5 text-xs leading-snug">
																	{claim.title}
																</p>
																{#if claim.quotes && claim.quotes.length > 0}
																	<button
																		type="button"
																		class="group mt-1 w-full text-left"
																		onclick={() => onQuoteClick(claim.quotes![0])}
																		title="Jump to this moment in the audio"
																	>
																		<blockquote
																			class="text-muted-foreground border-primary group-hover:text-foreground group-hover:border-primary/80 border-l-2 pl-2 text-xs leading-relaxed italic transition-colors"
																		>
																			"{claim.quotes[0].text}"
																		</blockquote>
																		<span
																			class="text-primary/60 group-hover:text-primary mt-0.5 flex items-center gap-1 text-[10px] transition-colors"
																		>
																			▶ play in context
																		</span>
																	</button>
																{/if}
															</div>
														{/each}
													</div>
												{/if}
											</AccordionContent>
										</AccordionItem>
									{/each}
								</Accordion>
							{/if}
						</AccordionContent>
					</AccordionItem>
				{/each}
			</Accordion>
		</div>
	</div>
</div>
