<script lang="ts">
	import { Building2, Plus, CheckCircle2 } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';

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
			<p class="text-muted-foreground text-body">
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
			class="border-success/30 bg-success/5 text-success mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-body"
		>
			<CheckCircle2 class="size-4 shrink-0" />
			<span><span class="font-semibold">{data.created}</span> was created.</span>
		</div>
	{/if}

	{#if data.organizations.length === 0}
		<div
			class="border-border text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-body"
		>
			<Building2 class="size-6" />
			<p>No Hosts yet.</p>
		</div>
	{:else}
		<div class="border-border overflow-hidden rounded-xl border">
			<table class="w-full text-left">
				<thead>
					<tr class="border-border text-muted-foreground border-b text-label font-semibold tracking-wider">
						<th class="px-4 py-3">NAME</th>
						<th class="px-4 py-3">WEBSITE</th>
						<th class="px-4 py-3">CONTACT EMAIL</th>
					</tr>
				</thead>
				<tbody>
					{#each data.organizations as org (org.id)}
						<tr class="border-border hover:bg-muted/30 border-b last:border-b-0">
							<td class="px-4 py-3 text-body font-semibold">
								<a href={`/sysadmin/hosts/${org.id}`} class="hover:text-primary hover:underline underline-offset-2">
									{org.name}
								</a>
							</td>
							<td class="px-4 py-3 text-body">
								{#if org.externalUrl}
									<a
										href={org.externalUrl}
										target="_blank"
										rel="noreferrer"
										class="hover:text-foreground text-muted-foreground underline-offset-2 hover:underline"
									>
										{displayUrl(org.externalUrl)}
									</a>
								{/if}
							</td>
							<td class="px-4 py-3 text-body">
								{#if org.contactEmail}
									<a
										href={`mailto:${org.contactEmail}`}
										class="hover:text-foreground text-muted-foreground underline-offset-2 hover:underline"
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
