<script lang="ts">
	/**
	 * Inline theme chip + dropdown picker. Renders the current themes on a
	 * statement; clicking opens a dropdown of the conversation's canonical theme
	 * dictionary, with toggle checkmarks, per-theme description tooltips, and an
	 * "Add theme" button that opens a modal to define a new dictionary theme.
	 *
	 * The component is dumb — the parent owns the source of truth and the
	 * persistence calls. We emit per-theme add/remove events (mapping 1:1 onto the
	 * comhairle /themes endpoints) and an onCreateTheme event (a metadata PATCH).
	 */
	import * as HoverCard from '@civicos/shared/ui/hover-card';
	import { Info } from '@lucide/svelte';
	import AddThemeModal from '$lib/components/AddThemeModal.svelte';
	import type { ThemeDefinition } from '$lib/types/metadata';

	interface Props {
		/** Themes currently assigned to this statement. */
		themes: string[];
		/** The conversation's canonical theme dictionary (name + description). */
		availableThemes: ThemeDefinition[];
		/** Disabled when there's no aux row to write to. */
		disabled?: boolean;
		onAddTheme?: (theme: string) => void | Promise<void>;
		onRemoveTheme?: (theme: string) => void | Promise<void>;
		/** Create a new dictionary theme (persists via a conversation metadata PATCH). */
		onCreateTheme?: (name: string, description: string) => Promise<void>;
	}

	let {
		themes,
		availableThemes,
		disabled = false,
		onAddTheme,
		onRemoveTheme,
		onCreateTheme
	}: Props = $props();

	let open = $state(false);
	let addModalOpen = $state(false);
	let containerEl: HTMLDivElement | undefined = $state();
	let dropdownEl: HTMLDivElement | undefined = $state();
	let dropdownPos = $state<{ top: number; left: number } | null>(null);

	const themeSet = $derived(new Set(themes));
	const availableNames = $derived(availableThemes.map((t) => t.name));

	function toggleOpen() {
		if (disabled) return;
		open = !open;
		if (open) reposition();
	}

	/**
	 * Dropdown uses `position: fixed` to escape ancestor `overflow: hidden`
	 * (e.g. the Card wrapping the statements list). So we have to position it
	 * manually from the trigger's bbox, and re-position on scroll/resize.
	 *
	 * When there isn't room below the trigger (statement near the bottom of the
	 * viewport), flip the menu above it so it never gets clipped off-screen.
	 */
	function reposition() {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const gap = 4;
		const menuHeight = dropdownEl?.offsetHeight ?? 260;
		const spaceBelow = window.innerHeight - rect.bottom;
		const top =
			spaceBelow < menuHeight + gap && rect.top > spaceBelow
				? Math.max(gap, rect.top - menuHeight - gap)
				: rect.bottom + gap;
		dropdownPos = { top, left: rect.left };
	}

	function applyToggle(theme: string) {
		if (themeSet.has(theme)) {
			onRemoveTheme?.(theme);
		} else {
			onAddTheme?.(theme);
		}
	}

	function applyRemove(theme: string) {
		if (disabled) return;
		onRemoveTheme?.(theme);
	}

	/**
	 * Create a new dictionary theme, then apply it to this statement so the tagging
	 * action the admin started completes in one flow. The parent's onCreateTheme
	 * throws on failure, which the modal surfaces (and we skip the apply).
	 */
	async function createAndApply(theme: { name: string; description: string }) {
		await onCreateTheme?.(theme.name, theme.description);
		onAddTheme?.(theme.name);
	}

	// Once the menu is in the DOM we know its real height, so re-measure to
	// decide whether it should flip above the trigger.
	$effect(() => {
		if (open && dropdownEl) reposition();
	});

	// Close on outside click + reposition on scroll/resize while open.
	$effect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (containerEl && !containerEl.contains(e.target as Node)) {
				open = false;
			}
		}
		document.addEventListener('mousedown', onDocClick);
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		return () => {
			document.removeEventListener('mousedown', onDocClick);
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	});
</script>

<div class="relative inline-flex flex-wrap items-center gap-2" bind:this={containerEl}>
	{#each themes as t (t)}
		<span
			class="group/chip font-ui inline-flex items-center gap-1 rounded-[3px] bg-zinc-100 px-[5px] py-[3px] text-base font-medium text-neutral-900"
		>
			{t}
			{#if !disabled}
				<button
					type="button"
					onclick={() => applyRemove(t)}
					aria-label={`Remove theme ${t}`}
					class="hover:text-destructive hidden leading-none text-neutral-900/40 group-hover/chip:inline"
				>
					×
				</button>
			{/if}
		</span>
	{/each}

	{#if !disabled}
		<button
			type="button"
			onclick={toggleOpen}
			class="font-sans text-primary hover:bg-primary/20 inline-flex items-center rounded-[3px] bg-primary/10 px-[5px] py-0.5 text-base font-medium"
		>
			Add new+
		</button>
	{/if}

	{#if open && dropdownPos}
		<div
			bind:this={dropdownEl}
			style:top="{dropdownPos.top}px"
			style:left="{dropdownPos.left}px"
			class="border-border bg-popover text-popover-foreground fixed z-50 w-48 overflow-hidden rounded-md border shadow-lg"
		>
			{#each availableThemes as t (t.name)}
				{@const checked = themeSet.has(t.name)}
				<div
					class="flex w-full items-center border-b border-black/10 text-caption last:border-b-0"
				>
					<button
						type="button"
						onclick={() => applyToggle(t.name)}
						class="hover:bg-muted/60 flex flex-1 items-center gap-1.5 px-2.5 py-1.5 text-left"
					>
						{#if checked}
							<span class="text-primary">✓</span>
						{:else}
							<span class="w-[1ch]"></span>
						{/if}
						<span class="truncate">#{t.name}</span>
					</button>
					{#if t.description}
						<HoverCard.Root openDelay={80} closeDelay={80}>
							<HoverCard.Trigger
								class="text-muted-foreground hover:text-foreground flex items-center px-2 py-1.5 outline-none"
								aria-label={`About theme ${t.name}`}
							>
								<Info class="size-3.5" />
							</HoverCard.Trigger>
							<HoverCard.Content
								side="right"
								align="start"
								sideOffset={8}
								class="w-56 rounded-xl border-0 bg-slate-900 px-3.5 py-3 text-caption text-white/90 shadow-lg"
							>
								<div class="font-bold uppercase text-white">{t.name}</div>
								<p class="mt-1.5 leading-snug">{t.description}</p>
							</HoverCard.Content>
						</HoverCard.Root>
					{/if}
				</div>
			{/each}
			{#if availableThemes.length === 0}
				<p class="text-muted-foreground px-2.5 py-2 text-caption italic">No themes defined yet.</p>
			{/if}
			<div class="border-t border-black/10 p-1.5">
				<button
					type="button"
					onclick={() => {
						open = false;
						addModalOpen = true;
					}}
					class="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded px-1.5 py-1 text-caption font-medium"
				>
					Add theme +
				</button>
			</div>
		</div>
	{/if}

	<AddThemeModal
		bind:open={addModalOpen}
		existingNames={availableNames}
		onSubmit={createAndApply}
	/>
</div>
