<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import { Trash2 } from '@lucide/svelte';
	import IdentityCard from './IdentityCard.svelte';
	import CoHostsCard from './CoHostsCard.svelte';
	import AddCoHostsDialog from './AddCoHostsDialog.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import ParticipantAsksCard from '$lib/components/setup/ParticipantAsksCard.svelte';
	import {
		readCustomDemographics,
		readDemographicToggles,
		type CustomDemographicCategory,
		type DemographicKey
	} from '$lib/config/demographics';
	import { readAskToggles, type AskKey } from '$lib/config/participant-asks';
	import { routeSlugFor } from '$lib/conversations';
	import ContextCard from './ContextCard.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import { setupSchema } from './setup-schema';
	import { describeApiFailure } from '$lib/api/describe-failure';

	let { data } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);

	const title = $derived(campaign.title);
	const description = $derived(conversation?.description ?? '');
	const slug = $derived(conversation?.slug ?? campaign.slug);
	// Host portion of the public URL (strip protocol + any path). Empty for
	// Campaigns with no legacy region entry, which have no public URL yet.
	const baseUrl = $derived(
		campaign.shareUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ?? ''
	);
	const places = $derived(campaign.placeName ? [campaign.placeName] : []);

	// Live co-hosts: the owning host (Admin badge) plus organizations granted the
	// co-host role on this Conversation. Resolved server-side in +page.server.ts
	// (ListResourcePermissions -> GetOrganization). Replaces the old static
	// static region.partners list. Added via the AddCoHostsDialog below (#362).
	const cohosts = $derived(data.cohosts);
	let addCohostsOpen = $state(false);

	// --- Editable fields -------------------------------------------------------
	// One SPA superform, three destinations, because no two of these fields live
	// in the same place on the backend:
	//
	//   title, description  TextContentId (UUID) references, not text columns, so
	//                       edits go through CreateOrUpdateTextTranslation against
	//                       each field's text_content_id in the conversation's
	//                       primary_locale (resolved in +layout.server.ts as
	//                       data.textContent). UpdateConversation 422s on plain
	//                       strings here. See #391.
	//   keyQuestion         the `topic` of the Polis conversation behind this
	//                       Campaign's Polis workflow step, via PolisUpdateConfig.
	//   slug                a real Conversation column, via UpdateConversation.
	//
	// The first three auto-save on a debounce and only write the fields that
	// actually changed, then a scoped invalidate refreshes the public-facing
	// strings. Slug is the exception and commits on blur; see `saveSlug`.
	type DebouncedField = 'title' | 'description' | 'keyQuestion';
	const DEBOUNCED_FIELDS = ['title', 'description', 'keyQuestion'] as const;
	type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
	let saveStatus = $state<SaveStatus>('idle');
	let debounce: ReturnType<typeof setTimeout> | undefined;

	// Seed the form from the initial conversation snapshot (a deliberate one-time
	// read of `data`, not the reactive derived values: the form is the editable
	// working copy, so `untrack` makes that intent explicit). `saved` tracks the
	// last-persisted value per field so we only re-write what changed.
	const initialFields = untrack(() => ({
		title: data.conversation?.title ?? data.campaign.title,
		description: data.conversation?.description ?? '',
		slug: data.conversation?.slug ?? data.campaign.slug,
		keyQuestion: data.campaign.keyQuestion
	}));
	const saved: Record<DebouncedField | 'slug', string> = { ...initialFields };

	const form = superForm(defaults(initialFields, zod4(setupSchema)), {
		SPA: true,
		validators: zod4Client(setupSchema),
		onChange(event) {
			// The slug is the public URL and the `/c/<slug>` route segment, so it
			// commits on blur (see `saveSlug`) instead of mid-typing: auto-saving it
			// would publish every half-typed value and bounce the admin route along
			// with it.
			if (event.paths.length === 1 && event.paths[0] === 'slug') return;
			clearTimeout(debounce);
			saveStatus = 'idle';
			debounce = setTimeout(save, 700);
		}
	});
	const { form: formData, errors, validateForm } = form;

	async function save() {
		const result = await validateForm({ update: true });
		if (!result.valid) {
			saveStatus = 'error';
			return;
		}

		// Only the fields whose value actually changed since the last save.
		const changed = DEBOUNCED_FIELDS.filter((key) => result.data[key] !== saved[key]);
		if (changed.length === 0) return;

		// A field with nowhere to write to is dropped rather than written to the
		// wrong place. Say so on the field itself: a bare "Couldn't save" cannot
		// distinguish a Campaign that has no Polis poll from one whose save the
		// backend refused.
		const attempts = changed.map((key) => ({ key, to: writerFor(key, result.data[key]) }));
		for (const a of attempts) if (typeof a.to === 'string') $errors[a.key] = [a.to];

		const writes = attempts.filter(
			(a): a is { key: DebouncedField; to: () => Promise<unknown> } => typeof a.to === 'function'
		);
		if (writes.length === 0) {
			saveStatus = 'error';
			return;
		}

		saveStatus = 'saving';
		try {
			await Promise.all(writes.map((w) => w.to()));
			for (const w of writes) {
				saved[w.key] = result.data[w.key];
				$errors[w.key] = undefined;
			}
			saveStatus = writes.length === changed.length ? 'saved' : 'error';
			await invalidate(`campaign:${page.params.slug}`);
		} catch (e) {
			console.error('Failed to save setup fields', e);
			const reason = describeApiFailure(e);
			for (const w of writes) $errors[w.key] = [`Could not save: ${reason}`];
			saveStatus = 'error';
		}
	}

	/**
	 * How one field gets written, or a sentence explaining why it cannot be. The
	 * string case is a configuration gap, not a failed request, so it is worth
	 * saying out loud rather than logging and rendering a generic error.
	 */
	function writerFor(key: DebouncedField, content: string): (() => Promise<unknown>) | string {
		if (key === 'keyQuestion') {
			const stepId = campaign.polisWorkflowStepId;
			if (!stepId) return 'This Campaign has no Polis poll to write the question to.';
			return () => data.api.PolisUpdateConfig({ workflow_step_id: stepId, topic: content });
		}

		// Missing on a non-admin session, or when the conversation didn't resolve
		// against this backend.
		const target = data.textContent[key];
		if (!target) return `No translation record for "${key}" on this Campaign.`;
		return () =>
			data.api.CreateOrUpdateTextTranslation(
				{ content },
				{ params: { text_content_id: target.id, locale: target.locale } }
			);
	}

	/**
	 * The slug is a plain Conversation column, so unlike title/description it is
	 * written with UpdateConversation. Renaming it moves the Campaign: the public
	 * URL changes, and so does the `/c/<slug>` segment this page is open at,
	 * unless a legacy `regions.ts` entry pins the route slug. Navigate to wherever
	 * the Campaign now lives so a refresh does not 404 on the old segment.
	 */
	async function saveSlug() {
		const next = $formData.slug.trim();
		if (next === saved.slug) return;

		const result = await validateForm({ update: true });
		if (!result.valid) {
			saveStatus = 'error';
			return;
		}

		saveStatus = 'saving';
		try {
			await data.api.UpdateConversation(
				{ slug: next },
				{ params: { conversation_id: campaign.id } }
			);
		} catch (e) {
			console.error('Failed to save slug', e);
			$errors.slug = [`Could not save the slug: ${describeApiFailure(e)}`];
			saveStatus = 'error';
			return;
		}

		saved.slug = next;
		saveStatus = 'saved';

		const from = page.params.slug;
		const to = routeSlugFor({ id: campaign.id, slug: next });
		if (to !== from) {
			await goto(resolve('/c/[slug]/overview', { slug: to }), {
				replaceState: true,
				invalidateAll: true
			});
		} else {
			await invalidate(`campaign:${from}`);
			await invalidate('app:conversations');
		}
	}

	const statusLabel: Record<Exclude<SaveStatus, 'idle'>, string> = {
		saving: 'Saving…',
		saved: 'Saved',
		error: "Couldn't save"
	};
	const demographics = $derived(readDemographicToggles(conversation?.metadata));
	const customDemographics = $derived(readCustomDemographics(conversation?.metadata));

	/**
	 * INTERIM STORAGE (#363/#364). Demographics config has no backend table yet,
	 * so it lives in `conversation.metadata` until comhairle promotes it to a
	 * real entity model.
	 *
	 * Each write sends its whole key. PatchConversationMetadata merges only at the
	 * top level and replaces nested values wholesale, so a partial object drops
	 * whatever it omits.
	 */
	async function patchMetadata(patch: Record<string, unknown>) {
		await data.api.PatchConversationMetadata(patch, {
			params: { conversation_id: campaign.id }
		});
		await invalidate(`campaign:${page.params.slug}`);
	}

	const setDemographic = (key: DemographicKey, next: boolean) =>
		patchMetadata({ demographics: { ...demographics, [key]: next } });

	const addCustomDemographic = (category: CustomDemographicCategory) =>
		patchMetadata({ customDemographics: [...customDemographics, category] });

	const toggleCustomDemographic = (key: string, next: boolean) =>
		patchMetadata({
			customDemographics: customDemographics.map((c) =>
				c.key === key ? { ...c, enabled: next } : c
			)
		});

	const removeCustomDemographic = (key: string) =>
		patchMetadata({ customDemographics: customDemographics.filter((c) => c.key !== key) });

	// Same interim metadata storage as demographics, same whole-key write.
	const asks = $derived(readAskToggles(conversation?.metadata));

	const setAsk = (key: AskKey, next: boolean) =>
		patchMetadata({ participantAsks: { ...asks, [key]: next } });
</script>

{#snippet titleField()}
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<input
					{...props}
					bind:value={$formData.title}
					class="font-display w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body-lg font-semibold focus:border-primary focus:outline-none"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors class="mt-1 text-caption" />
	</Form.Field>
{/snippet}

{#snippet slugField()}
	<Form.Field {form} name="slug">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center gap-1.5 text-body font-semibold">
					{#if baseUrl}
						<span class="shrink-0">{baseUrl}/</span>
					{/if}
					<!-- field-sizing-content keeps the box hugging the slug, so the row
					     still reads as one URL rather than as a form spanning the card. -->
					<input
						{...props}
						bind:value={$formData.slug}
						onblur={saveSlug}
						onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
						spellcheck="false"
						autocapitalize="off"
						autocorrect="off"
						class="field-sizing-content min-w-24 rounded-[10px] border border-stone-300 bg-muted px-3 py-1.5 focus:border-primary focus:outline-none"
					/>
				</div>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors class="mt-1 text-caption" />
	</Form.Field>
{/snippet}

{#snippet keyQuestionField()}
	<Form.Field {form} name="keyQuestion">
		<Form.Control>
			{#snippet children({ props })}
				<textarea
					{...props}
					bind:value={$formData.keyQuestion}
					rows="2"
					class="field-sizing-content w-full resize-none rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
				></textarea>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors class="mt-1 text-caption" />
	</Form.Field>
{/snippet}

{#snippet descriptionField()}
	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<!-- Tiptap owns a contenteditable, not an <input>, so formsnap's control
				     attributes are forwarded onto that element rather than spread here. -->
				<RichTextEditor
					value={$formData.description}
					onChange={(html) => ($formData.description = html)}
					attributes={{
						id: props.id,
						'aria-describedby': props['aria-describedby'],
						'aria-invalid': props['aria-invalid'],
						'aria-required': props['aria-required']
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors class="mt-1 text-caption" />
	</Form.Field>
{/snippet}

<div class="flex-1 overflow-y-auto">
	<div class="flex flex-col gap-6 px-8 pb-8">
		<!-- Auto-save status -->
		<div class="h-4 self-end text-caption text-muted-foreground" aria-live="polite">
			{#if saveStatus !== 'idle'}
				<span class={saveStatus === 'error' ? 'text-destructive' : ''}>
					{statusLabel[saveStatus]}
				</span>
			{/if}
		</div>

		<!-- ===== Identity ===== -->
		<IdentityCard
			{title}
			{baseUrl}
			{slug}
			keyQuestion={campaign.keyQuestion}
			{places}
			{titleField}
			{slugField}
			{keyQuestionField}
		/>

		<!-- ===== Co-Hosts ===== -->
		<!-- Live co-hosts; "Add New…" opens the org picker and grants the
		     co-host role on this Conversation (#362). -->
		<CoHostsCard {cohosts} convId={data.convId} onAddNew={() => (addCohostsOpen = true)} />
		<AddCoHostsDialog
			bind:open={addCohostsOpen}
			convId={data.convId}
			pickerOrgs={data.pickerOrgs}
			excludeIds={data.excludeIds}
		/>

		<!-- ===== Demographics =====
		     Reads the same conversation.metadata.demographics the Open Poll Setup
		     card writes, so the two views cannot disagree. Read-only here: the
		     Campaign-side write path plus Add New are #363/#364. -->
		<DemographicsCard
			title="Demographics"
			subtitle="Participants will be shown these questions at the end of the Open Poll. You can turn on/off any questions, or add your own."
			toggles={demographics}
			onToggle={setDemographic}
			custom={customDemographics}
			onToggleCustom={toggleCustomDemographic}
			onAddCustom={addCustomDemographic}
			onRemoveCustom={removeCustomDemographic}
		/>

		<!-- ===== Participant Asks =====
		     One switch per ask, governing both surfaces civicos shows it on: the
		     mid-poll checkpoint screen and the end-page CTA card. They already
		     share a completion flag per ask, so they are one ask shown twice.
		     Stored alongside demographics in conversation.metadata; civicos still
		     hardcodes both lists, so this does not change the poll yet (#398). -->
		<ParticipantAsksCard
			title="Participant Asks"
			subtitle="What we ask participants for besides their votes. Each one shows up while they vote and again on the thank-you page. Turn off any you don't want to ask for."
			toggles={asks}
			onToggle={setAsk}
		/>

		<!-- ===== Context for Participants ===== -->
		<ContextCard {description} {descriptionField} />

		<!-- Danger zone: not in the Figma refresh and currently non-functional.
		     Kept to avoid dropping an affordance; open question whether to wire
		     (DeleteConversation) or remove. -->
		<Card
			class="rounded-[20px] border-destructive/30 bg-destructive/5 transition-colors duration-200 hover:border-destructive/60 hover:bg-destructive/10"
		>
			<div class="flex items-center justify-between gap-3 px-8 py-5">
				<div>
					<div class="text-caption font-bold tracking-tight text-destructive">DANGER ZONE</div>
					<div class="text-caption text-muted-foreground">
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
