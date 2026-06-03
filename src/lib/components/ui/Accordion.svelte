<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import type { FaqEntry } from '$lib/config/regions';

	interface Props {
		items: FaqEntry[];
		/** Optional class applied to the root */
		class?: string;
	}

	let { items, class: className }: Props = $props();
</script>

<AccordionPrimitive.Root type="single" class={['w-full', className].filter(Boolean).join(' ')}>
	{#each items as item, i (i)}
		<AccordionPrimitive.Item value={`item-${i}`} class="border-b border-foreground/10">
			<AccordionPrimitive.Header>
				<AccordionPrimitive.Trigger
					class="group flex w-full items-center justify-between gap-4 py-4 text-left font-sans text-base font-medium text-foreground transition hover:opacity-80"
				>
					<span>{item.question}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
						aria-hidden="true"
					>
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</AccordionPrimitive.Trigger>
			</AccordionPrimitive.Header>
			<AccordionPrimitive.Content
				class="overflow-hidden font-sans text-base leading-6 font-medium text-foreground/80 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			>
				<div class="pb-4">{@html item.answer}</div>
			</AccordionPrimitive.Content>
		</AccordionPrimitive.Item>
	{/each}
</AccordionPrimitive.Root>
