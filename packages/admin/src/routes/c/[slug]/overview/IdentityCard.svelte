<script lang="ts">
	import type { Snippet } from 'svelte';
	import Card from '@civicos/shared/ui/Card.svelte';
	import SetupField from '$lib/components/setup/SetupField.svelte';
	import { COLOR_SCHEMES } from '@civicos/shared/data/color-scheme';
	import { Spinner } from '@civicos/shared/ui/spinner';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		title: string;
		/** Host portion of the public URL, e.g. "bloomproject.us". */
		baseUrl: string;
		slug: string;
		keyQuestion: string;
		/** Place names shown as chips, e.g. ["Oregon"]. */
		places: string[];
		/** When provided, replaces the read-only title with an editable field. */
		titleField?: Snippet;
		/** When provided, replaces the read-only slug with an editable field. */
		slugField?: Snippet;
		/** When provided, replaces the read-only key question with an editable field. */
		keyQuestionField?: Snippet;
		/** When provided, replaces the read-only place chips with an editable field. */
		placeField?: Snippet;
		/**
		 * Id of the stored Color Scheme. Null when none has been picked, and then no
		 * swatch is ringed even though participants see Green.
		 */
		colorSchemeId?: string | null;
		/** Persist a scheme. Omit to render the row read-only. */
		onSelectColorScheme?: (id: string) => Promise<void>;
	}

	let {
		title,
		baseUrl,
		slug,
		keyQuestion,
		places,
		titleField,
		slugField,
		keyQuestionField,
		placeField,
		colorSchemeId = null,
		onSelectColorScheme
	}: Props = $props();

	// The ring is read from the stored scheme, never held locally, so a reload
	// shows what was saved. `pending` only stands in for it until the save lands.
	let pending = $state<string | null>(null);
	let saved = $state<string | null>(null);
	let error = $state<string | null>(null);
	let savedTimer: ReturnType<typeof setTimeout> | undefined;

	const readOnly = $derived(!onSelectColorScheme);
	const shownId = $derived(pending ?? colorSchemeId);
	const pendingLabel = $derived(COLOR_SCHEMES.find((s) => s.id === pending)?.label);
	const savedLabel = $derived(COLOR_SCHEMES.find((s) => s.id === saved)?.label);

	async function select(id: string) {
		if (!onSelectColorScheme || pending || id === colorSchemeId) return;
		clearTimeout(savedTimer);
		pending = id;
		saved = null;
		error = null;
		try {
			await onSelectColorScheme(id);
			saved = id;
			savedTimer = setTimeout(() => (saved = null), 2500);
		} catch (e) {
			console.error('PatchConversationMetadata failed', e);
			error = e instanceof Error ? e.message : 'Could not save that colour scheme.';
		} finally {
			pending = null;
		}
	}
</script>

<Card
	class="rounded-[20px] shadow-card transition-colors duration-200 hover:border-muted-foreground/40"
>
	<div class="flex flex-col gap-6 px-8 py-8">
		<SetupField label="Title">
			{#if titleField}
				{@render titleField()}
			{:else}
				<div class="font-display text-body-lg font-semibold">{title}</div>
			{/if}
		</SetupField>

		<div class="flex flex-wrap gap-x-12 gap-y-6">
			<SetupField label="Slug">
				{#if slugField}
					{@render slugField()}
				{:else}
					<div class="text-body font-semibold">
						<span class="text-muted-foreground">{baseUrl}/</span>{slug}
					</div>
				{/if}
			</SetupField>

			<!-- Always rendered, so the row keeps its shape on a Campaign with no
			     places yet. -->
			<SetupField label="Place(s)">
				{#if placeField}
					{@render placeField()}
				{:else}
					<div class="flex min-h-9 flex-wrap items-center gap-2">
						{#each places as place (place)}
							<span
								class="rounded-[10px] bg-primary/5 px-2.5 py-1.5 text-caption font-medium text-primary"
							>
								{place}
							</span>
						{:else}
							<span class="text-body text-muted-foreground">None yet</span>
						{/each}
					</div>
				{/if}
			</SetupField>
		</div>

		<SetupField label="Key Question">
			{#if keyQuestionField}
				{@render keyQuestionField()}
			{:else}
				<div class="text-body">{keyQuestion}</div>
			{/if}
		</SetupField>

		<SetupField label="Color Scheme">
			<p class="text-body text-muted-foreground">
				The accent participants see on buttons, progress, and highlights.
			</p>
			<div
				role="group"
				aria-label="Color Scheme"
				aria-busy={!!pending}
				class="flex flex-wrap gap-x-3 gap-y-4 pt-2"
			>
				{#each COLOR_SCHEMES as option (option.id)}
					{@const selected = shownId === option.id}
					<button
						type="button"
						aria-pressed={selected}
						disabled={readOnly}
						onclick={() => select(option.id)}
						style={`--swatch: ${option.primary}`}
						class="group flex w-20 touch-manipulation flex-col items-center gap-2 rounded-[12px] p-1.5 transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none {pending &&
						!selected
							? 'opacity-50'
							: ''}"
					>
						<span
							class="flex size-12 items-center justify-center rounded-[10px] bg-(--swatch) text-white transition-[transform,box-shadow] {selected
								? 'shadow-[0_0_0_2px_var(--background),0_0_0_4px_var(--swatch)]'
								: 'border border-black/10'} {readOnly
								? ''
								: 'group-hover:scale-105 group-active:scale-95 group-active:duration-0'}"
						>
							{#if pending === option.id}
								<Spinner class="size-5" aria-label="Saving" />
							{:else if selected}
								<CheckIcon class="size-5" strokeWidth={3} aria-hidden="true" />
							{/if}
						</span>
						<span
							class="text-caption {selected
								? 'font-semibold text-foreground'
								: readOnly
									? 'text-muted-foreground'
									: 'text-muted-foreground group-hover:text-foreground'}"
						>
							{option.label}
						</span>
					</button>
				{/each}
			</div>
			<p aria-live="polite" class="min-h-5 text-caption">
				{#if error}
					<span class="text-destructive">{error}</span>
				{:else if pendingLabel}
					<span class="text-muted-foreground">Saving {pendingLabel}…</span>
				{:else if savedLabel}
					<span class="inline-flex items-center gap-1 text-foreground">
						<CheckIcon class="size-3.5" aria-hidden="true" />
						{savedLabel} saved
					</span>
				{/if}
			</p>
		</SetupField>
	</div>
</Card>
