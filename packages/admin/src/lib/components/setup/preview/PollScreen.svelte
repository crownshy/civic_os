<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import PreviewInfoBar from './PreviewInfoBar.svelte';

	interface Props {
		placeName: string;
		keyQuestion: string;
	}

	let { placeName, keyQuestion }: Props = $props();

	const STATEMENT =
		'We should keep the library open later on weekends, even if it means fewer hours on Monday.';
</script>

<!-- Mock of the voting screen. It sits on `--background`, the same surface as
     the page around it. -->
<div class="flex h-full flex-col bg-background">
	<PreviewInfoBar {placeName} end />

	<div class="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6">
		<!-- Progress: filled portion is --secondary over its own 30%. -->
		<div class="absolute top-0 left-0 h-[3px] w-full bg-secondary/30">
			<div class="h-full w-2/5 bg-secondary"></div>
		</div>
		<div class="absolute top-[3px] left-0 flex w-full items-start justify-between px-3 py-2">
			<span class="pr-3 font-mono text-[10px] font-medium text-muted-foreground/70 uppercase">
				{keyQuestion}
			</span>
			<span class="shrink-0 font-mono text-[10px] font-medium text-muted-foreground/70">
				12 LEFT
			</span>
		</div>

		<p
			class="mt-4 font-[family-name:var(--font-display)] text-[20px] leading-tight font-medium tracking-[var(--tracking-display)] text-muted-foreground"
		>
			&ldquo;{STATEMENT}&rdquo;
		</p>
	</div>

	<div class="shrink-0">
		<div class="flex items-center gap-2 px-4 py-4">
			<span
				class="flex-1 rounded-[30px] bg-primary px-3 py-3 text-center font-mono text-[11px] font-medium text-primary-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				AGREE
			</span>
			<span
				class="flex-1 rounded-[30px] bg-destructive px-3 py-3 text-center font-mono text-[11px] font-medium text-destructive-foreground shadow-[0px_4px_8.2px_0px_rgba(0,0,0,0.25)]"
			>
				DISAGREE
			</span>
			<span
				class="flex-1 rounded-[30px] bg-secondary/15 px-3 py-3 text-center font-mono text-[11px] font-medium text-secondary"
			>
				UNSURE
			</span>
		</div>

		<div class="px-4 pb-2 text-center font-sans text-[10px] font-medium text-muted-foreground">
			Something wrong? <span class="text-destructive underline">Report this statement.</span>
		</div>

		<!-- The compose strip is `--secondary` and its pill is `--card`, so both
		     move with the Brand. The smiley is an SVG asset and does not. -->
		<div class="w-full rounded-t-[40px] bg-secondary p-4">
			<div class="flex items-center gap-3">
				<div class="size-10 shrink-0 rounded-full bg-[#F4B82D]"></div>
				<div class="flex flex-1 items-center justify-between rounded-full bg-card px-4 py-3">
					<span class="truncate font-sans text-[13px] font-bold text-card-foreground">
						Share your perspective...
					</span>
					<ArrowRight class="size-5 shrink-0 text-card-foreground" />
				</div>
			</div>
		</div>
	</div>
</div>
