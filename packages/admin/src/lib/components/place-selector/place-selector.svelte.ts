import { SvelteMap } from 'svelte/reactivity';
import {
	byLevelThenName,
	coveringAncestorId,
	rankSearchResults,
	unionBbox,
	type Bbox,
	type Place,
	type PlaceSource
} from './places';

export type SelectorMode = 'view' | 'edit';

const ROOT_KEY = '';

/**
 * The place selector's state, shared by the chips, the picker list, and the map so
 * they never disagree. Areas arrive through a `PlaceSource`; nothing here calls the API.
 */
export class PlaceSelectorState {
	mode = $state<SelectorMode>('view');
	selectedIds = $state<string[]>([]);
	/** The drill stack. `null` is the "All states" level and is always first. */
	path = $state<(string | null)[]>([null]);
	query = $state('');
	search = $state.raw<{ places: Place[]; total: number }>({ places: [], total: 0 });

	#source: PlaceSource;
	#places = new SvelteMap<string, Place>();
	#childIds = new SvelteMap<string, string[]>();
	#searchRun = 0;
	#onchange: ((selectedIds: string[]) => void) | undefined;

	/** `onchange` hears every toggle and removal, so the owner can save the selection. */
	constructor(
		source: PlaceSource,
		selectedIds: string[] = [],
		onchange?: (selectedIds: string[]) => void
	) {
		this.#source = source;
		this.selectedIds = [...selectedIds];
		this.#onchange = onchange;
	}

	/** Load the states and the places already selected, so chips have names. */
	async load(): Promise<void> {
		await Promise.all([this.#loadChildren(null), this.#loadByIds(this.selectedIds)]);
	}

	place(id: string): Place | undefined {
		return this.#places.get(id);
	}

	/** Selected places in the order they were picked. Ids still loading are skipped. */
	get selected(): Place[] {
		return this.selectedIds.flatMap((id) => this.#places.get(id) ?? []);
	}

	isSelected(id: string): boolean {
		return this.selectedIds.includes(id);
	}

	/** The selected ancestor that already includes this place, if any. */
	coveredBy(id: string): Place | null {
		const place = this.#places.get(id);
		if (!place) return null;
		const ancestorId = coveringAncestorId(place, this.selectedIds);
		return ancestorId ? (this.#places.get(ancestorId) ?? null) : null;
	}

	toggle(id: string): void {
		if (this.isSelected(id)) this.remove(id);
		else this.#select([...this.selectedIds, id]);
	}

	remove(id: string): void {
		this.#select(this.selectedIds.filter((selectedId) => selectedId !== id));
	}

	#select(selectedIds: string[]): void {
		this.selectedIds = selectedIds;
		this.#onchange?.(selectedIds);
	}

	get currentId(): string | null {
		return this.path[this.path.length - 1];
	}

	/** The rows for one drill level, or undefined while they load. */
	rowsFor(id: string | null): Place[] | undefined {
		const ids = this.#childIds.get(id ?? ROOT_KEY);
		return ids?.flatMap((childId) => this.#places.get(childId) ?? []);
	}

	get canGoBack(): boolean {
		return this.path.length > 1;
	}

	/** The drilled-into places, outermost first: Oregon, Jefferson County. */
	get breadcrumb(): Place[] {
		return this.path.flatMap((id) => (id ? (this.#places.get(id) ?? []) : []));
	}

	get backLabel(): string {
		const parent = this.breadcrumb.at(-2);
		return parent ? `Back to ${parent.name}` : 'Back to all states';
	}

	drill(id: string): Promise<void> {
		this.path = [...this.path, id];
		return this.#loadChildren(id);
	}

	back(): void {
		if (this.canGoBack) this.path = this.path.slice(0, -1);
	}

	/**
	 * Open the level a search result lives in: a state or county opens itself, a city
	 * opens its county. Clears the search, since the list is what the person wants now.
	 */
	async jumpTo(id: string): Promise<void> {
		const place = this.#places.get(id);
		if (!place) return;
		const lineage = [...place.ancestorIds].reverse();
		const opened = place.level === 'city' ? lineage : [...lineage, id];
		this.setQuery('');
		this.path = [null, ...opened];
		await Promise.all([
			this.#loadByIds(opened),
			...opened.map((openId) => this.#loadChildren(openId))
		]);
	}

	/** Run a search. A slower, older query never overwrites a newer one. */
	async setQuery(raw: string): Promise<void> {
		this.query = raw;
		const run = ++this.#searchRun;
		if (!raw.trim()) {
			this.search = { places: [], total: 0 };
			return;
		}
		const candidates = await this.#source.search(raw.trim());
		if (run !== this.#searchRun) return;
		this.#remember(candidates);
		this.search = rankSearchResults(candidates, raw);
	}

	get isSearching(): boolean {
		return this.query.trim() !== '';
	}

	openEdit(): void {
		this.setQuery('');
		this.mode = 'edit';
	}

	closeEdit(): void {
		this.setQuery('');
		this.mode = 'view';
	}

	/**
	 * What the map should fit. Editing: the search matches, else the level drilled
	 * into. Viewing: the selection. Falls back to every state, and is null only for a
	 * search with no matches, where the map should stay put.
	 */
	get frame(): Bbox | null {
		const allStates = () => unionBbox((this.rowsFor(null) ?? []).map((place) => place.bbox));
		if (this.mode === 'edit') {
			if (this.isSearching) return unionBbox(this.search.places.map((place) => place.bbox));
			const current = this.currentId ? this.#places.get(this.currentId) : undefined;
			return current?.bbox ?? allStates();
		}
		return unionBbox(this.selected.map((place) => place.bbox)) ?? allStates();
	}

	async #loadChildren(id: string | null): Promise<void> {
		const key = id ?? ROOT_KEY;
		if (this.#childIds.has(key)) return;
		const children = id ? await this.#source.children(id) : await this.#source.roots();
		this.#remember(children);
		this.#childIds.set(
			key,
			[...children].sort(byLevelThenName).map((place) => place.id)
		);
	}

	async #loadByIds(ids: string[]): Promise<void> {
		const missing = ids.filter((id) => !this.#places.has(id));
		if (missing.length === 0) return;
		this.#remember(await this.#source.byIds(missing));
	}

	#remember(places: Place[]): void {
		for (const place of places) this.#places.set(place.id, place);
	}
}
