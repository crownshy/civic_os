<script lang="ts">
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { type Brand } from '@civicos/shared/data/brand';
	import BrandFields from './BrandFields.svelte';
	import BrandPreview from './preview/BrandPreview.svelte';
	import type { PreviewCategory } from './preview/categories';
	import { fromDraft, invalidTokens, toDraft, type BrandDraft } from './brand-draft';

	interface Props {
		open: boolean;
		/** This Campaign's own overrides, from conversation.metadata.brand. */
		brand: Brand;
		/**
		 * What the Host sets for every Campaign it runs, shown as the fallback
		 * under each empty field and as the layer under the preview. Read-only
		 * here: the Host layer is edited on the Host, not on one of its Campaigns.
		 */
		inherited?: Brand;
		campaignTitle: string;
		keyQuestion: string;
		placeName: string;
		hostName: string;
		/** Demographic categories switched on for this Campaign, for the About You mock. */
		categories: PreviewCategory[];
		/** Persist the whole Brand. Omit to render read-only. */
		onSave?: (next: Brand) => Promise<void>;
	}

	let {
		open = $bindable(),
		brand,
		inherited,
		campaignTitle,
		keyQuestion,
		placeName,
		hostName,
		categories,
		onSave
	}: Props = $props();

	const saved = $derived(toDraft(brand));
	// Writable derived: edits win until `brand` itself changes, which is what
	// re-seeds the form after a save invalidates the parent load.
	let draft = $derived(toDraft(brand));

	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let errorText = $state<string | null>(null);

	const invalid = $derived(invalidTokens(draft));
	const dirty = $derived(JSON.stringify(draft) !== JSON.stringify(saved));
	const editable = $derived(!!onSave);

	function change(next: BrandDraft) {
		draft = next;
		if (status === 'saved') status = 'idle';
	}

	async function save() {
		if (!onSave || invalid.length > 0) return;
		status = 'saving';
		errorText = null;
		try {
			await onSave(fromDraft(draft));
			status = 'saved';
		} catch (e) {
			console.error('PatchConversationMetadata failed', e);
			errorText = e instanceof Error ? e.message : 'Could not save the Brand.';
			status = 'error';
		}
	}

	function discard() {
		draft = toDraft(brand);
		status = 'idle';
		errorText = null;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="flex max-h-[92vh] w-[min(96vw,1180px)] flex-col overflow-hidden font-ui sm:max-w-[1180px]"
	>
		<Dialog.Header class="shrink-0">
			<Dialog.Title class="text-h4 font-bold">Brand</Dialog.Title>
			<Dialog.Description class="text-body text-muted-foreground">
				How this Campaign looks to participants. Anything you leave blank falls back to your Host's
				Brand, and then to the default.
			</Dialog.Description>
		</Dialog.Header>

		<!-- Fields scroll, the phone stays put: the whole point is watching one
		     change while you make it. -->
		<div
			class="-mx-6 grid min-h-0 flex-1 gap-8 overflow-y-auto px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden"
		>
			<div class="min-h-0 pt-2 lg:overflow-y-auto lg:pr-2">
				<BrandFields {draft} {inherited} {invalid} {editable} onChange={change} />
			</div>

			<div class="flex justify-center pt-2 lg:sticky lg:top-0 lg:overflow-y-auto">
				<BrandPreview
					brand={fromDraft(draft)}
					{inherited}
					{campaignTitle}
					{keyQuestion}
					{placeName}
					{hostName}
					{categories}
				/>
			</div>
		</div>

		{#if errorText}
			<p class="shrink-0 text-body text-destructive">{errorText}</p>
		{/if}

		{#if editable}
			<Dialog.Footer class="shrink-0 border-t border-border pt-4 sm:justify-start">
				<Button
					onclick={save}
					disabled={!dirty || invalid.length > 0 || status === 'saving'}
					aria-busy={status === 'saving'}
				>
					{status === 'saving' ? 'Saving…' : 'Save Brand'}
				</Button>
				{#if dirty}
					<Button variant="ghost" onclick={discard}>Discard</Button>
				{:else if status === 'saved'}
					<span class="self-center text-body text-muted-foreground">Saved</span>
				{/if}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
