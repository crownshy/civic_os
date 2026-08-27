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
			<p class="text-caption text-muted-foreground">appear once recordings are processed</p>
		</div>
		<div class="space-y-2">
			{#each reports as r (r.title)}
				<div
					class={`flex items-center gap-3 rounded-lg bg-card p-4 shadow-card ${
						r.state === 'pending' ? 'opacity-70' : ''
					}`}
				>
					<div
						class={`flex size-12 items-center justify-center rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl text-caption font-medium ${kindClass[r.kind] ?? 'bg-muted-foreground/20'}`}
					>
						{r.kind}
					</div>
					<div class="flex-1">
						<div class="text-body font-bold">{r.title}</div>
						<div class="text-caption text-muted-foreground">{r.ts}</div>
					</div>
					<button
						type="button"
						class="size-8 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl border border-foreground/20 text-caption"
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
			class="flex flex-col items-center gap-1.5 rounded-lg border border-foreground/20 bg-muted/30 px-3 py-5"
		>
			<Upload class="size-7 text-muted-foreground" />
			<div class="text-caption font-bold">drop .mp3 / .wav / .m4a</div>
			<div class="text-caption text-muted-foreground">
				or <span class="underline">browse files</span>
			</div>
		</div>
		<div class="space-y-1.5">
			{#each recordings as rec (rec.name)}
				<div class="flex items-center gap-2 rounded-lg bg-card p-3 text-caption shadow-card">
					<Music class="size-4 text-muted-foreground" />
					<div class="flex-1">
						<div class="font-bold">{rec.name}</div>
						<div class="text-muted-foreground">{rec.duration}</div>
					</div>
					<span
						class={`inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-2.5 py-1 ${
							rec.state === 'processed'
								? 'bg-success/10 text-success'
								: 'bg-destructive/10 text-destructive'
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
		<div class="space-y-1 rounded-lg bg-card p-3 shadow-card">
			<div class="text-caption font-bold">Phone recording</div>
			<div class="text-caption text-muted-foreground">Dial in & we'll transcribe.</div>
			<div class="mt-1.5 flex items-center gap-2 rounded-lg bg-muted-foreground/10 px-2.5 py-2">
				<span class="flex-1 text-body">+1 (415) 555-0142</span>
				<span class="rounded-full bg-foreground px-2.5 py-1 text-caption text-background"
					>pin 8417</span
				>
			</div>
		</div>
		<div class="rounded-lg bg-card p-3 text-caption shadow-card">
			<span class="font-bold">Online events:</span> the Jitsi link auto-records. No upload needed.
		</div>
	</div>
</div>
