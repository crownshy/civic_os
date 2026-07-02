<script lang="ts">
	import Badge from "@civicos/shared/ui/Badge.svelte";
	import { cn } from "@civicos/shared/utils";

	export interface TranscriptEvent {
		start_time: number;
		end_time?: number;
		speaker_id: string;
		text: string;
	}

	interface Props {
		events?: TranscriptEvent[];
		currentTime?: number;
		onSeek?: (time: number) => void;
	}

	let { events = [], currentTime = 0, onSeek = () => {} }: Props = $props();

	let currentEventIndex = $derived(
		events.findIndex((event, index) => {
			const nextEvent = events[index + 1];
			return (
				currentTime >= event.start_time &&
				(!nextEvent || currentTime < nextEvent.start_time)
			);
		}),
	);

	const speakerColors: Record<string, string> = {
		spk_0: "bg-red-500/20 text-red-700 border border-red-500/30",
		spk_1: "bg-teal-500/20 text-teal-700 border border-teal-500/30",
		spk_2: "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30",
		spk_3: "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30",
		spk_4: "bg-indigo-500/20 text-indigo-700 border border-indigo-500/30",
		spk_5: "bg-pink-500/20 text-pink-700 border border-pink-500/30",
	};

	function getSpeakerClass(speakerId: string) {
		return speakerColors[speakerId] ?? "bg-muted text-muted-foreground";
	}

	function formatTime(seconds: number) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function scrollToActive(node: HTMLElement, isActive: boolean) {
		if (isActive) {
			node.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
		return {
			update(isActive: boolean) {
				if (isActive) {
					node.scrollIntoView({ behavior: "smooth", block: "nearest" });
				}
			},
		};
	}
</script>

<div class="bg-card flex h-full flex-col rounded-lg max-lg:h-[600px]">
	<div class="border-border border-b px-5 py-4">
		<h2 class="text-foreground text-lg font-semibold">Transcript</h2>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto">
		<div class="flex flex-col gap-2 p-4">
			{#each events as event, index (event.start_time)}
				{@const isActive = index === currentEventIndex}
				<button
					type="button"
					class={cn(
						"w-full cursor-pointer rounded-md border px-3 py-2.5 text-left transition-colors",
						"hover:bg-muted/50",
						isActive
							? "bg-primary/10 border-primary/40"
							: "bg-secondary/50 border-transparent",
					)}
					onclick={() => onSeek(event.start_time)}
					use:scrollToActive={isActive}
				>
					<div class="mb-1.5 flex items-center justify-between">
						<Badge size="sm" class={cn(getSpeakerClass(event.speaker_id))}>
							{event.speaker_id}
						</Badge>
						<span class="text-muted-foreground text-xs tabular-nums">
							{formatTime(event.start_time)}
						</span>
					</div>
					<p class="text-foreground/80 text-sm leading-relaxed">{event.text}</p>
				</button>
			{/each}
		</div>
	</div>
</div>
