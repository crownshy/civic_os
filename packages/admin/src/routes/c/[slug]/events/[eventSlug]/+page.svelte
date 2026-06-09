<script lang="ts">
	import { page } from '$app/state';
	import { REGIONS } from '@civicos/shared/data/regions';
	import type { ConversationEvent } from '@civicos/shared/types';

	const region = $derived(REGIONS[page.params.slug ?? '']);
	const event = $derived(region?.events.find((e: ConversationEvent) => e.slug === page.params.eventSlug));

	function fmtFullDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const rsvpLink = $derived(
		event ? `civicos.app/c/${page.params.slug}/e/${event.slug}` : ''
	);
	const rsvpFor = (slug: string) => {
		const seed = slug.length * 7 + slug.charCodeAt(0);
		return ((seed * 5) % 80) + 30;
	};
	const capacityGuess = $derived(event ? rsvpFor(event.slug) : 0);
</script>

{#if event}
	<div class="max-w-3xl space-y-4">
		<!-- Mode toggle -->
		<div>
			<label class="text-muted-foreground text-xs tracking-tight">MODE</label>
			<div class="border-foreground/30 mt-1 inline-flex items-center rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl border p-1">
				<span
					class={`rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-1.5 text-xs ${
						event.format === 'in-person' ? 'bg-accent text-foreground' : 'text-muted-foreground'
					}`}
				>
					◉ in-person
				</span>
				<span
					class={`rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-4 py-1.5 text-xs ${
						event.format === 'online' ? 'bg-accent text-foreground' : 'text-muted-foreground'
					}`}
				>
					◴ online
				</span>
			</div>
		</div>

		<div class="flex gap-3.5">
			<div class="flex-1 space-y-1">
				<label class="text-muted-foreground text-xs tracking-tight">DATE</label>
				<div class="bg-muted/30 border-foreground/20 rounded-lg border px-3 py-2.5 text-sm">
					{fmtFullDate(event.date)}
				</div>
			</div>
			<div class="flex-1 space-y-1">
				<label class="text-muted-foreground text-xs tracking-tight">TIME — START / END</label>
				<div class="bg-muted/30 border-foreground/20 rounded-lg border px-3 py-2.5 text-sm">
					{event.time}{event.endTime ? ` → ${event.endTime}` : ''}
				</div>
			</div>
		</div>

		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">LOCATION NAME</label>
			<div class="bg-muted/30 border-foreground/20 rounded-lg border px-3 py-2.5 text-sm">
				{event.venueName ?? event.location}
			</div>
		</div>

		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">LOCATION ADDRESS</label>
			<div class="bg-muted/30 border-foreground/20 rounded-lg border px-3 py-2.5 text-sm">
				{event.address ?? event.location}
			</div>
		</div>

		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">DESCRIPTION</label>
			<div
				class="bg-muted/30 border-foreground/20 min-h-28 rounded-lg border px-3 py-2.5 text-sm leading-relaxed"
			>
				{event.fullDescription ?? event.description}
			</div>
		</div>

		<div class="flex gap-3.5">
			<div class="flex-1 space-y-1">
				<label class="text-muted-foreground text-xs tracking-tight">CAPACITY</label>
				<div
					class="bg-card shadow-card rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-3 text-sm"
				>
					{capacityGuess}
				</div>
			</div>
			<div class="flex-1 space-y-1">
				<label class="text-muted-foreground text-xs tracking-tight">CONTACT / HOST</label>
				<div
					class="bg-card shadow-card rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-3 text-sm"
				>
					{region.hostName}
				</div>
			</div>
		</div>

		<div class="space-y-1">
			<label class="text-muted-foreground text-xs tracking-tight">RSVP LINK</label>
			<div class="flex items-center gap-2">
				<div
					class="bg-card shadow-card flex-1 rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl px-3 py-3 text-xs"
				>
					{rsvpLink}
				</div>
				<button
					type="button"
					onclick={() => navigator.clipboard?.writeText(rsvpLink)}
					class="bg-card border-border rounded-tl-xl rounded-tr-xl rounded-bl-2xl rounded-br-xl border px-3 py-1.5 text-xs"
				>
					copy
				</button>
			</div>
			<p class="text-muted-foreground text-[10px]">
				Autofilled. Replace with a Zoom or other link if you're hosting online.
			</p>
		</div>

		<div class="border-border my-4 border-t"></div>

		<div
			class="bg-destructive/5 border-destructive/30 flex items-center justify-between rounded-lg border px-4 py-3.5"
		>
			<div>
				<div class="text-destructive text-xs font-bold tracking-tight">DELETE EVENT</div>
				<div class="text-muted-foreground text-xs">
					Removes the event, RSVPs, and any uploaded recordings.
				</div>
			</div>
			<button
				type="button"
				class="bg-card text-destructive border-destructive rounded-full border px-3 py-1.5 text-xs"
			>
				delete event…
			</button>
		</div>
	</div>
{/if}
