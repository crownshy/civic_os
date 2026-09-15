<script lang="ts">
	import { MapPin } from '@lucide/svelte';

	interface Props {
		campaignTitle: string;
		placeName: string;
		hostName: string;
	}

	let { campaignTitle, placeName, hostName }: Props = $props();
</script>

<!-- Mock of the participant landing hero. Type sizes are one rung down from the
     real screen so a 375pt page fits the frame; every colour and font is a
     token, so what moves here moves there. -->
<div class="flex h-full flex-col overflow-y-auto bg-background text-foreground">
	<header class="flex shrink-0 items-center justify-between px-5 pt-4">
		<div class="flex items-center gap-1.5 font-mono text-[11px] font-medium text-stone-500">
			<MapPin class="size-3.5" />
			{placeName.toUpperCase()}
		</div>
		<span
			class="rounded-[20px] bg-yellow-600/10 px-2 py-0.5 font-mono text-[11px] font-medium text-stone-500"
		>
			ABOUT→
		</span>
	</header>

	<div class="flex flex-1 flex-col items-center px-5 pt-6 pb-8">
		<!-- The OPEN POLL chip is `bg-yellow-950` in civicos, a Tailwind literal
		     rather than a token, so no Brand moves it. Left literal here for the
		     same reason. -->
		<span
			class="rounded-[30px] bg-yellow-950 px-3 py-1.5 font-mono text-[11px] font-medium text-white"
		>
			OPEN POLL
		</span>

		<h1
			class="mt-3 text-center font-[family-name:var(--font-display)] text-[28px] leading-[1.05] font-medium tracking-[var(--tracking-display)]"
		>
			{campaignTitle}
		</h1>

		<p class="mt-4 text-center font-sans text-[13px] leading-4 font-medium">
			Your neighbours are already weighing in. Add your voice, and see where {placeName} agrees.
		</p>

		<div class="mt-7 flex w-full flex-col items-center">
			<span class="font-[family-name:var(--font-display)] text-[13px] font-medium opacity-80">
				Your location
			</span>
			<span
				class="mt-1.5 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full bg-card px-5 font-sans text-[13px] font-medium text-secondary/80 shadow-[inset_2px_4px_4.4px_0px_rgba(79,62,11,0.25)] outline-2 -outline-offset-2 outline-secondary/30"
			>
				<MapPin class="size-3.5 shrink-0 text-secondary/60" />
				Zip code
			</span>
			<button
				type="button"
				disabled
				class="mt-4 h-12 w-full rounded-full bg-primary font-mono text-[13px] font-medium text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				JOIN THE CONVERSATION
			</button>
		</div>

		<div class="mt-8 flex flex-col items-center gap-2">
			<span class="font-[family-name:var(--font-display)] text-[13px] font-medium opacity-80">
				Hosted by
			</span>
			<span class="font-sans text-[11px] font-medium underline">{hostName}</span>
		</div>
	</div>

	<!-- Sticky pill nav, abbreviated to the two sections that always exist. -->
	<div class="sticky bottom-0 shrink-0 border-t border-border bg-muted px-5 py-3">
		<div class="flex justify-center gap-2">
			{#each ['CONTEXT', 'HOW IT WORKS'] as item (item)}
				<span
					class="rounded-full bg-secondary/10 px-2.5 py-1 font-mono text-[10px] font-medium text-secondary"
				>
					{item}
				</span>
			{/each}
		</div>
	</div>
</div>
