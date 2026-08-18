<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import SetupCard from '$lib/components/setup/SetupCard.svelte';

	export interface DemographicCategory {
		name: string;
		options: string[];
		enabled: boolean;
	}

	interface Props {
		categories?: DemographicCategory[];
	}

	// Defaults mirror the categories collected on the Open Poll today. Persistence
	// (which config actually sticks, and where) is #363/#364 and pending the
	// storage decision, so these toggles are presentational only for now.
	const DEFAULT_CATEGORIES: DemographicCategory[] = [
		{
			name: 'Age',
			options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'Above 65'],
			enabled: false
		},
		{
			name: 'Race / Ethnicity',
			options: [
				'Black / African American',
				'Asian American / Pacific Islander',
				'Middle Eastern / North African',
				'White',
				'Hispanic'
			],
			enabled: true
		},
		{ name: 'Gender', options: ['Male', 'Female', 'Nonbinary', 'Other'], enabled: false },
		{
			name: 'Political Affiliation',
			options: ['Progressive', 'Liberal', 'Moderate', 'Conservative', 'Other'],
			enabled: true
		}
	];

	let { categories = DEFAULT_CATEGORIES }: Props = $props();

	// Local, non-persisting toggle state (presentational shell). Writable $derived
	// so toggles work but reset if `categories` changes, without an $effect mirror.
	let enabled = $derived<Record<string, boolean>>(
		Object.fromEntries(categories.map((c) => [c.name, c.enabled]))
	);
</script>

<SetupCard
	title="Demographics"
	subtitle="Participants will be shown these questions at the end of the Open Poll. You can turn on/off any questions, or add your own."
>
	<div class="font-ui">
		<div
			class="text-muted-foreground text-caption grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-4 px-2 pb-2 font-semibold uppercase"
		>
			<div>Name</div>
			<div>Options</div>
			<div class="text-right">Status</div>
		</div>

		<div class="divide-border divide-y">
			{#each categories as category (category.name)}
				{@const on = enabled[category.name]}
				<div
					class="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-4 px-2 py-5 {on
						? ''
						: 'opacity-50'}"
				>
					<div class="text-body font-bold">{category.name}</div>
					<div class="text-body font-medium">{category.options.join(', ')}</div>
					<div class="flex items-center justify-end gap-3">
						<button
							type="button"
							role="switch"
							aria-checked={on}
							aria-label={`Toggle ${category.name}`}
							onclick={() => (enabled = { ...enabled, [category.name]: !on })}
							class="relative h-5 w-9 shrink-0 rounded-full transition-colors {on
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
						>
							<span
								class="absolute top-1 size-3 rounded-full bg-white transition-all {on
									? 'left-5'
									: 'left-1'}"
							></span>
						</button>
						<span class="text-body w-7 font-bold">{on ? 'On' : 'Off'}</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Add-New shell. The category editor modal is #364. -->
		<button
			type="button"
			class="text-primary text-body border-border flex w-full items-center gap-1 border-t px-2 py-4 font-bold"
		>
			<Plus class="size-4" />
			Add New…
		</button>
	</div>
</SetupCard>
