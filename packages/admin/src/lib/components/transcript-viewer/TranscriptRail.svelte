<script lang="ts" module>
	export interface TranscriptEvent {
		start_time: number;
		end_time?: number;
		speaker_id: string;
		text: string;
	}
</script>

<script lang="ts">
	import Play from "@lucide/svelte/icons/play";
	import Pause from "@lucide/svelte/icons/pause";

	interface Props {
		events?: TranscriptEvent[];
		audioSrc?: string;
	}

	let { events = [], audioSrc = "" }: Props = $props();

	let audio = $state<HTMLAudioElement | undefined>();
	let track = $state<HTMLElement | undefined>();
	let currentTime = $state(0);
	let duration = $state(0);
	let isPlaying = $state(false);

	// Assign each distinct speaker a stable index (0,1,2…) in order of appearance,
	// so labels read "SPEAKER 1/2/3…" and colors alternate red/green.
	const speakerOrder = $derived.by(() => {
		const seen = new Map<string, number>();
		for (const e of events) {
			if (!seen.has(e.speaker_id)) seen.set(e.speaker_id, seen.size);
		}
		return seen;
	});

	function speakerNum(id: string) {
		return (speakerOrder.get(id) ?? 0) + 1;
	}
	function speakerColor(id: string) {
		return (speakerOrder.get(id) ?? 0) % 2 === 0
			? "text-red-500"
			: "text-green-600";
	}

	const currentIndex = $derived(
		events.findIndex((event, index) => {
			const next = events[index + 1];
			return (
				currentTime >= event.start_time &&
				(!next || currentTime < next.start_time)
			);
		}),
	);

	const progress = $derived(duration > 0 ? currentTime / duration : 0);

	function togglePlay() {
		if (!audio) return;
		if (isPlaying) audio.pause();
		else audio.play();
		isPlaying = !isPlaying;
	}

	function fmt(seconds: number) {
		if (!seconds || isNaN(seconds)) return "00:00:00";
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
	}

	function seekFromPointer(e: PointerEvent) {
		if (!track || !duration) return;
		const rect = track.getBoundingClientRect();
		const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
		seekTo(frac * duration);
	}

	export function seekTo(time: number) {
		if (audio) {
			audio.currentTime = time;
			currentTime = time;
		}
	}

	export function play() {
		if (audio && !isPlaying) {
			audio.play();
			isPlaying = true;
		}
	}

	function scrollToActive(node: HTMLElement, isActive: boolean) {
		if (isActive) node.scrollIntoView({ behavior: "smooth", block: "nearest" });
		return {
			update(active: boolean) {
				if (active)
					node.scrollIntoView({ behavior: "smooth", block: "nearest" });
			},
		};
	}
</script>

<div class="flex w-80 shrink-0 flex-col border-l border-zinc-400">
	<audio
		bind:this={audio}
		src={audioSrc}
		ontimeupdate={() => audio && (currentTime = audio.currentTime)}
		onloadedmetadata={() => audio && (duration = audio.duration)}
		onended={() => (isPlaying = false)}
	></audio>

	<!-- Compact scrubber header -->
	<div class="shrink-0 border-b border-zinc-200 px-4 pt-3 pb-2">
		<div class="flex items-center gap-3">
			<button
				type="button"
				onclick={togglePlay}
				aria-label={isPlaying ? "Pause" : "Play"}
				class="flex size-6 shrink-0 items-center justify-center text-red-500"
			>
				{#if isPlaying}
					<Pause class="size-4 fill-red-500" />
				{:else}
					<Play class="size-4 fill-red-500" />
				{/if}
			</button>
			<span class="text-sm font-medium tabular-nums text-amber-800">
				{fmt(currentTime)}
			</span>
		</div>
		<button
			type="button"
			bind:this={track}
			onpointerdown={seekFromPointer}
			aria-label="Seek"
			class="relative mt-2 flex h-3 w-full cursor-pointer items-center"
		>
			<div class="h-0.5 w-full rounded-full bg-stone-300"></div>
			<div
				class="absolute left-0 h-0.5 rounded-full bg-red-500"
				style={`width:${progress * 100}%`}
			></div>
			<div
				class="absolute size-[7px] -translate-x-1/2 rounded-full bg-red-500"
				style={`left:${progress * 100}%`}
			></div>
		</button>
	</div>

	<!-- Speaker turns -->
	<div class="min-h-0 flex-1 overflow-y-auto">
		{#each events as event, index (index)}
			{@const isActive = index === currentIndex}
			<button
				type="button"
				onclick={() => seekTo(event.start_time)}
				use:scrollToActive={isActive}
				class={`flex w-full flex-col items-start gap-[5px] px-5 py-6 text-left transition-colors ${isActive ? "bg-stone-50" : ""}`}
			>
				<span
					class={`text-sm font-medium uppercase leading-4 ${speakerColor(event.speaker_id)}`}
				>
					Speaker {speakerNum(event.speaker_id)}
				</span>
				<span
					class={`text-sm font-medium leading-5 text-stone-900 ${isActive ? "" : "opacity-70"}`}
				>
					{event.text}
				</span>
			</button>
		{/each}
	</div>
</div>
