<script lang="ts">
	import { page } from '$app/state';
	import { REGIONS } from '@civicos/shared/data/regions';

	const region = $derived(REGIONS[page.params.slug ?? '']);
</script>

{#if region}
	<div class="flex-1 space-y-5 overflow-y-auto px-5 py-5">
		<h2 class="text-base font-bold">Settings</h2>

		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">SLUG</label>
			<div class="bg-card shadow-card rounded-lg px-3 py-3 text-xs">{region.slug}</div>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">TITLE</label>
			<div class="bg-card shadow-card rounded-lg px-3 py-3 text-sm">{region.heroHeader}</div>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">KEY QUESTION</label>
			<div class="bg-card shadow-card rounded-lg px-3 py-3 text-sm">{region.question}</div>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">CONTEXT</label>
			<div class="bg-card shadow-card rounded-lg px-3 py-3 text-sm leading-relaxed">
				{@html region.contextParagraphs.join('<br/><br/>')}
			</div>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">HOST</label>
			<div class="bg-card shadow-card rounded-lg px-3 py-3 text-sm">
				<a href={region.hostUrl} class="text-destructive underline" target="_blank" rel="noopener">
					{region.hostName}
				</a>
			</div>
		</div>
		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight"
				>PARTNERS ({region.partners.length})</label
			>
			<div class="bg-card shadow-card flex flex-wrap gap-2 rounded-lg px-3 py-3 text-xs">
				{#each region.partners as p}
					<a
						href={p.url}
						target="_blank"
						rel="noopener"
						class="bg-muted-foreground/10 rounded-full px-2.5 py-1">{p.name}</a
					>
				{/each}
			</div>
		</div>

		<div class="border-border my-4 border-t"></div>

		<div
			class="bg-destructive/5 border-destructive/30 flex items-center justify-between rounded-lg border px-4 py-3.5"
		>
			<div>
				<div class="text-destructive text-xs font-bold tracking-tight">DANGER ZONE</div>
				<div class="text-muted-foreground text-xs">
					Permanently delete this conversation and all its data.
				</div>
			</div>
			<button
				type="button"
				class="bg-card text-destructive border-destructive rounded-full border px-3 py-1.5 text-xs"
			>
				delete conversation…
			</button>
		</div>
	</div>
{/if}
