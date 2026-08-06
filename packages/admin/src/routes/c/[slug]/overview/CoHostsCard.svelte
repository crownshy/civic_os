<script lang="ts">
	import SetupCard from './SetupCard.svelte';

	export interface CoHost {
		name: string;
		/** Full URL; displayed with the protocol stripped. */
		website?: string;
		email?: string;
		/** Marks the lead host (green "Admin" badge). */
		isAdmin?: boolean;
	}

	interface Props {
		cohosts: CoHost[];
	}

	let { cohosts }: Props = $props();

	const stripProtocol = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
</script>

<SetupCard
	title="Co-Hosts"
	subtitle="The organizations who are stewarding this conversation in your community."
>
	<div class="font-ui">
		<!-- Column header -->
		<div
			class="text-muted-foreground text-caption grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-2 pb-2 font-semibold uppercase"
		>
			<div>Name</div>
			<div>Website</div>
			<div>Contact Email</div>
		</div>

		<div class="divide-border divide-y">
			{#each cohosts as host, i (host.name + (host.website ?? '') + i)}
				<div
					class="text-body grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 px-2 py-4"
				>
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
				</div>
			{/each}
		</div>
	</div>
</SetupCard>
