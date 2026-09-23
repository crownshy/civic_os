<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance, invalidate } from '$lib/activity.svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import Card from '@civicos/shared/ui/Card.svelte';
	import { Button } from '@civicos/shared/ui/button';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import { Trash2 } from '@lucide/svelte';
	import IdentityCard from './IdentityCard.svelte';
	import CoHostsCard from './CoHostsCard.svelte';
	import AddCoHostsDialog from '$lib/components/setup/AddCoHostsDialog.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import FaqCard from '$lib/components/setup/FaqCard.svelte';
	import ParticipantAsksCard from '$lib/components/setup/ParticipantAsksCard.svelte';
	import { readColorScheme } from '@civicos/shared/data/color-scheme';
	import { readFaqs, toFaqsHtml, type FaqEntry } from '@civicos/shared/data/faq';
	import {
		readDemographicToggles,
		type CustomDemographicCategory
	} from '@civicos/shared/data/demographics';
	import { readAskToggles, type AskKey } from '@civicos/shared/data/participant-asks';
	import { placeFromName, rescopedSlug, toPlaceSlug } from '$lib/config/place';
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
	// Host portion of the public URL (strip protocol + any path). Empty when the
	// Campaign has no participant link, see `shareUrlBlocker`.
	const baseUrl = $derived(
		campaign.shareUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ?? ''
	);
	const places = $derived(campaign.place ? [campaign.place.name] : []);

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
			// Mirrored into `metadata.poll` as well: comhairle never reports the topic
			// back, so without the copy the field reloads empty and civicos never
			// sees the question.
			return async () => {
				await data.api.PolisUpdateConfig({ workflow_step_id: stepId, topic: content });
				const poll = campaign.pollIdentity;
				if (!poll) return;
				await data.api.PatchConversationMetadata(
					{ poll: { ...poll, question: content } },
					{ params: { conversation_id: campaign.id } }
				);
			};
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
	const enabledDemographics = $derived(readDemographicToggles(conversation?.metadata));
	const defaultDemographics = $derived(data.defaultDemographics);
	const customDemographics = $derived(data.customDemographics);

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

	async function addCustomDemographic(category: CustomDemographicCategory) {
		await data.api.CreateDemographicsQuestion({
			slug: category.slug,
			displayName: category.displayName,
			responseType: 'string',
			bucketConfig: {
				type: 'string',
				options: category.options.map((option) => ({ label: option, value: option }))
			}
		});
		await data.api.CreateConversationDemographics({
			conversationId: campaign.id,
			questionSlug: category.slug
		});
		await invalidate(`campaign:${page.params.slug}`);
	}

	async function editCustomDemographic(category: CustomDemographicCategory) {
		await data.api.UpdateDemographicsQuestion(
			{
				displayName: category.displayName,
				bucketConfig: {
					type: 'string',
					options: category.options.map((option) => ({ label: option, value: option }))
				}
			},
			{ params: { question_slug: category.slug } }
		);
		await invalidate(`campaign:${page.params.slug}`);
	}

	async function toggleCustomDemographic(slug: string, next: boolean) {
		if (next) {
			await data.api.CreateConversationDemographics({
				conversationId: campaign.id,
				questionSlug: slug
			});
		} else {
			await data.api.DeleteConversationDemographicsByQuestion(undefined, {
				params: { conversation_id: campaign.id, question_slug: slug }
			});
		}
		await invalidate(`campaign:${page.params.slug}`);
	}

	async function removeCustomDemographic(slug: string) {
		if (customDemographics.find((category) => category.slug === slug)?.enabled) {
			await data.api.DeleteConversationDemographicsByQuestion(undefined, {
				params: { conversation_id: campaign.id, question_slug: slug }
			});
		}
		await data.api.DeleteDemographicsQuestion(undefined, { params: { question_slug: slug } });
		await invalidate(`campaign:${page.params.slug}`);
	}

	// --- FAQ -------------------------------------------------------------------
	// A fifth destination. `Conversation.faqs` is a TextContentId reference like
	// title and description, not metadata and not a text column, so the list is
	// encoded as h2-per-question markup in that one field. The format lives in
	// `@civicos/shared/data/faq` because civicos parses what this writes.
	const faqs = $derived(readFaqs(conversation?.faqs));

	/**
	 * Write the whole list. Two calls the first time, one after that.
	 *
	 * `faqs` is nullable and an unset one has no TextContent at all, so there is
	 * nothing to translate against until one exists: `translations.faqs` comes
	 * back null and `data.textContent.faqs` with it. Hence create-then-link on
	 * the first save. `UpdateConversation` takes the TextContent *id* here, not
	 * prose, and 422s on a plain string the same way title and description do
	 * (#391), which is why the link step sends `created.id`.
	 */
	async function saveFaqs(next: FaqEntry[]) {
		const content = toFaqsHtml(next);
		const target = data.textContent.faqs;

		if (target) {
			await data.api.CreateOrUpdateTextTranslation(
				{ content },
				{ params: { text_content_id: target.id, locale: target.locale } }
			);
		} else {
			const created = await data.api.CreateTextContent({
				content,
				// The stored value is markup regardless of answers being plain text,
				// and `rich` is what `description` uses for the same reason.
				format: 'rich',
				primary_locale: conversation?.primaryLocale ?? 'en'
			});
			await data.api.UpdateConversation(
				{ faqs: created.id },
				{ params: { conversation_id: campaign.id } }
			);
		}

		await invalidate(`campaign:${page.params.slug}`);
	}

	// Same interim metadata storage as demographics, same whole-key write.
	const asks = $derived(readAskToggles(conversation?.metadata));

	// --- Color Scheme ----------------------------------------------------------
	// An id, not colours: the hexes live in the shared module (ADR 0012).
	const colorSchemeId = $derived(readColorScheme(conversation?.metadata)?.id ?? null);

	const selectColorScheme = (id: string) => patchMetadata({ colorScheme: id });

	const setAsk = (key: AskKey, next: boolean) =>
		patchMetadata({ participantAsks: { ...asks, [key]: next } });

	// --- Place -----------------------------------------------------------------
	// A fourth destination, and the reason it sits outside the superform above:
	// a Place is not a Conversation field at all, it is `metadata.place`, written
	// through the same PatchConversationMetadata path as demographics and asks.
	//
	// The Host types a name; the slug is derived from it, never typed, because it
	// is a URL segment and the two must not drift. That does mean renaming a Place
	// moves the Campaign to another Place page and rescopes its slug, which is why
	// the resulting address is shown under the field instead of being computed
	// silently (ADR 0011).
	let placeName = $state(untrack(() => data.campaign.place?.name ?? ''));
	let savedPlaceName = $state(untrack(() => data.campaign.place?.name ?? ''));
	let placeError = $state<string | null>(null);

	// Two different facts, and conflating them is a lie: the slug the Campaign is
	// *currently* listed under is whatever was stored, which need not match what
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
		// storing a blank one. It drops off that Place's page, and its slug loses
		// the Place suffix, so this is a real action, not a no-op.
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
	 * those Conversations are slugged `<campaign>-<place>`: that is what keeps
	 * `/<org>/conversations/ai-utah` and `.../ai-oregon` two addresses
	 * (ADR 0011). The Host never types it. They name a Place, and the slug
	 * follows. The slug is the public URL, so a link shared before a Place edit
	 * stops resolving after it.
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

	// --- Delete ----------------------------------------------------------------
	let deleteOpen = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	// Typing the slug is a guard, not form input: nothing is submitted, so this
	// stays plain state rather than a superform.
	let deleteConfirm = $state('');
	const deleteConfirmed = $derived(deleteConfirm.trim() === slug);

	async function deleteConversation() {
		if (deleting || !deleteConfirmed) return;
		deleting = true;
		deleteError = null;
		try {
			await data.api.DeleteConversation(undefined, {
				params: { conversation_id: campaign.id }
			});
			deleteOpen = false;
			// The root layout's permitted list feeds the sidebar and the dashboard,
			// and it survives this navigation, so it would still show the Campaign.
			await goto(resolve('/'), { invalidate: ['app:conversations'] });
		} catch (e) {
			console.error('DeleteConversation failed', e);
			deleteError = `Could not delete the conversation: ${describeApiFailure(e)}`;
			deleting = false;
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
				Will be listed at {baseUrl}/{nextPlaceSlug}
			</p>
		{:else if storedPlaceSlug}
			<p class="text-caption text-muted-foreground">
				Listed at {baseUrl}/{storedPlaceSlug}
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
			{colorSchemeId}
			onSelectColorScheme={selectColorScheme}
		/>

		<!-- ===== Co-Hosts ===== -->
		<!-- Live co-hosts; "Add New…" opens the org picker and grants the
		     co-host role on this Conversation (#362). -->
		<CoHostsCard
			{cohosts}
			convId={data.convId}
			owningOrgId={data.owningOrgId}
			onAddNew={() => (addCohostsOpen = true)}
		/>
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
					<input type="hidden" name="owningOrgId" value={data.owningOrgId ?? ''} />
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

		<!-- ===== Demographics ===== -->
		<DemographicsCard
			title="Demographics"
			subtitle="Participants will be shown these questions at the end of the Open Poll. You can turn on/off any questions, or add your own."
			defaults={defaultDemographics}
			onToggle={toggleCustomDemographic}
			custom={customDemographics}
			onToggleCustom={toggleCustomDemographic}
			onAddCustom={addCustomDemographic}
			onEditCustom={editCustomDemographic}
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

		<!-- ===== FAQ =====
		     Its own card rather than a section inside ContextCard: it writes to a
		     different Conversation field on its own schedule, while the fields in
		     that card share one debounced superform. -->
		<FaqCard
			title="FAQ"
			subtitle="Questions and answers shown on the Campaign homepage as an expandable list. Participants see them in the order set here."
			entries={faqs}
			onSave={saveFaqs}
		/>

		<!-- Danger zone: not in the Figma refresh. -->
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
				<Button
					size="sm"
					variant="destructive-outline"
					onclick={() => {
						deleteError = null;
						deleteConfirm = '';
						deleteOpen = true;
					}}
				>
					<Trash2 class="size-3.5" />
					delete conversation…
				</Button>
			</div>
		</Card>
	</div>
</div>

<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete "{title}"?</Dialog.Title>
			<Dialog.Description>
				This permanently removes the conversation and everything attached to it: its poll, events,
				and participant data. This cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-2">
			<Label for="delete-confirm" class="text-body">
				Type <span class="font-mono font-semibold">{slug}</span> to confirm.
			</Label>
			<Input
				id="delete-confirm"
				bind:value={deleteConfirm}
				autocomplete="off"
				spellcheck={false}
				disabled={deleting}
			/>
		</div>
		{#if deleteError}
			<p class="text-body text-destructive" role="alert">{deleteError}</p>
		{/if}
		<Dialog.Footer class="gap-2">
			<Button variant="secondary" onclick={() => (deleteOpen = false)} disabled={deleting}>
				cancel
			</Button>
			<Button
				variant="destructive"
				onclick={deleteConversation}
				disabled={deleting || !deleteConfirmed}
			>
				{deleting ? 'deleting…' : 'delete conversation'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
