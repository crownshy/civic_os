<script lang="ts">
	import { Building2, Plus, CheckCircle2 } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { resolve } from '$app/paths';

	let { data } = $props();

	/** Website without protocol, for display. */
	function displayUrl(url?: string | null): string {
		if (!url) return '';
		return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
	}
</script>

<div class="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
	<div class="mb-8 flex items-start justify-between gap-4">
		<div>
			<h1 class="mb-1 text-section font-bold">Hosts</h1>
			<p class="text-body text-muted-foreground">
				Host organizations on BLOOM. Create new Hosts and their initial admins.
			</p>
		</div>
		<Button href="/sysadmin/hosts/new">
			<Plus class="size-4" />
			Create Host
		</Button>
	</div>

	{#if data.created}
		<div
			class="mb-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-body text-success"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span><span class="font-semibold">{data.created}</span> was created.</span>
		</div>
	{/if}

	{#if data.organizations.length === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-body text-muted-foreground"
		>
			<Building2 class="size-6" />
			<p>No Hosts yet.</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border">
			<table class="w-full text-left">
				<thead>
					<tr
						class="border-b border-border text-label font-semibold tracking-wider text-muted-foreground"
					>
						<th class="px-4 py-3">NAME</th>
						<th class="px-4 py-3">WEBSITE</th>
						<th class="px-4 py-3">CONTACT EMAIL</th>
					</tr>
				</thead>
				<tbody>
					{#each data.organizations as org (org.id)}
						<tr class="border-b border-border last:border-b-0 hover:bg-muted/30">
							<td class="px-4 py-3 text-body font-semibold">
								<a
									href={resolve('/sysadmin/hosts/[id]', { id: org.id })}
									class="underline-offset-2 hover:text-primary hover:underline"
								>
									{org.name}
								</a>
							</td>
							<td class="px-4 py-3 text-body">
								{#if org.externalUrl}
									<a
										href={org.externalUrl}
										target="_blank"
										rel="noreferrer"
										class="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
									>
										{displayUrl(org.externalUrl)}
									</a>
								{/if}
							</td>
							<td class="px-4 py-3 text-body">
								{#if org.contactEmail}
									<a
										href={`mailto:${org.contactEmail}`}
										class="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
									>
										{org.contactEmail}
									</a>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
