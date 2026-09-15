<script lang="ts">
	import { Input } from '@civicos/shared/ui/input';
	import { BRAND_TOKENS, type Brand, type BrandTokenDef } from '@civicos/shared/data/brand';
	import { withToken, type BrandDraft } from './brand-draft';

	interface Props {
		/** The Brand being edited. Owned by the caller, so the preview can read it too. */
		draft: BrandDraft;
		/**
		 * What the Host sets for every Campaign it runs, shown as the fallback
		 * under each empty field. Read-only here: the Host layer is edited on the
		 * Host, not on one of its Campaigns.
		 */
		inherited?: Brand;
		/** Keys currently holding a value their kind cannot take. */
		invalid: string[];
		editable?: boolean;
		onChange: (next: BrandDraft) => void;
	}

	let { draft, inherited, invalid, editable = true, onChange }: Props = $props();

	const GROUPS: { key: BrandTokenDef['group']; label: string }[] = [
		{ key: 'surface', label: 'Surfaces' },
		{ key: 'accent', label: 'Accents' },
		{ key: 'type', label: 'Type and shape' }
	];

	const CSS_PLACEHOLDER = '--shell-border: #876449;\n--tracking-display: -0.01em;';

	/** What a participant sees for this token when the Campaign leaves it blank. */
	const fallback = (def: BrandTokenDef) => inherited?.tokens[def.key] ?? '';

	/**
	 * `<input type="color">` only speaks `#rrggbb`. A named colour or an
	 * `oklch()` has no picker position, so the picker sits on black and the text
	 * field stays the authority for what is stored.
	 */
	function swatch(def: BrandTokenDef): string {
		const value = draft.tokens[def.key] || fallback(def);
		return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000';
	}
</script>

<div class="space-y-8 font-ui">
	{#each GROUPS as group (group.key)}
		<div>
			<h3 class="mb-3 text-caption font-semibold text-muted-foreground uppercase">
				{group.label}
			</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each BRAND_TOKENS.filter((t) => t.group === group.key) as def (def.key)}
					{@const value = draft.tokens[def.key] ?? ''}
					{@const bad = invalid.includes(def.key)}
					<div class="space-y-1.5">
						<label class="block text-body font-medium text-foreground" for="brand-{def.key}">
							{def.label}
						</label>
						<div class="flex items-center gap-2">
							{#if def.kind === 'color'}
								<input
									type="color"
									aria-label="{def.label} colour picker"
									disabled={!editable}
									value={swatch(def)}
									oninput={(e) => onChange(withToken(draft, def.key, e.currentTarget.value))}
									class="h-8 w-8 shrink-0 rounded-lg border border-input bg-transparent p-1"
								/>
							{/if}
							<Input
								id="brand-{def.key}"
								{value}
								disabled={!editable}
								aria-invalid={bad}
								placeholder={fallback(def) || 'Deployment default'}
								oninput={(e) => onChange(withToken(draft, def.key, e.currentTarget.value))}
							/>
						</div>
						{#if bad}
							<p class="text-caption text-destructive">
								Not a {def.kind === 'color' ? 'colour' : def.kind} this can set.
							</p>
						{:else if !value && fallback(def)}
							<p class="text-caption text-muted-foreground">From the Host: {fallback(def)}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	<div>
		<label class="block text-body font-medium text-foreground" for="brand-css">
			Custom properties
		</label>
		<p class="mt-1 mb-2 text-caption text-muted-foreground">
			One <code>--name: value</code> declaration per line, for variables not listed above. Only declarations
			are kept: selectors and at-rules are dropped on save, because a Host who can write rules can cover
			the participant page with one.
		</p>
		<textarea
			id="brand-css"
			rows="4"
			disabled={!editable}
			value={draft.css}
			oninput={(e) => onChange({ ...draft, css: e.currentTarget.value })}
			placeholder={CSS_PLACEHOLDER}
			class="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 font-mono text-body text-foreground placeholder:text-muted-foreground"
		></textarea>
	</div>
</div>
