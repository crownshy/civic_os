<script lang="ts">
	import { Button } from "@civicos/shared/ui/button";
	import { Slider } from "@civicos/shared/ui/slider";
	import SkipBack from "@lucide/svelte/icons/skip-back";
	import SkipForward from "@lucide/svelte/icons/skip-forward";
	import Play from "@lucide/svelte/icons/play";
	import Pause from "@lucide/svelte/icons/pause";
	import Volume2 from "@lucide/svelte/icons/volume-2";

	interface Props {
		audioSrc?: string;
		currentTime?: number;
		onTimeUpdate?: (time: number) => void;
		onSeek?: (time: number) => void;
	}

	let {
		audioSrc = "",
		currentTime = $bindable(0),
		onTimeUpdate = () => {},
		onSeek = () => {},
	}: Props = $props();

	let audio = $state<HTMLAudioElement | undefined>();
	let duration = $state(0);
	let isPlaying = $state(false);
	let volume = $state(1);
	let isSeeking = $state(false);
	let seekBarValue = $state<number[]>([0]);

	$effect(() => {
		if (!isSeeking) {
			seekBarValue = [currentTime];
		}
	});

	function togglePlay() {
		if (audio) {
			if (isPlaying) {
				audio.pause();
			} else {
				audio.play();
			}
			isPlaying = !isPlaying;
		}
	}

	function handleTimeUpdate() {
		if (audio) {
			currentTime = audio.currentTime;
			onTimeUpdate(currentTime);
		}
	}

	function handleLoadedMetadata() {
		if (audio) {
			duration = audio.duration;
		}
	}

	function handleSeekChange(val: number[]) {
		isSeeking = true;
		seekBarValue = val;
	}

	function handleSeekCommit(val: number[]) {
		isSeeking = false;
		const newTime = val[0];
		if (audio) {
			audio.currentTime = newTime;
			currentTime = newTime;
			onSeek(newTime);
		}
	}

	function handleVolumeChange(val: number[]) {
		volume = val[0];
		if (audio) {
			audio.volume = volume;
		}
	}

	function formatTime(seconds: number) {
		if (!seconds || isNaN(seconds)) return "0:00";
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	}

	function skip(seconds: number) {
		if (audio) {
			audio.currentTime = Math.max(
				0,
				Math.min(duration, audio.currentTime + seconds),
			);
		}
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
</script>

<div class="bg-card mb-5 rounded-lg p-4">
	<audio
		bind:this={audio}
		src={audioSrc}
		ontimeupdate={handleTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onended={() => (isPlaying = false)}
	></audio>

	<div class="flex items-center gap-3">
		<Button
			variant="ghost"
			size="icon-sm"
			title="Back 10s"
			onclick={() => skip(-10)}
		>
			<SkipBack />
		</Button>

		<Button size="icon-lg" onclick={togglePlay}>
			{#if isPlaying}
				<Pause />
			{:else}
				<Play />
			{/if}
		</Button>

		<Button
			variant="ghost"
			size="icon-sm"
			title="Forward 10s"
			onclick={() => skip(10)}
		>
			<SkipForward />
		</Button>

		<span class="text-muted-foreground text-sm tabular-nums whitespace-nowrap">
			{formatTime(currentTime)} / {formatTime(duration)}
		</span>

		<div class="flex-1">
			<Slider
				type="multiple"
				min={0}
				max={duration || 0}
				value={seekBarValue}
				onValueChange={handleSeekChange}
				onValueCommit={handleSeekCommit}
			/>
		</div>
	</div>
</div>
