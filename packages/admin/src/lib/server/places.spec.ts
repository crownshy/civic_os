import { describe, expect, it, vi } from 'vitest';
import type { Api } from '@civicos/shared/api';
import { resolveAreaIds } from './places';

const oregon = { geoid: '41', level: 'state' as const, name: 'Oregon' };
const deschutes = { geoid: '41017', level: 'county' as const, name: 'Deschutes County' };
const utah = { geoid: '49', level: 'state' as const, name: 'Utah' };

/** The areas comhairle holds, as `ListRegionAreas` returns them for `statefp:XX`. */
const AREAS = [
	{ id: 'area-or', name: 'Oregon', tags: ['state', 'statefp:41'] },
	{ id: 'area-ut', name: 'Utah', tags: ['state', 'statefp:49'] }
];

function apiWith(areas: typeof AREAS) {
	const ListRegionAreas = vi.fn(async ({ queries }: { queries: { tag: string } }) => ({
		records: areas.filter((area) => area.tags.includes(queries.tag)),
		total: areas.length
	}));
	return { api: { ListRegionAreas } as unknown as Api, ListRegionAreas };
}

describe('resolveAreaIds', () => {
	it('finds the comhairle area behind each pick', async () => {
		const { api } = apiWith(AREAS);

		expect(await resolveAreaIds(api, [oregon, utah])).toEqual({
			areaIds: ['area-or', 'area-ut'],
			missing: []
		});
	});

	it('lists each state once', async () => {
		const { api, ListRegionAreas } = apiWith(AREAS);

		await resolveAreaIds(api, [oregon, deschutes]);

		expect(ListRegionAreas).toHaveBeenCalledTimes(1);
		expect(ListRegionAreas.mock.calls[0][0].queries.tag).toBe('statefp:41');
	});

	it('reports picks comhairle has no boundary for', async () => {
		const { api } = apiWith(AREAS);

		expect(await resolveAreaIds(api, [oregon, deschutes])).toEqual({
			areaIds: ['area-or'],
			missing: [deschutes]
		});
	});
});
