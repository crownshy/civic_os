<script lang="ts">
	import { AlertCircle, CheckCircle2, MapPin, Plus } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const notice = $derived.by(() => {
		if (data.created) return `${data.created} was created.`;
		if (data.deleted) return `${data.deleted} was deleted.`;
		return null;
	});
</script>

<div class="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
	<div class="mb-8 flex items-start justify-between gap-4">
		<div>
			<h1 class="mb-1 text-h3 font-bold md:text-h2">Places</h1>
			<p class="text-body text-muted-foreground">
				Names participants browse by. A conversation shows on every Place whose areas overlap where
				it runs.
			</p>
		</div>
		<Button href={resolve('/places/new')}>
			<Plus class="size-4" />
			Create Place
		</Button>
	</div>

	{#if notice}
		<div
			class="mb-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-body text-success"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span>{notice}</span>
		</div>
	{/if}

	{#if data.loadError}
		<div
			role="alert"
			class="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
		>
			<AlertCircle class="size-4 shrink-0" />
			<span>Could not load Places: {data.loadError}</span>
		</div>
	{:else if data.places.length === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-body text-muted-foreground"
		>
			<MapPin class="size-6" />
			<p>No Places yet.</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<table class="w-full text-left">
				<thead>
					<tr
						class="border-b border-border text-label font-semibold tracking-wider text-muted-foreground"
					>
						<th class="px-4 py-3">NAME</th>
						<th class="px-4 py-3">SLUG</th>
						<th class="px-4 py-3">AREAS</th>
					</tr>
				</thead>
				<tbody>
					{#each data.places as place (place.id)}
						<!-- The name link stretches over the row, as on the Hosts list (#451). -->
						<tr class="relative border-b border-border last:border-b-0 hover:bg-muted/30">
							<td class="px-4 py-3 text-body font-semibold">
								<a
									href={resolve('/places/[id]', { id: place.id })}
									class="underline-offset-2 after:absolute after:inset-0 hover:text-primary hover:underline"
								>
									{place.name}
								</a>
							</td>
							<td class="px-4 py-3 font-mono text-body text-muted-foreground">{place.slug}</td>
							<td class="px-4 py-3 text-body">
								{#if place.areas.length}
									{place.areas.map((area) => area.name).join(', ')}
								{:else}
									<span class="text-muted-foreground">None yet</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
