<script lang="ts">
	import { enhance } from '$app/forms';
	import { Trash2 } from '@lucide/svelte';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';

	export interface CoHost {
		/** Organization id (used to revoke the co-host grant). */
		id?: string;
		name: string;
		/** Full URL; displayed with the protocol stripped. */
		website?: string;
		email?: string;
		/** Marks the lead host (green "Admin" badge). */
		isAdmin?: boolean;
	}

	interface Props {
		cohosts: CoHost[];
		/** When provided, renders an "Add New…" action that opens the picker. */
		onAddNew?: () => void;
		/** Conversation id; when set, co-host rows (not the owning host) get a Remove action. */
		convId?: string;
	}

	let { cohosts, onAddNew, convId }: Props = $props();

	const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

	// 3 content columns + a trailing action column (kept in the header too so rows
	// stay aligned whether or not a Remove button is present).
	const grid =
		'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-4';
</script>

<SetupCard
	title="Co-Hosts"
	subtitle="The organizations who are stewarding this conversation in your community."
>
	<div class="font-ui">
		<!-- Column header -->
		<div class="text-muted-foreground text-caption {grid} px-2 pb-2 font-semibold uppercase">
			<div>Name</div>
			<div>Website</div>
			<div>Contact Email</div>
			<div></div>
		</div>

		<div class="divide-border divide-y">
			{#each cohosts as host, i (host.id ?? host.name + (host.website ?? '') + i)}
				<div class="text-body {grid} px-2 py-4">
					<div class="flex min-w-0 items-center gap-2">
						<span class="truncate font-bold">{host.name}</span>
						{#if host.isAdmin}
							<span class="bg-success text-caption shrink-0 rounded-[3px] px-1.5 py-0.5 text-white">
								Admin
							</span>
						{/if}
					</div>

					<div class="min-w-0 truncate">
						{#if host.website}
							<a
								href={host.website}
								target="_blank"
								rel="noopener"
								class="underline-offset-2 hover:underline"
							>
								{stripProtocol(host.website)}
							</a>
						{:else}
							<span class="text-muted-foreground">Not listed</span>
						{/if}
					</div>

					<div class="min-w-0 truncate">
						{#if host.email}
							<a href={`mailto:${host.email}`} class="underline-offset-2 hover:underline">
								{host.email}
							</a>
						{:else}
							<span class="text-muted-foreground">Not listed</span>
						{/if}
					</div>

					<div class="flex justify-end">
						{#if convId && host.id && !host.isAdmin}
							<form method="POST" action="?/removeCohost" use:enhance>
								<input type="hidden" name="convId" value={convId} />
								<input type="hidden" name="orgId" value={host.id} />
								<button
									type="submit"
									title="Remove co-host"
									aria-label={`Remove ${host.name}`}
									class="text-muted-foreground hover:text-destructive rounded-md p-1"
								>
									<Trash2 class="size-4" />
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if onAddNew}
			<div class="border-border border-t">
				<button
					type="button"
					onclick={onAddNew}
					class="text-primary px-2 py-4 text-body font-bold hover:underline"
				>
					Add New…
				</button>
			</div>
		{/if}
	</div>
</SetupCard>
