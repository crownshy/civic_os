import { describe, expect, it } from 'vitest';
import { createFixtureSource } from './fixture';
import { PlaceSelectorState } from './place-selector.svelte';
import type { Place, PlaceSource } from './places';

async function loaded(selectedIds: string[] = [], source = createFixtureSource()) {
	const state = new PlaceSelectorState(source, selectedIds);
	await state.load();
	return state;
}

const names = (places: Place[] | undefined) => places?.map((place) => place.name);

describe('PlaceSelectorState selection', () => {
	it('loads the states and names the places already selected', async () => {
		const state = await loaded(['county-41031']);
		expect(names(state.rowsFor(null))).toEqual(['California', 'Oregon', 'Utah']);
		expect(names(state.selected)).toEqual(['Jefferson County']);
	});

	it('toggles a place on and off, keeping pick order', async () => {
		const state = await loaded();
		state.toggle('state-49');
		state.toggle('state-41');
		expect(state.selectedIds).toEqual(['state-49', 'state-41']);
		state.toggle('state-49');
		expect(state.selectedIds).toEqual(['state-41']);
	});

	it('removes a place', async () => {
		const state = await loaded(['state-41', 'state-49']);
		state.remove('state-41');
		expect(state.selectedIds).toEqual(['state-49']);
	});

	it('never selects children with their parent', async () => {
		const state = await loaded();
		await state.drill('state-41');
		state.toggle('state-41');
		expect(state.selectedIds).toEqual(['state-41']);
	});
});

describe('PlaceSelectorState coveredBy', () => {
	it('reports the nearest selected ancestor', async () => {
		const state = await loaded(['state-41', 'county-41031']);
		await state.drill('state-41');
		await state.drill('county-41031');
		expect(state.coveredBy('city-4145250')?.name).toBe('Jefferson County');
		expect(state.coveredBy('county-41031')?.name).toBe('Oregon');
	});

	it('still lets a covered place be selected on its own', async () => {
		const state = await loaded(['county-41031']);
		await state.drill('state-41');
		await state.drill('county-41031');
		state.toggle('city-4145250');
		expect(state.isSelected('city-4145250')).toBe(true);
		expect(state.coveredBy('city-4145250')?.name).toBe('Jefferson County');
	});
});

describe('PlaceSelectorState drilldown', () => {
	it('drills into a state and a county, building the breadcrumb', async () => {
		const state = await loaded();
		await state.drill('state-41');
		expect(names(state.rowsFor('state-41'))).toEqual([
			'Crook County',
			'Deschutes County',
			'Jefferson County'
		]);
		await state.drill('county-41031');
		expect(names(state.breadcrumb)).toEqual(['Oregon', 'Jefferson County']);
		expect(state.backLabel).toBe('Back to Oregon');
	});

	it('goes back one level at a time and stops at all states', async () => {
		const state = await loaded();
		await state.drill('state-41');
		expect(state.backLabel).toBe('Back to all states');
		state.back();
		expect(state.currentId).toBeNull();
		expect(state.canGoBack).toBe(false);
		state.back();
		expect(state.path).toEqual([null]);
	});

	it('jumps from a county search result to that county and clears the search', async () => {
		const state = await loaded();
		await state.setQuery('jeff');
		await state.jumpTo('county-41031');
		expect(state.path).toEqual([null, 'state-41', 'county-41031']);
		expect(state.query).toBe('');
		expect(names(state.rowsFor('county-41031'))).toEqual(['Culver', 'Madras', 'Metolius']);
	});

	it('jumps from a city search result to its county', async () => {
		const state = await loaded();
		await state.setQuery('mad');
		await state.jumpTo('city-4145250');
		expect(state.path).toEqual([null, 'state-41', 'county-41031']);
		expect(names(state.breadcrumb)).toEqual(['Oregon', 'Jefferson County']);
	});
});

describe('PlaceSelectorState search', () => {
	it('ranks matches by level then name', async () => {
		const state = await loaded();
		await state.setQuery('Sa');
		expect(names(state.search.places)).toEqual([
			'Salt Lake County',
			'San Francisco County',
			'Salt Lake City',
			'San Francisco',
			'Sandy'
		]);
	});

	it('keeps the newest query when an older one resolves later', async () => {
		let releaseSlow: () => void = () => {};
		const fixture = createFixtureSource();
		const source: PlaceSource = {
			...fixture,
			search: (query) =>
				query === 'b'
					? new Promise((resolve) => {
							releaseSlow = () => fixture.search(query).then(resolve);
						})
					: fixture.search(query)
		};
		const state = await loaded([], source);
		const slow = state.setQuery('b');
		await state.setQuery('m');
		releaseSlow();
		await slow;
		expect(names(state.search.places)).toEqual(['Madras', 'Metolius']);
	});
});

describe('PlaceSelectorState frame', () => {
	it('frames the selection in view mode', async () => {
		const state = await loaded(['county-41031', 'city-4967000']);
		expect(state.frame).toEqual([-121.85, 40.7, -111.74, 44.89]);
	});

	it('frames every state with nothing selected', async () => {
		const state = await loaded();
		expect(state.frame).toEqual([-124.57, 32.53, -109.04, 46.29]);
	});

	it('frames the drilled level while editing', async () => {
		const state = await loaded(['state-49']);
		state.openEdit();
		await state.drill('state-41');
		expect(state.frame).toEqual([-124.57, 41.99, -116.46, 46.29]);
	});

	it('frames search matches while searching, and nothing for no matches', async () => {
		const state = await loaded();
		state.openEdit();
		await state.setQuery('bend');
		expect(state.frame).toEqual([-121.38, 43.99, -121.25, 44.11]);
		await state.setQuery('zzz');
		expect(state.frame).toBeNull();
	});
});
