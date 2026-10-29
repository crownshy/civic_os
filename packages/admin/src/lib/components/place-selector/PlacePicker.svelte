<script lang="ts">
	import { tick } from 'svelte';
	import { ArrowLeft, Search, X } from '@lucide/svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { cn } from '@civicos/shared/utils';
	import { SEARCH_LIMIT, type Place } from './places';
	import type { PlaceSelectorState } from './place-selector.svelte';
	import PlaceRow from './PlaceRow.svelte';

	type Props = {
		/** Shared with the chips and the map, so all three agree on the selection. */
		state: PlaceSelectorState;
		ondone: () => void;
		/** The row under the pointer or keyboard focus, so the map can highlight it. */
		onhover?: (id: string | null) => void;
		class?: string;
	};

	let { state: selector, ondone, onhover, class: className }: Props = $props();

	let searchInput = $state<HTMLInputElement | null>(null);
	let backButton = $state<HTMLButtonElement | null>(null);
	let track = $state<HTMLDivElement | null>(null);
	/** The pane just backed out of, kept until the slide ends so it does not blank mid-move. */
	let leavingId = $state<string | null>(null);
	let slideInstantly = $state(false);

	const depth = $derived(selector.path.length - 1);
	const panes = $derived(leavingId ? [...selector.path, leavingId] : selector.path);
	const trimmedQuery = $derived(selector.query.trim());
	const matchCount = $derived(selector.search.total);

	function prefersReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	async function drill(place: Place) {
		leavingId = null;
		void selector.drill(place.id);
		await tick();
		backButton?.focus({ preventScroll: true });
	}

	async function jumpTo(place: Place) {
		leavingId = null;
		slideInstantly = true;
		void selector.jumpTo(place.id);
		await tick();
		// Force a style pass with the transition off, so the jump lands without sliding.
		void track?.offsetWidth;
		slideInstantly = false;
		backButton?.focus({ preventScroll: true });
	}

	async function goBack(event: MouseEvent) {
		if (!selector.canGoBack) return;
		const cameFromId = selector.currentId;
		// A keyboard press on a button fires a click with no pointer detail.
		const viaKeyboard = event.detail === 0;
		if (!prefersReducedMotion()) leavingId = cameFromId;
		selector.back();
		await tick();
		const drillButton = track?.querySelector<HTMLButtonElement>(
			`[data-pane="${depth}"] [data-drill="${cameFromId}"]`
		);
		if (viaKeyboard && drillButton) drillButton.focus();
		else if (depth === 0) searchInput?.focus({ preventScroll: true });
	}

	function clearSearch() {
		void selector.setQuery('');
		searchInput?.focus();
	}

	function onSearchKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !selector.query) return;
		event.preventDefault();
		void selector.setQuery('');
	}

	function onTrackTransitionEnd(event: TransitionEvent) {
		if (event.target === event.currentTarget) leavingId = null;
	}
</script>

<div
	class={cn('flex h-full min-h-0 flex-col bg-card text-card-foreground', className)}
	role="group"
	aria-label="Choose places"
	onpointerleave={() => onhover?.(null)}
>
	<div class="flex items-center gap-2.5 px-3.5 pt-3.5 pb-3">
		<div class="relative min-w-0 flex-1">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-muted-foreground"
				aria-hidden="true"
			/>
			<Input
				bind:ref={searchInput}
				type="text"
				value={selector.query}
				oninput={(event) => selector.setQuery(event.currentTarget.value)}
				onkeydown={onSearchKeydown}
				placeholder="Search places"
				aria-label="Search places"
				autocomplete="off"
				spellcheck={false}
				class="h-11 rounded-xl pr-10 pl-10 text-body md:text-body"
			/>
			{#if selector.query}
				<Button
					variant="ghost"
					size="icon"
					class="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg text-muted-foreground"
					aria-label="Clear search"
					onclick={clearSearch}
				>
					<X aria-hidden="true" />
				</Button>
			{/if}
		</div>
		<!-- Ink, not bg-primary: white on the admin primary misses 4.5:1 at body size. -->
		<Button
			class="h-11 rounded-xl bg-foreground px-[18px] text-body text-background hover:bg-foreground/85 active:bg-foreground/75"
			onclick={ondone}
		>
			Done
		</Button>
	</div>

	<div
		class="flex h-[42px] flex-none items-center gap-0.5 border-y border-border pr-3.5 pl-1 text-caption text-muted-foreground"
	>
		<Button
			bind:ref={backButton}
			variant="ghost"
			size="icon-lg"
			class={cn(
				// transition-colors, not the primitive's transition-all: an animated visibility
				// stays hidden for a frame and swallows the focus() after a drill.
				'rounded-lg text-foreground transition-colors',
				(!selector.canGoBack || selector.isSearching) && 'invisible'
			)}
			aria-label={selector.backLabel}
			disabled={!selector.canGoBack || selector.isSearching}
			onclick={goBack}
		>
			<ArrowLeft class="size-[18px]" aria-hidden="true" />
		</Button>
		<p class="min-w-0 truncate" aria-live="polite">
			{#if selector.isSearching}
				{matchCount}
				{matchCount === 1 ? 'place starts' : 'places start'} with “<strong
					class="font-semibold text-foreground">{trimmedQuery}</strong
				>”
			{:else if selector.breadcrumb.length === 0}
				<strong class="font-semibold text-foreground">All states</strong>
			{:else}
				{#each selector.breadcrumb as place, index (place.id)}
					{#if index === selector.breadcrumb.length - 1}
						<strong class="font-semibold text-foreground">{place.name}</strong>
					{:else}
						<span>{place.name}</span>
						<span class="mx-1.5 text-input" aria-hidden="true">/</span>
					{/if}
				{/each}
			{/if}
		</p>
	</div>

	<!-- overflow-clip, not hidden: focusing a row in an off-screen pane must not scroll the track. -->
	<div class="relative min-h-0 flex-1 overflow-clip">
		<div
			bind:this={track}
			class={cn(
				'flex h-full transition-transform duration-[340ms] ease-[cubic-bezier(.3,.7,.2,1)] motion-reduce:transition-none',
				slideInstantly && 'transition-none'
			)}
			style:transform="translateX({-depth * 100}%)"
			inert={selector.isSearching}
			ontransitionend={onTrackTransitionEnd}
		>
			{#each panes as paneId, index (paneId ?? '')}
				{@const rows = selector.rowsFor(paneId)}
				<div
					class="h-full flex-[0_0_100%] overflow-y-auto overscroll-contain"
					data-pane={index}
					inert={index !== depth}
				>
					{#if rows}
						<ul>
							{#each rows as place (place.id)}
								<PlaceRow {place} {selector} variant="drill" ondrill={drill} {onhover} />
							{/each}
						</ul>
					{:else}
						<p class="p-4 text-body text-muted-foreground" role="status">Loading</p>
					{/if}
				</div>
			{/each}
		</div>

		{#if selector.isSearching}
			<div class="absolute inset-0 overflow-y-auto overscroll-contain bg-card">
				{#if selector.search.places.length > 0}
					<ul>
						{#each selector.search.places as place (place.id)}
							<PlaceRow {place} {selector} variant="search" ondrill={jumpTo} {onhover} />
						{/each}
					</ul>
					{#if matchCount > SEARCH_LIMIT}
						<p class="max-w-[40ch] p-4 text-body text-muted-foreground">
							Showing {SEARCH_LIMIT} of {matchCount}. Keep typing to narrow the list.
						</p>
					{/if}
				{:else}
					<p class="max-w-[40ch] p-4 text-body text-muted-foreground">
						No places start with “{trimmedQuery}”. Check the spelling, or clear the search to browse
						by state.
					</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
