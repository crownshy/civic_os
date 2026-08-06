<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Trash2 } from '@lucide/svelte';
	import IdentityCard from './IdentityCard.svelte';
	import CoHostsCard from './CoHostsCard.svelte';
	import DemographicsCard from './DemographicsCard.svelte';
	import ContextCard from './ContextCard.svelte';
	import { setupSchema } from './setup-schema';

	let { data } = $props();

	const region = $derived(data.region);
	const conversation = $derived(data.conversation);

	const title = $derived(conversation?.title ?? region.heroHeader);
	const description = $derived(conversation?.description ?? region.contextParagraphs.join('\n\n'));
	const slug = $derived(conversation?.slug ?? region.slug);
	// Host portion of the public URL (strip protocol + any path).
	const baseUrl = $derived(region.shareUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, ''));
	const places = $derived(region.stateName ? [region.stateName] : []);

	// Read-only co-hosts from static region data (lead host + coalition partners).
	const cohosts = $derived([
		{ name: region.hostName, website: region.hostUrl, isAdmin: true },
		...region.partners.map((p) => ({ name: p.name, website: p.url }))
	]);

	// --- Editable fields (Title + Basic Description) ---------------------------
	// SPA superforms with debounced auto-save straight to UpdateConversation, then
	// a scoped invalidate so the public site reflects the edit. Only real
	// Conversation columns are wired here; everything else stays presentational.
	type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
	let saveStatus = $state<SaveStatus>('idle');
	let debounce: ReturnType<typeof setTimeout> | undefined;

	// Seed the form from the initial conversation snapshot (a deliberate one-time
	// read of `data`, not the reactive derived values: the form is the editable
	// working copy, so `untrack` makes that intent explicit).
	const initialFields = untrack(() => ({
		title: data.conversation?.title ?? data.region.heroHeader,
		description: data.conversation?.description ?? data.region.contextParagraphs.join('\n\n')
	}));

	const form = superForm(defaults(initialFields, zod4(setupSchema)), {
		SPA: true,
		validators: zod4Client(setupSchema),
		onChange() {
			clearTimeout(debounce);
			saveStatus = 'idle';
			debounce = setTimeout(save, 700);
		}
	});
	const { form: formData, validateForm } = form;

	async function save() {
		const result = await validateForm({ update: true });
		if (!result.valid) {
			saveStatus = 'error';
			return;
		}
		saveStatus = 'saving';
		try {
			await data.api.UpdateConversation(
				{ title: result.data.title, description: result.data.description },
				{ params: { conversation_id: region.conversationId } }
			);
			saveStatus = 'saved';
			await invalidate(`region:conversation:${page.params.slug}`);
		} catch (e) {
			console.error('Failed to save conversation', e);
			saveStatus = 'error';
		}
	}

	const statusLabel: Record<Exclude<SaveStatus, 'idle'>, string> = {
		saving: 'Saving…',
		saved: 'Saved',
		error: "Couldn't save"
	};
</script>

{#if region}
	{#snippet titleField()}
		<Form.Field {form} name="title">
			<Form.Control>
				{#snippet children({ props })}
					<input
						{...props}
						bind:value={$formData.title}
						class="font-display text-display focus:border-primary w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 font-semibold focus:outline-none"
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-caption mt-1" />
		</Form.Field>
	{/snippet}

	{#snippet descriptionField()}
		<Form.Field {form} name="description">
			<Form.Control>
				{#snippet children({ props })}
					<textarea
						{...props}
						bind:value={$formData.description}
						rows="4"
						class="text-body focus:border-primary w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 leading-relaxed focus:outline-none"
					></textarea>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors class="text-caption mt-1" />
		</Form.Field>
	{/snippet}

	<div class="flex-1 overflow-y-auto">
		<div class="flex flex-col gap-6 px-8 py-8">
			<!-- Auto-save status -->
			<div class="text-caption text-muted-foreground h-4 self-end" aria-live="polite">
				{#if saveStatus !== 'idle'}
					<span class={saveStatus === 'error' ? 'text-destructive' : ''}>
						{statusLabel[saveStatus]}
					</span>
				{/if}
			</div>

			<!-- ===== Identity ===== -->
			<IdentityCard {title} {baseUrl} {slug} keyQuestion={region.question} {places} {titleField} />

			<!-- ===== Co-Hosts ===== -->
			<!-- Read-only from static region data (no Add flow). The add flow is
			     deferred to #362 (blocked-by #350, the Host object). -->
			<CoHostsCard {cohosts} />

			<!-- ===== Demographics ===== -->
			<!-- Presentational: toggles/Add-New don't persist yet. Config storage is
			     #363/#364 (metadata vs table, pending the team decision). -->
			<DemographicsCard />

			<!-- ===== Context for Participants ===== -->
			<ContextCard {description} {descriptionField} />

			<!-- Danger zone: not in the Figma refresh and currently non-functional.
			     Kept to avoid dropping an affordance; open question whether to wire
			     (DeleteConversation) or remove. -->
			<Card
				class="bg-destructive/5 border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 rounded-[20px] transition-colors duration-200"
			>
				<div class="flex items-center justify-between gap-3 px-8 py-5">
					<div>
						<div class="text-destructive text-caption font-bold tracking-tight">DANGER ZONE</div>
						<div class="text-muted-foreground text-caption">
							Permanently delete this conversation and all its data.
						</div>
					</div>
					<Button size="sm" variant="destructive-outline">
						<Trash2 class="size-3.5" />
						delete conversation…
					</Button>
				</div>
			</Card>
		</div>
	</div>
{/if}
