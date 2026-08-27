<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Trash2 } from '@lucide/svelte';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';

	export interface CoHost {
		/** Organization id (used to revoke the co-host grant). */
		id?: string;
		name: string;
		/** Full URL; displayed with the protocol stripped. */
		website?: string;
		email?: string;
		/**
		 * Marks the Host that owns the Campaign (`Conversation.organizationId`),
		 * as opposed to an organization granted co-host access. Not a role: every
		 * member of a co-host org gets the same access regardless of their org role.
		 */
		isOwner?: boolean;
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

	// The overview load declares `cohosts:${convId}`; refresh that key rather than
	// taking enhance's default, which invalidates every load on the page.
	const removeCohost: SubmitFunction =
		() =>
		async ({ update }) => {
			await update({ invalidateAll: false });
			await invalidate(`cohosts:${convId}`);
		};

	// 3 content columns + a trailing action column (kept in the header too so rows
	// stay aligned whether or not a Remove button is present).
	const grid = 'grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_2rem] items-center gap-4';
</script>

<SetupCard
	title="Co-Hosts"
	subtitle="The organizations who are stewarding this conversation in your community."
>
	<div class="font-ui">
		<!-- Column header -->
		<div class="text-caption text-muted-foreground {grid} px-2 pb-2 font-semibold uppercase">
			<div>Name</div>
			<div>Website</div>
			<div>Contact Email</div>
			<div></div>
		</div>

		<div class="divide-y divide-border">
			{#each cohosts as host, i (host.id ?? host.name + (host.website ?? '') + i)}
				<div class="text-body {grid} px-2 py-4">
					<div class="flex min-w-0 items-center gap-2">
						<span class="truncate font-bold">{host.name}</span>
						{#if host.isOwner}
							<span class="shrink-0 rounded-[3px] bg-success px-1.5 py-0.5 text-caption text-white">
								Owner
							</span>
						{/if}
					</div>

					<div class="min-w-0 truncate">
						{#if host.website}
							<!-- Host-supplied external site, not an app route -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={host.website}
								target="_blank"
								rel="noopener"
								class="underline-offset-2 hover:underline"
							>
								{stripProtocol(host.website)}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
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
						{#if convId && host.id && !host.isOwner}
							<form method="POST" action="?/removeCohost" use:enhance={removeCohost}>
								<input type="hidden" name="convId" value={convId} />
								<input type="hidden" name="orgId" value={host.id} />
								<button
									type="submit"
									title="Remove co-host"
									aria-label={`Remove ${host.name}`}
									class="rounded-md p-1 text-muted-foreground hover:text-destructive"
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
			<div class="border-t border-border">
				<button
					type="button"
					onclick={onAddNew}
					class="px-2 py-4 text-body font-bold text-primary hover:underline"
				>
					Add New…
				</button>
			</div>
		{/if}
	</div>
</SetupCard>
