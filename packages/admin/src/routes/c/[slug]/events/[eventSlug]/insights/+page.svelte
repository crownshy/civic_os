<script lang="ts">
	import { Upload, Music } from '@lucide/svelte';

	const reports = [
		{ kind: 'theme', title: 'Theme map · all sessions', ts: 'May 24, 9:14pm', state: 'done' },
		{ kind: 'sum.', title: 'Summary · group A', ts: 'May 24, 8:42pm', state: 'done' },
		{ kind: 'sum.', title: 'Summary · plenary', ts: 'May 24, 8:58pm', state: 'done' },
		{ kind: 'quotes', title: 'Quote bank · standout lines', ts: 'May 24, 9:02pm', state: 'done' },
		{ kind: 'sum.', title: 'Summary · group B', ts: 'processing…', state: 'pending' }
	];

	const recordings = [
		{ name: 'group-a.m4a', duration: '38:12', state: 'processed' },
		{ name: 'plenary.mp3', duration: '52:30', state: 'processed' },
		{ name: 'group-b.m4a', duration: '41:05', state: 'processing' }
	];

	const kindClass: Record<string, string> = {
		theme: 'bg-accent text-foreground',
		'sum.': 'bg-destructive/40 text-white',
		quotes: 'bg-secondary text-white'
	};
</script>

<div class="grid grid-cols-[1fr_320px] gap-4">
	<!-- Left: reports -->
	<div class="space-y-4">
		<div>
			<h3 class="text-body font-bold">Reports</h3>
			<p class="text-muted-foreground text-caption">appear once recordings are processed</p>
		</div>
		<div class="space-y-2">
			{#each reports as r}
				<div
					class={`bg-card shadow-card flex items-center gap-3 rounded-lg p-4 ${
						r.state === 'pending' ? 'opacity-70' : ''
					}`}
				>
					<div
						class={`flex size-12 items-center justify-center rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl text-caption font-medium ${kindClass[r.kind] ?? 'bg-muted-foreground/20'}`}
					>
						{r.kind}
					</div>
					<div class="flex-1">
						<div class="text-body font-bold">{r.title}</div>
						<div class="text-muted-foreground text-caption">{r.ts}</div>
					</div>
					<button
						type="button"
						class="border-foreground/20 size-8 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl border text-caption"
						aria-label="open report"
					>
						⛓
					</button>
				</div>
			{/each}
		</div>
	</div>

	<!-- Right: recordings -->
	<div class="space-y-3">
		<h3 class="text-body font-bold">Add recordings</h3>
		<div
			class="bg-muted/30 border-foreground/20 flex flex-col items-center gap-1.5 rounded-lg border px-3 py-5"
		>
			<Upload class="text-muted-foreground size-7" />
			<div class="text-caption font-bold">drop .mp3 / .wav / .m4a</div>
			<div class="text-muted-foreground text-caption">
				or <span class="underline">browse files</span>
			</div>
		</div>
		<div class="space-y-1.5">
			{#each recordings as rec}
				<div class="bg-card shadow-card flex items-center gap-2 rounded-lg p-3 text-caption">
					<Music class="text-muted-foreground size-4" />
					<div class="flex-1">
						<div class="font-bold">{rec.name}</div>
						<div class="text-muted-foreground">{rec.duration}</div>
					</div>
					<span
						class={`inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-2.5 py-1 ${
							rec.state === 'processed' ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
						}`}
					>
						<span
							class={`size-1.5 rounded-full ${rec.state === 'processed' ? 'bg-success' : 'bg-destructive'}`}
						></span>
						{rec.state}
					</span>
				</div>
			{/each}
		</div>
		<div class="bg-card shadow-card space-y-1 rounded-lg p-3">
			<div class="text-caption font-bold">Phone recording</div>
			<div class="text-muted-foreground text-caption">Dial in & we'll transcribe.</div>
			<div class="bg-muted-foreground/10 mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-2">
				<span class="flex-1 text-body">+1 (415) 555-0142</span>
				<span class="bg-foreground text-background rounded-full px-2.5 py-1 text-caption">pin 8417</span>
			</div>
		</div>
		<div class="bg-card shadow-card rounded-lg p-3 text-caption">
			<span class="font-bold">Online events:</span> the Jitsi link auto-records. No upload needed.
		</div>
	</div>
</div>
