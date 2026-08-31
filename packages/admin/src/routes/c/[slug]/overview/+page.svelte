<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { enhance } from '$app/forms';
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
	import AddCoHostsDialog from '$lib/components/setup/AddCoHostsDialog.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import ParticipantAsksCard from '$lib/components/setup/ParticipantAsksCard.svelte';
	import {
		readCustomDemographics,
		readDemographicToggles,
		type CustomDemographicCategory,
		type DemographicKey
	} from '$lib/config/demographics';
	import { readAskToggles, type AskKey } from '$lib/config/participant-asks';
	import { placeFromName, rescopedSlug, toPlaceSlug } from '$lib/config/place';
	import { extractSubdomain } from '@civicos/shared/data/regions';
	import { RESERVED_ROUTE_SLUGS, routeSlugFor } from '$lib/conversations';
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
	const places = $derived(campaign.place ? [campaign.place.name] : []);

	// Whatever is left of the public URL once the current Place is stripped off,
	// so the subdomain preview below reads as a real address rather than a bare
	// label. Empty for a Campaign with no region entry and so no public URL yet.
	const baseDomain = $derived.by(() => {
		if (!baseUrl) return '';
		const current = extractSubdomain(baseUrl);
		return current ? baseUrl.slice(current.length + 1) : baseUrl;
	});

	// Live co-hosts: the owning host (Admin badge) plus organizations granted the
	// co-host role on this Conversation. Resolved server-side in +page.server.ts
	// (ListResourcePermissions -> GetOrganization). Replaces the old static
	// static region.partners list. Added via the AddCoHostsDialog below (#362).
	const cohosts = $derived(data.cohosts);
	let addCohostsOpen = $state(false);
	let grantingCohosts = $state(false);

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
	// Everything the status line speaks for. `place` is not a form field, but it
	// shares the indicator, so it shares the bookkeeping.
	type FormField = DebouncedField | 'slug';
	type StatusField = FormField | 'place';
	let saveStatus = $state<SaveStatus>('idle');
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const FIELD_LABELS: Record<StatusField, string> = {
		title: 'Title',
		description: 'Description',
		keyQuestion: 'Key Question',
		slug: 'Slug',
		place: 'Place'
	};

	// Which fields are currently unsaved, rather than a rendered message, so that
	// fixing one failure does not clear the indicator for another still standing,
	// and so a field typed back to its saved value stops being complained about.
	// The field itself carries the reason; the status line names the field.
	let failedFields = $state<StatusField[]>([]);

	/**
	 * Record the outcome of an attempt on `keys`, `failed` being the subset that
	 * did not save. `ok` is the status to show when nothing is left failing.
	 */
	function settle(keys: StatusField[], failed: StatusField[], ok: SaveStatus = 'saved') {
		failedFields = [...failedFields.filter((k) => !keys.includes(k)), ...failed];
		saveStatus = failedFields.length ? 'error' : ok;
	}

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
	const { form: formData, errors, validate } = form;

	async function save() {
		// Only the fields whose value actually changed since the last save.
		const changed = DEBOUNCED_FIELDS.filter((key) => $formData[key] !== saved[key]);
		if (changed.length === 0) return;

		const invalid = await invalidFields(changed);
		if (invalid.length) {
			settle(changed, invalid);
			return;
		}

		// A field with nowhere to write to is dropped rather than written to the
		// wrong place. Say so on the field itself: a bare "Couldn't save" cannot
		// distinguish a Campaign that has no Polis poll from one whose save the
		// backend refused.
		const attempts = changed.map((key) => ({ key, to: writerFor(key, $formData[key]) }));
		for (const a of attempts) if (typeof a.to === 'string') $errors[a.key] = [a.to];

		const dropped = attempts.filter((a) => typeof a.to === 'string').map((a) => a.key);
		const writes = attempts.filter(
			(a): a is { key: DebouncedField; to: () => Promise<unknown> } => typeof a.to === 'function'
		);
		if (writes.length === 0) {
			settle(changed, dropped);
			return;
		}

		saveStatus = 'saving';
		try {
			await Promise.all(writes.map((w) => w.to()));
			for (const w of writes) {
				saved[w.key] = $formData[w.key];
				$errors[w.key] = undefined;
			}
			settle(changed, dropped);
			await invalidate(`campaign:${page.params.slug}`);
		} catch (e) {
			console.error('Failed to save setup fields', e);
			const reason = describeApiFailure(e);
			for (const w of writes) $errors[w.key] = [`Could not save: ${reason}`];
			settle(changed, changed);
		}
	}

	/**
	 * The subset of `keys` whose current value fails the schema, with the errors
	 * written onto those fields.
	 *
	 * Deliberately per field rather than `validateForm`. These four fields save
	 * independently to four different destinations, so validating all of them to
	 * decide whether one may be written is wrong: a Campaign whose Polis step has
	 * no topic yet has an empty Key Question, and whole-form validation let that
	 * block a slug rename with an error rendered on a field the Host never
	 * touched.
	 */
	async function invalidFields(keys: readonly FormField[]) {
		const checked = await Promise.all(
			keys.map(async (key) => ({ key, errors: await validate(key, { update: 'errors' }) }))
		);
		return checked.filter((c) => c.errors?.length).map((c) => c.key);
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
		// Typed back to what is stored: nothing to write, and nothing left to
		// complain about either.
		if (next === saved.slug) {
			$errors.slug = undefined;
			settle(['slug'], [], 'idle');
			return;
		}

		if ((await invalidFields(['slug'])).length) {
			settle(['slug'], ['slug']);
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
			settle(['slug'], ['slug']);
			return;
		}

		saved.slug = next;
		$errors.slug = undefined;
		settle(['slug'], []);

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

	const statusLabel: Record<'saving' | 'saved', string> = {
		saving: 'Saving…',
		saved: 'Saved'
	};

	// `settle` never reports an error without at least one field, so the failure
	// always has a name to give.
	const statusText = $derived(
		saveStatus === 'idle'
			? ''
			: saveStatus === 'error'
				? `Couldn't save ${failedFields.map((k) => FIELD_LABELS[k]).join(' and ')}`
				: statusLabel[saveStatus]
	);
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

	// --- Place -----------------------------------------------------------------
	// A fourth destination, and the reason it sits outside the superform above:
	// a Place is not a Conversation field at all, it is `metadata.place`, written
	// through the same PatchConversationMetadata path as demographics and asks.
	//
	// The Host types a name; the slug is derived from it, never typed, because it
	// is a DNS label and the two must not drift. That does mean renaming a Place
	// moves its subdomain, which is why the resulting address is shown under the
	// field instead of being computed silently. The subdomain still has to exist
	// in the ingress for the new address to resolve (#351).
	let placeName = $state(untrack(() => data.campaign.place?.name ?? ''));
	let savedPlaceName = $state(untrack(() => data.campaign.place?.name ?? ''));
	let placeError = $state<string | null>(null);

	// Two different facts, and conflating them is a lie: the slug the Campaign is
	// *currently* served from is whatever was stored, which need not match what
	// this name derives to (the dev seed stores `dundee` for "Dundee, Scotland").
	// So the line under the field reports the stored slug until the name is
	// edited, and only then previews where saving would move it.
	const storedPlaceSlug = $derived(campaign.place?.slug ?? '');
	const nextPlaceSlug = $derived(placeFromName(placeName)?.slug ?? '');
	const placeMoves = $derived(
		placeName.trim() !== savedPlaceName && !!nextPlaceSlug && nextPlaceSlug !== storedPlaceSlug
	);

	async function savePlace() {
		const next = placeName.trim();
		if (next === savedPlaceName) return;

		// Clearing the field unpublishes the Campaign from its Place rather than
		// storing a blank one. civicos 404s a Campaign with no Place (ADR 0007),
		// so this is a real action, not a no-op.
		const place = next === '' ? null : placeFromName(next);
		if (next !== '' && !place) {
			placeError = 'The name needs at least one letter or number.';
			settle(['place'], ['place']);
			return;
		}

		// The poll and the Host go on the public payload alongside the Place, both
		// for the same reason: civicos reads them anonymously and the endpoints
		// that own them (the Polis step, `/organizations`) are 401 to it. Without
		// the poll a Campaign renders but sends its participants to whichever poll
		// `regions.ts` guesses from their zip.
		//
		// Neither is cleared when the Place is. Clearing a Place unpublishes the
		// Campaign from that subdomain; it does not stop it being served, because a
		// Campaign with no Place is served from the apex. Wiping these would break
		// a Campaign that is still perfectly reachable.
		const poll = campaign.pollIdentity;
		const org = campaign.hostName
			? { slug: toPlaceSlug(campaign.hostName), name: campaign.hostName }
			: null;

		placeError = null;
		saveStatus = 'saving';
		// Read before the write: `patchMetadata` invalidates, so `storedPlaceSlug`
		// is the *new* Place by the time the rescope runs, and stripping the new
		// suffix off would leave the old one in place (`ai-utah-oregon`).
		const previousPlaceSlug = storedPlaceSlug;
		try {
			await patchMetadata({ place, poll, org });
			savedPlaceName = next;
			await rescopeSlug(previousPlaceSlug, place?.slug ?? '');
			settle(['place'], []);
			// Not an error: the Place saved. But the Campaign cannot be served until
			// it has a Polis step, so say that here rather than let it 404 quietly.
			placeError = place && !poll ? 'Published, but this Campaign has no Polis poll yet.' : null;
		} catch (e) {
			console.error('Failed to save the place', e);
			placeError = `Could not save: ${describeApiFailure(e)}`;
			settle(['place'], ['place']);
		}
	}

	/**
	 * Keep the Conversation slug scoped to the Place it now runs in.
	 *
	 * A Campaign runs in many Places and each pair is its own Conversation, so
	 * those Conversations are slugged `<campaign>-<place>`: that is what lets
	 * `<place>.bloomproject.us/<campaign>` narrow to one of them (ADR 0007). The
	 * Host never types it. They name a Place, and the slug follows.
	 *
	 * The old Place's suffix is stripped before the new one is applied, so moving
	 * Utah to Oregon gives `ai-oregon` rather than `ai-utah-oregon`. Clearing the
	 * Place strips back to the bare Campaign slug.
	 *
	 * Legacy regions are exempt. Utah and Oregon predate this and their slugs are
	 * pinned in `regions.ts`; renaming one because someone edited its Place would
	 * move a live public URL.
	 */
	async function rescopeSlug(previousPlaceSlug: string, placeSlug: string) {
		if (campaign.isLegacyRegion) return;

		const current = saved.slug;
		const wanted = rescopedSlug(current, previousPlaceSlug, placeSlug);

		if (!wanted || wanted === current) return;
		if (RESERVED_ROUTE_SLUGS.includes(wanted as never)) return;

		await data.api.UpdateConversation(
			{ slug: wanted },
			{ params: { conversation_id: campaign.id } }
		);

		saved.slug = wanted;
		$formData.slug = wanted;

		// Same move as `saveSlug`: the rename can change the `/c/<slug>` segment
		// this page is open at, so follow it or a refresh 404s on the old one.
		const from = page.params.slug;
		const to = routeSlugFor({ id: campaign.id, slug: wanted });
		if (to !== from) {
			await goto(resolve('/c/[slug]/overview', { slug: to }), {
				replaceState: true,
				invalidateAll: true
			});
		} else {
			await invalidate('app:conversations');
		}
	}
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
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
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
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
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
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
	</Form.Field>
{/snippet}

{#snippet placeField()}
	<div class="flex min-h-9 flex-col gap-1.5">
		<input
			bind:value={placeName}
			onblur={savePlace}
			onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
			aria-label="Place"
			aria-invalid={placeError ? 'true' : undefined}
			placeholder="e.g. Dundee, Scotland"
			class="field-sizing-content min-w-40 rounded-[10px] border border-stone-300 bg-muted px-3 py-1.5 text-body font-semibold focus:border-primary focus:outline-none"
		/>
		{#if placeError}
			<p class="text-caption text-destructive">{placeError}</p>
		{:else if placeMoves}
			<p class="text-caption text-muted-foreground">
				Moves to {nextPlaceSlug}{baseDomain ? `.${baseDomain}` : ''}
			</p>
		{:else if storedPlaceSlug}
			<p class="text-caption text-muted-foreground">
				Served from {storedPlaceSlug}{baseDomain ? `.${baseDomain}` : ''}
			</p>
		{/if}
	</div>
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
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
	</Form.Field>
{/snippet}

<div class="flex-1 overflow-y-auto">
	<div class="flex flex-col gap-6 px-4 pb-8 md:px-8">
		<!-- Auto-save status -->
		<div class="min-h-4 self-end text-caption text-muted-foreground" aria-live="polite">
			{#if saveStatus !== 'idle'}
				<span class={saveStatus === 'error' ? 'text-destructive' : ''}>
					{statusText}
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
			{placeField}
		/>

		<!-- ===== Co-Hosts ===== -->
		<!-- Live co-hosts; "Add New…" opens the org picker and grants the
		     co-host role on this Conversation (#362). -->
		<CoHostsCard {cohosts} convId={data.convId} onAddNew={() => (addCohostsOpen = true)} />
		<AddCoHostsDialog
			bind:open={addCohostsOpen}
			pickerOrgs={data.pickerOrgs}
			excludeIds={data.excludeIds}
		>
			{#snippet footer({ selected })}
				<form
					method="POST"
					action="?/grantCohosts"
					use:enhance={() => {
						grantingCohosts = true;
						return async ({ update, result }) => {
							// The overview load declares `cohosts:${convId}`; refresh that rather
							// than letting update() invalidate every load on the page.
							await update({ invalidateAll: false });
							if (result.type === 'success') {
								await invalidate(`cohosts:${data.convId}`);
								addCohostsOpen = false;
							}
							grantingCohosts = false;
						};
					}}
				>
					<input type="hidden" name="convId" value={data.convId} />
					{#each selected as id (id)}
						<input type="hidden" name="orgIds" value={id} />
					{/each}
					<Button type="submit" disabled={selected.length === 0 || grantingCohosts}>
						{grantingCohosts
							? 'Adding…'
							: `Add ${selected.length || ''} co-host${selected.length === 1 ? '' : 's'}`}
					</Button>
				</form>
			{/snippet}
		</AddCoHostsDialog>

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
			<div
				class="flex flex-col items-start gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8"
			>
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
