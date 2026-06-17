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

	const themeSet = $derived(new Set(themes));

	function toggleOpen() {
		if (disabled) return;
		open = !open;
	}

	function applyToggle(theme: string) {
		const next = themeSet.has(theme)
			? themes.filter((t) => t !== theme)
			: [...themes, theme];
		onChange?.(next);
	}

	function applyAdd() {
		const t = newDraft.trim();
		if (!t || themeSet.has(t)) return;
		onChange?.([...themes, t]);
		newDraft = '';
	}

	// Close on outside click.
	$effect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (containerEl && !containerEl.contains(e.target as Node)) {
				open = false;
			}
		}
		document.addEventListener('mousedown', onDocClick);
		return () => document.removeEventListener('mousedown', onDocClick);
	});
</script>

<div class="relative inline-flex flex-wrap items-center gap-1" bind:this={containerEl}>
	{#each themes as t (t)}
		<span
			class="bg-muted text-foreground inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
		>
			{t}
		</span>
	{/each}

	{#if !disabled}
		<button
			type="button"
			onclick={toggleOpen}
			class="text-destructive bg-destructive/10 hover:bg-destructive/20 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium"
		>
			Add new+
		</button>
	{/if}

	{#if open}
		<div
			class="border-border bg-popover text-popover-foreground absolute top-full left-0 z-20 mt-1 w-48 overflow-hidden rounded-md border shadow-lg"
		>
			{#each availableThemes as t (t)}
				{@const checked = themeSet.has(t)}
				<button
					type="button"
					onclick={() => applyToggle(t)}
					class="hover:bg-muted/60 flex w-full items-center justify-between border-b border-black/10 px-2.5 py-1.5 text-left text-xs last:border-b-0"
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
					class="border-border focus:ring-destructive/40 min-w-0 flex-1 rounded border px-1.5 py-1 text-xs focus:ring-2 focus:outline-none"
				/>
				<button
					type="button"
					onclick={applyAdd}
					disabled={!newDraft.trim()}
					class="bg-destructive text-destructive-foreground rounded px-1.5 py-1 text-xs font-medium disabled:opacity-40"
				>
					Add
				</button>
			</div>
		</div>
	{/if}
</div>
