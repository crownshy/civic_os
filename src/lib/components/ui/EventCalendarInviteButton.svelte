<script lang="ts">
	import { getEventFullDescription, type RegionConfig } from '$lib/config/regions';
	import type { LocalizedEventDto } from '@crownshy/api-client/api';
	import { onMount } from 'svelte';

	type Props = {
		event: LocalizedEventDto;
		region: RegionConfig;
		popupDirection?: 'up' | 'down';
	};

	let { event, region, popupDirection = 'down' }: Props = $props();

	let ref = $state<HTMLSpanElement | null>(null);

	onMount(() => {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				import('add-to-calendar-button');
				observer.disconnect();
			}
		});

		if (ref) observer.observe(ref);

		return () => observer.disconnect();
	});

	const startDate = $derived(event ? event.startTime.split('T')[0] : '');

	const startTime = $derived.by(() => {
		if (!event) return '';
		return event.startTime.split('T')[1].slice(0, 5);
	});

	function parseTime12To24(t: string): string {
		const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
		if (!m) return '';
		let h = parseInt(m[1]);
		const min = m[2];
		if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
		else if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
		return `${String(h).padStart(2, '0')}:${min}`;
	}

	const endTime = $derived(event?.endTime ? parseTime12To24(event.endTime) : '');
	const location = $derived.by(() => {
		if (event.format === 'online') return 'Videoconference link to be sent 1 day before call.';
		return [event.venueName, event.address].filter(Boolean).join(' — ');
	});
	const timeZone = $derived.by(() => {
		const tzMatch = event.startTime.match(/([+-]\d{2}:\d{2})$/);
		if (!tzMatch) return 'currentBrowser';
		const offsets: Record<string, string> = {
			'-04:00': 'America/New_York',
			'-05:00': 'America/Chicago',
			'-06:00': 'America/Denver',
			'-07:00': 'America/Los_Angeles'
		};
		return offsets[tzMatch[1]] ?? 'currentBrowser';
	});

	const description = $derived(
		event
			? `${event.description ?? getEventFullDescription(event, region.stateName)}\n\nHosted by ${region.hostName}. Visit ${region.hostUrl} for more details.`
			: ''
	);
</script>

<span class="w-full" bind:this={ref}>
	<add-to-calendar-button
		name={event.title}
		{startDate}
		{startTime}
		endTime={endTime || undefined}
		{location}
		{description}
		{timeZone}
		options="'Google','Apple','iCal','Outlook.com'"
		label="ADD TO CALENDAR"
		buttonStyle="round"
		lightMode="bodyScheme"
		listStyle={popupDirection === 'up' ? 'dropup-static' : 'dropdown'}
		styleLight="--btn-background: rgba(166,114,46,0.10); --btn-text: #532A0E; --btn-border: transparent; --btn-shadow: none; --btn-hover-background: rgba(166,114,46,0.20); --font: 'DM Mono', monospace; width: 100%;"
	></add-to-calendar-button>
</span>

<style>
	:global(add-to-calendar-button) {
		width: 100%;
		display: flex;
		justify-content: center;
	}
	:global(add-to-calendar-button::part(atcb-button-wrapper)) {
		width: 100%;
		height: 56px;
	}
	:global(add-to-calendar-button::part(atcb-button)) {
		width: 100%;
		max-width: 100%;
	}
</style>
