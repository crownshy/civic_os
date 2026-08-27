<script lang="ts">
	import { MoreHorizontal, Plus, Search } from '@lucide/svelte';

	// Mock attendees — Phase 3 swaps for /attendances endpoint
	const rows = [
		{
			name: 'Aiyana R.',
			email: 'aiyana@—',
			connection: 'parent',
			rsvpd: 'May 4',
			status: 'confirmed'
		},
		{ name: 'Bo P.', email: 'bp99@—', connection: 'teacher', rsvpd: 'May 5', status: 'confirmed' },
		{
			name: 'Carla M.',
			email: 'carla.m@—',
			connection: 'neighbor',
			rsvpd: 'May 5',
			status: 'confirmed'
		},
		{
			name: 'Devon J.',
			email: 'dj.j@—',
			connection: 'student',
			rsvpd: 'May 8',
			status: 'waitlist'
		},
		{ name: 'Eun H.', email: 'eun.h@—', connection: 'parent', rsvpd: 'May 9', status: 'confirmed' },
		{ name: 'Fatima K.', email: 'fk@—', connection: 'staff', rsvpd: 'May 10', status: 'confirmed' },
		{
			name: 'Gabe L.',
			email: 'g.l@—',
			connection: 'neighbor',
			rsvpd: 'May 12',
			status: 'no-show?'
		},
		{ name: 'Hana S.', email: 'hana@—', connection: 'parent', rsvpd: 'May 14', status: 'confirmed' }
	];

	const counts = {
		all: rows.length,
		confirmed: rows.filter((r) => r.status === 'confirmed').length,
		waitlist: rows.filter((r) => r.status === 'waitlist').length
	};

	let activeFilter = $state<'all' | 'confirmed' | 'waitlist'>('all');
	let search = $state('');

	const visible = $derived(
		rows
			.filter((r) =>
				activeFilter === 'all'
					? true
					: activeFilter === 'confirmed'
						? r.status === 'confirmed'
						: r.status === 'waitlist'
			)
			.filter((r) =>
				search.trim() === '' ? true : r.name.toLowerCase().includes(search.toLowerCase())
			)
	);

	const statusClass: Record<string, string> = {
		confirmed: 'bg-success/10',
		waitlist: 'bg-muted-foreground/20',
		'no-show?': 'bg-destructive/20'
	};
</script>

<div class="space-y-4">
	<div>
		<h3 class="text-body font-bold">Registration</h3>
		<p class="text-caption text-muted-foreground">
			People who are invited to the event and their registration status
		</p>
	</div>

	<div class="flex items-center justify-between">
		<div class="flex items-center gap-1.5">
			{#each ['all', 'confirmed', 'waitlist'] as const as f (f)}
				<button
					type="button"
					onclick={() => (activeFilter = f)}
					class={`rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-3 py-1.5 text-caption ${
						activeFilter === f
							? 'bg-primary/10 text-foreground'
							: 'bg-muted-foreground/10 text-foreground'
					}`}
				>
					{f} · {counts[f]}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-2">
			<div
				class="flex items-center gap-1.5 rounded-lg border border-foreground/20 bg-muted/30 px-3 py-1.5"
			>
				<Search class="size-3.5 text-muted-foreground" />
				<input
					type="search"
					bind:value={search}
					placeholder="search…"
					class="w-44 bg-transparent text-body outline-none"
				/>
			</div>
			<button
				type="button"
				class="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-caption text-primary-foreground"
			>
				<Plus class="size-3" /> add by email
			</button>
		</div>
	</div>

	<div class="overflow-hidden rounded-lg bg-card shadow-card">
		<div
			class="grid grid-cols-[24px_1fr_1fr_140px_100px_120px_24px] items-center gap-2 bg-muted-foreground/15 px-3.5 py-2.5 text-caption tracking-wide text-foreground"
		>
			<div></div>
			<div>NAME</div>
			<div>EMAIL</div>
			<div>CONNECTION</div>
			<div>RSVP'D</div>
			<div>STATUS</div>
			<div></div>
		</div>
		{#each visible as row (row.email)}
			<div
				class="grid grid-cols-[24px_1fr_1fr_140px_100px_120px_24px] items-center gap-2 border-b border-border px-3.5 py-2.5 text-caption last:border-b-0"
			>
				<input type="checkbox" class="size-4" />
				<div class="font-bold">{row.name}</div>
				<div class="text-muted-foreground">{row.email}</div>
				<div class="text-muted-foreground">{row.connection}</div>
				<div class="text-muted-foreground">{row.rsvpd}</div>
				<div>
					<span
						class={`inline-flex items-center gap-1 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl px-2.5 py-1 ${statusClass[row.status]}`}
					>
						{#if row.status === 'confirmed'}
							<span class="size-1.5 rounded-full bg-success"></span>
						{/if}
						{row.status}
					</span>
				</div>
				<button type="button" class="justify-self-end text-muted-foreground">
					<MoreHorizontal class="size-4" />
				</button>
			</div>
		{/each}
	</div>
</div>
