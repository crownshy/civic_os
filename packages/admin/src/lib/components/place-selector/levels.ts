import { Building2Icon, Grid2x2Icon, MapIcon } from '@lucide/svelte';

/** Icon and colour classes per level, shared by picker rows and selection chips. */
export const LEVEL_STYLE = {
	state: {
		icon: MapIcon,
		square: 'bg-place-state-tint text-place-state',
		selectedRow: 'bg-place-state-tint/60',
		selectedCheck: 'border-place-state bg-place-state',
		removeButton: 'hover:bg-place-state focus-visible:bg-place-state'
	},
	county: {
		icon: Grid2x2Icon,
		square: 'bg-place-county-tint text-place-county',
		selectedRow: 'bg-place-county-tint/60',
		selectedCheck: 'border-place-county bg-place-county',
		removeButton: 'hover:bg-place-county focus-visible:bg-place-county'
	},
	city: {
		icon: Building2Icon,
		square: 'bg-place-city-tint text-place-city',
		selectedRow: 'bg-place-city-tint/60',
		selectedCheck: 'border-place-city bg-place-city',
		removeButton: 'hover:bg-place-city focus-visible:bg-place-city'
	}
} as const;
