<script lang="ts">
	import {
		brandStyle,
		PARTICIPANT_DEFAULTS,
		resolveBrand,
		type Brand
	} from '@civicos/shared/data/brand';
	import LandingScreen from './LandingScreen.svelte';
	import PollScreen from './PollScreen.svelte';
	import AboutYouScreen from './AboutYouScreen.svelte';
	import type { PreviewCategory } from './categories';

	interface Props {
		/** The Campaign layer, usually mid-edit, so this repaints as fields change. */
		brand: Brand;
		/** The Host layer underneath it. */
		inherited?: Brand;
		campaignTitle: string;
		keyQuestion: string;
		placeName: string;
		hostName: string;
		/** Demographic categories switched on for this Campaign. */
		categories: PreviewCategory[];
	}

	let { brand, inherited, campaignTitle, keyQuestion, placeName, hostName, categories }: Props =
		$props();

	const SCREENS = [
		{ id: 'landing', label: 'Landing' },
		{ id: 'poll', label: 'Poll' },
		{ id: 'about-you', label: 'About You' }
	] as const;

	let screen = $state<(typeof SCREENS)[number]['id']>('landing');

	// The same order civicos resolves, with layer 1 spelled out: admin ships its
	// own palette, so an unset token would otherwise show admin's white and
	// terracotta rather than the cream and green a participant actually gets.
	const resolved = $derived(resolveBrand(PARTICIPANT_DEFAULTS, inherited, brand));

	/**
	 * Painted on the frame rather than `:root`, which would repaint admin.
	 *
	 * The radius scale is rebuilt from `--radius` because civicos's `layout.css`
	 * derives it (`--radius-lg: var(--radius)`) and admin's `theme.css` hardcodes
	 * it. Without this the Corner radius field would look dead in the preview and
	 * work in the app.
	 */
	const style = $derived(
		[
			brandStyle(resolved),
			'--radius-sm: calc(var(--radius) - 4px)',
			'--radius-md: calc(var(--radius) - 2px)',
			'--radius-lg: var(--radius)',
			'--radius-xl: calc(var(--radius) + 4px)'
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

<div class="flex flex-col items-center gap-4 font-ui">
	<div class="flex rounded-full bg-muted p-1">
		{#each SCREENS as option (option.id)}
			<button
				type="button"
				aria-pressed={screen === option.id}
				onclick={() => (screen = option.id)}
				class="rounded-full px-3 py-1.5 text-caption font-medium transition-colors {screen ===
				option.id
					? 'bg-card text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				{option.label}
			</button>
		{/each}
	</div>

	<!-- Phone frame. Fixed width so the three screens are comparable and the
	     dialog does not resize as you switch between them; height gives way on a
	     short viewport, where a clipped phone is worse than a stubby one. -->
	<div class="rounded-[36px] border-8 border-stone-800 bg-stone-800 shadow-xl">
		<div
			{style}
			class="h-[min(620px,62vh)] w-[320px] overflow-hidden rounded-[28px] font-sans"
			data-testid="brand-preview-frame"
		>
			{#if screen === 'landing'}
				<LandingScreen {campaignTitle} {placeName} {hostName} />
			{:else if screen === 'poll'}
				<PollScreen {placeName} {keyQuestion} />
			{:else}
				<AboutYouScreen {placeName} {categories} />
			{/if}
		</div>
	</div>

	<p class="max-w-[320px] text-center text-caption text-muted-foreground">
		An approximation, not the real page: type is a rung smaller to fit, and the landing screen's
		OPEN POLL chip and place label are hardcoded in the participant app, so no Brand moves them.
	</p>
</div>
