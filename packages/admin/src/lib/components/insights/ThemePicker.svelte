<script lang="ts">
	/**
	 * Inline theme chip + dropdown picker. Renders the current themes on a
	 * statement; clicking opens a dropdown of themes already used elsewhere
	 * on this conversation, with toggle checkmarks and an "Add new" affordance.
	 *
	 * The component is dumb — the parent owns the source of truth and the
	 * persistence call. We just emit `onChange(nextThemes)`.
	 */
	interface Props {
		/** Themes currently assigned to this statement. */
		themes: string[];
		/** Every theme already used on this conversation (for the dropdown). */
		availableThemes: string[];
		/** Disabled when there's no aux row to write to. */
		disabled?: boolean;
		onChange?: (next: string[]) => void | Promise<void>;
	}

	let { themes, availableThemes, disabled = false, onChange }: Props = $props();

	let open = $state(false);
	let newDraft = $state('');
	let containerEl: HTMLDivElement | undefined = $state();
	let dropdownPos = $state<{ top: number; left: number } | null>(null);

	const themeSet = $derived(new Set(themes));

	function toggleOpen() {
		if (disabled) return;
		open = !open;
		if (open) reposition();
	}

	/**
	 * Dropdown uses `position: fixed` to escape ancestor `overflow: hidden`
	 * (e.g. the Card wrapping the statements list). So we have to position it
	 * manually from the trigger's bbox, and re-position on scroll/resize.
	 */
	function reposition() {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		dropdownPos = { top: rect.bottom + 4, left: rect.left };
	}

	function applyToggle(theme: string) {
		const next = themeSet.has(theme)
			? themes.filter((t) => t !== theme)
			: [...themes, theme];
		onChange?.(next);
	}

	function applyRemove(theme: string) {
		if (disabled) return;
		onChange?.(themes.filter((t) => t !== theme));
	}

	function applyAdd() {
		const t = newDraft.trim();
		if (!t || themeSet.has(t)) return;
		onChange?.([...themes, t]);
		newDraft = '';
	}

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

<div class="relative inline-flex flex-wrap items-center gap-1" bind:this={containerEl}>
	{#each themes as t (t)}
		<span
			class="bg-muted text-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-caption font-medium"
		>
			{t}
			{#if !disabled}
				<button
					type="button"
					onclick={() => applyRemove(t)}
					aria-label={`Remove theme ${t}`}
					class="text-muted-foreground hover:text-destructive -mr-0.5 leading-none"
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
			class="text-destructive bg-destructive/10 hover:bg-destructive/20 inline-flex items-center rounded px-1.5 py-0.5 text-caption font-medium"
		>
			Add new+
		</button>
	{/if}

	{#if open && dropdownPos}
		<div
			style:top="{dropdownPos.top}px"
			style:left="{dropdownPos.left}px"
			class="border-border bg-popover text-popover-foreground fixed z-50 w-48 overflow-hidden rounded-md border shadow-lg"
		>
			{#each availableThemes as t (t)}
				{@const checked = themeSet.has(t)}
				<button
					type="button"
					onclick={() => applyToggle(t)}
					class="hover:bg-muted/60 flex w-full items-center justify-between border-b border-black/10 px-2.5 py-1.5 text-left text-caption last:border-b-0"
				>
					<span>#{t}</span>
					{#if checked}
						<span class="text-destructive">✓</span>
					{/if}
				</button>
			{/each}
			<div class="flex items-center gap-1 border-t border-black/10 p-1.5">
				<input
					type="text"
					bind:value={newDraft}
					onkeydown={(e) => e.key === 'Enter' && applyAdd()}
					placeholder="Add new…"
					class="border-border focus:ring-destructive/40 min-w-0 flex-1 rounded border px-1.5 py-1 text-caption focus:ring-2 focus:outline-none"
				/>
				<button
					type="button"
					onclick={applyAdd}
					disabled={!newDraft.trim()}
					class="bg-destructive text-destructive-foreground rounded px-1.5 py-1 text-caption font-medium disabled:opacity-40"
				>
					Add
				</button>
			</div>
		</div>
	{/if}
</div>
