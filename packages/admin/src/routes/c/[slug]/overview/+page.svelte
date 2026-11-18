<script lang="ts">
	import CharCount from '$lib/components/CharCount.svelte';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { untrack } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
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
	import AreasDialog from '$lib/components/place-selector/AreasDialog.svelte';
	import AreasPicker from './AreasPicker.svelte';
	import CoHostsCard from './CoHostsCard.svelte';
	import { noticeFrom } from './cohost-notice';
	import AddCoHostsDialog from '$lib/components/setup/AddCoHostsDialog.svelte';
	import DemographicsCard from '$lib/components/setup/DemographicsCard.svelte';
	import FaqCard from '$lib/components/setup/FaqCard.svelte';
	import ParticipantAsksCard from '$lib/components/setup/ParticipantAsksCard.svelte';
	import { readColorScheme } from '@civicos/shared/data/color-scheme';
	import { writeMetadata, type MetadataWrites } from '@civicos/shared/data/metadata';
	import { readFaqs, toFaqsHtml, type FaqEntry } from '@civicos/shared/data/faq';
	import type { CustomDemographicCategory } from '@civicos/shared/data/demographics';
	import {
		createCustomQuestion,
		editCustomQuestion,
		lockMessage,
		setQuestionEnabled
	} from '$lib/api/demographics';
	import {
		readAskToggles,
		type AskKey,
		type AskToggles
	} from '@civicos/shared/data/participant-asks';
	import { routeSlugFor, slugTakenMessage } from '$lib/conversations';
	import ContextCard from './ContextCard.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import { shortDescriptionFrom } from '$lib/utils/rich-text';
	import { blockHtmlToPlainText } from '@civicos/shared/rich-text';
	import { setupSchema } from './setup-schema';
	import { apiStatus, describeApiFailure, permissionDenied } from '$lib/api/describe-failure';

	let { data } = $props();

	const campaign = $derived(data.campaign);
	const conversation = $derived(data.conversation);

	const title = $derived(campaign.title);
	const description = $derived(conversation?.description ?? '');
	const thankYouMessage = $derived(conversation?.thankYouMessage ?? '');
	const slug = $derived(conversation?.slug ?? campaign.slug);
	// Host portion of the public URL (strip protocol + any path). Empty when the
	// Campaign has no participant link, see `shareUrlBlocker`.
	const baseUrl = $derived(
		campaign.shareUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') ?? ''
	);
	const areaNames = $derived(campaign.areas.map((area) => area.name));
	let areasOpen = $state(false);

	// Live co-hosts: the owning host (Admin badge) plus organizations granted the
	// co-host role on this Conversation. Resolved server-side in +page.server.ts
	// (ListResourcePermissions -> GetOrganization). Replaces the old static
	// static region.partners list. Added via the AddCoHostsDialog below (#362).
	const cohosts = $derived(data.cohosts);
	let addCohostsOpen = $state(false);
	let grantingCohosts = $state(false);
	// Seeded from Create Campaign, which cannot show this itself: it redirects
	// here the moment the Campaign exists.
	let cohostNotice = $state<string | null>(
		untrack(() => page.url.searchParams.get('cohosts')) === 'failed'
			? 'Not every co-host could be added when this Campaign was created. Check the list and add any that are missing.'
			: null
	);
	const orgName = (id: string) => data.pickerOrgs.find((o) => o.id === id)?.name ?? '';

	// --- Editable fields -------------------------------------------------------
	// One SPA superform, three destinations, because no two of these fields live
	// in the same place on the backend:
	//
	//   title, description, TextContentId (UUID) references, not text columns, so
	//   thankYouMessage     edits go through CreateOrUpdateTextTranslation against
	//                       each field's text_content_id in the conversation's
	//                       primary_locale (resolved in +layout.server.ts as
	//                       data.textContent). UpdateConversation 422s on plain
	//                       strings here. See #391. thankYouMessage is nullable,
	//                       so its first save creates the record.
	//   keyQuestion         the `topic` of the Polis conversation behind this
	//                       Campaign's Polis workflow step, via PolisUpdateConfig.
	//   slug                a real Conversation column, via UpdateConversation.
	//
	// The first three auto-save on a debounce and only write the fields that
	// actually changed, then a scoped invalidate refreshes the public-facing
	// strings. Slug is the exception and commits on blur; see `saveSlug`.
	type DebouncedField = 'title' | 'description' | 'thankYouMessage' | 'keyQuestion';
	const DEBOUNCED_FIELDS = ['title', 'description', 'thankYouMessage', 'keyQuestion'] as const;
	type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
	type FormField = DebouncedField | 'slug';
	let saveStatus = $state<SaveStatus>('idle');
	let debounce: ReturnType<typeof setTimeout> | undefined;

	const FIELD_LABELS: Record<FormField, string> = {
		title: 'Title',
		description: 'Description',
		thankYouMessage: 'What Happens Next',
		keyQuestion: 'Key Question',
		slug: 'Slug'
	};

	// Which fields are currently unsaved, rather than a rendered message, so that
	// fixing one failure does not clear the indicator for another still standing,
	// and so a field typed back to its saved value stops being complained about.
	// The field itself carries the reason; the status line names the field.
	let failedFields = $state<FormField[]>([]);

	/**
	 * Record the outcome of an attempt on `keys`, `failed` being the subset that
	 * did not save. `ok` is the status to show when nothing is left failing.
	 */
	function settle(keys: FormField[], failed: FormField[], ok: SaveStatus = 'saved') {
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
		thankYouMessage: data.conversation?.thankYouMessage ?? '',
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
			// A standing failure stays on screen until a save clears it, not until
			// the next keystroke.
			if (!failedFields.length) saveStatus = 'idle';
			debounce = setTimeout(flush, 700);
		}
	});
	const { form: formData, errors, validate } = form;

	// Saves run one at a time. Two overlapping writes to the same translation can
	// land out of order, and the older text wins.
	let queue: Promise<void> = Promise.resolve();

	/** Run a pending debounced save now, behind any save already in flight. */
	function flush() {
		clearTimeout(debounce);
		debounce = undefined;
		// A throw that escapes `save` must not wedge every later save behind it.
		queue = queue.then(save).catch((e) => {
			console.error('Autosave failed', e);
			saveStatus = 'error';
		});
		return queue;
	}

	const hasUnsaved = () => DEBOUNCED_FIELDS.some((key) => $formData[key] !== saved[key]);

	// Closing the tab cannot wait for a request, so ask first. An in-app
	// navigation can: the queued save carries its own values and slug.
	beforeNavigate(({ willUnload, cancel }) => {
		if (willUnload) {
			if (debounce !== undefined || saveStatus === 'saving') cancel();
			return;
		}
		if (debounce !== undefined) flush();
	});

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
		// Snapshot what is sent. The Host can keep typing while the request is out,
		// and recording the live value as saved would drop that newer text.
		// What is written is trimmed; the field keeps what was typed, so a space at
		// the end of a half-typed title survives the autosave (#458).
		const attempts = changed.map((key) => {
			const value = $formData[key];
			const content = key === 'title' || key === 'keyQuestion' ? value.trim() : value;
			return { key, value, to: writerFor(key, content) };
		});
		for (const a of attempts) if (typeof a.to === 'string') $errors[a.key] = [a.to];

		const dropped = attempts.filter((a) => typeof a.to === 'string').map((a) => a.key);
		const writes = attempts.filter(
			(a): a is { key: DebouncedField; value: string; to: () => Promise<unknown> } =>
				typeof a.to === 'function'
		);
		if (writes.length === 0) {
			settle(changed, dropped);
			return;
		}

		// Read now: a save flushed by navigation finishes after `page` has moved on.
		const campaignSlug = page.params.slug;
		saveStatus = 'saving';
		try {
			await Promise.all(writes.map((w) => w.to()));
			for (const w of writes) {
				saved[w.key] = w.value;
				$errors[w.key] = undefined;
			}
			// Text typed during the request is not saved yet; its own debounce is.
			settle(changed, dropped, hasUnsaved() ? 'idle' : 'saved');
			await invalidate(`campaign:${campaignSlug}`);
			// The sidebar lists Campaigns by title from the root layout (#459).
			if (writes.some((w) => w.key === 'title')) await invalidate('app:conversations');
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
				await writeMetadata(data.api, campaign.id, { poll: { ...poll, question: content } });
			};
		}

		// Nullable, so there may be no record yet and the write has to make one.
		if (key === 'thankYouMessage') return () => writeTextContent('thankYouMessage', content);

		// Missing on a non-admin session, or when the conversation didn't resolve
		// against this backend.
		const target = data.textContent[key];
		if (!target) return `No translation record for "${key}" on this Campaign.`;
		const write = () =>
			data.api.CreateOrUpdateTextTranslation(
				{ content },
				{ params: { text_content_id: target.id, locale: target.locale } }
			);
		if (key !== 'description') return write;

		// The directory and Place cards print `shortDescription`, which was only
		// ever written at creation, so edits here never reached them (#444). It
		// follows the description's lead. Best effort: the description itself
		// saved, and a stale card is no reason to report that it did not.
		return async () => {
			await write();
			const short = data.textContent.shortDescription;
			if (!short) return;
			await data.api
				.CreateOrUpdateTextTranslation(
					{ content: shortDescriptionFrom(content) },
					{ params: { text_content_id: short.id, locale: short.locale } }
				)
				.catch((e) => console.warn('Could not update the short description', e));
		};
	}

	/**
	 * What each nullable text field is called in the `UpdateConversation` body,
	 * which is snake_case even though the Conversation reads back camelCase.
	 */
	const LINK_KEYS = {
		faqs: 'faqs',
		thankYouMessage: 'thank_you_message'
	} as const;

	/**
	 * Write one of the nullable TextContent fields, creating the record on the
	 * first save.
	 *
	 * `faqs` and `thankYouMessage` are nullable on the Conversation, and an unset
	 * one has no TextContent at all rather than an empty one, so
	 * `translations.X` comes back null and `data.textContent.X` with it. Hence
	 * create-then-link. `UpdateConversation` takes the TextContent *id* here, not
	 * prose, and 422s on a plain string the same way title and description do
	 * (#391), which is why the link step sends `created.id`.
	 *
	 * The link step keys by `LINK_KEYS`, not by the field name. That request's
	 * body is snake_case while the Conversation it comes back on is camelCase,
	 * and `faqs` is the one field spelled the same either way, so sending the
	 * field name worked for `faqs` and 422'd for `thankYouMessage`.
	 */
	async function writeTextContent(field: 'faqs' | 'thankYouMessage', content: string) {
		const target = data.textContent[field];
		if (target) {
			await data.api.CreateOrUpdateTextTranslation(
				{ content },
				{ params: { text_content_id: target.id, locale: target.locale } }
			);
			return;
		}

		const created = await data.api.CreateTextContent({
			content,
			// The stored value is markup regardless of the answers being plain text,
			// and `rich` is what `description` uses for the same reason.
			format: 'rich',
			primary_locale: conversation?.primaryLocale ?? 'en'
		});
		await data.api.UpdateConversation(
			{ [LINK_KEYS[field]]: created.id },
			{ params: { conversation_id: campaign.id } }
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
			// Slugs are unique across every Conversation, including the ones this
			// Host cannot see, so a 409 is a name clash and not a permission problem.
			$errors.slug =
				apiStatus(e) === 409
					? [slugTakenMessage(next)]
					: [`Could not save the slug: ${describeApiFailure(e)}`];
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
	const demographics = $derived(data.campaignDemographics);

	/**
	 * INTERIM STORAGE (#363/#364). Participant asks, the colour scheme and the
	 * areas have no backend fields yet, so they live in `conversation.metadata`
	 * until comhairle promotes them. Demographics live on the Campaign's
	 * demographics form (ADR 0020).
	 *
	 * `writeMetadata` owns how each key merges.
	 */
	async function patchMetadata(writes: MetadataWrites) {
		await writeMetadata(data.api, campaign.id, writes);
		await invalidate(`campaign:${page.params.slug}`);
	}

	/** Where demographics writes go. The card is read-only whenever this is missing. */
	function demographicsTarget() {
		if (!data.demographicsTarget) throw new Error('This Campaign cannot change its questions.');
		return data.demographicsTarget;
	}

	async function addCustomDemographic(category: CustomDemographicCategory) {
		await createCustomQuestion(data.api, demographicsTarget(), category);
		await invalidate(`campaign:${page.params.slug}`);
	}

	async function editCustomDemographic(category: CustomDemographicCategory) {
		await editCustomQuestion(data.api, demographicsTarget(), category);
		await invalidate(`campaign:${page.params.slug}`);
	}

	async function toggleDemographic(id: string, next: boolean) {
		await setQuestionEnabled(data.api, demographicsTarget(), id, next);
		await invalidate(`campaign:${page.params.slug}`);
	}

	// Removing takes the question off this Campaign only. It stays in the Host's
	// question bank, where other Campaigns may still be asking it.
	async function removeCustomDemographic(id: string) {
		await toggleDemographic(id, false);
	}

	// --- FAQ -------------------------------------------------------------------
	// A fifth destination. `Conversation.faqs` is a TextContentId reference like
	// title and description, not metadata and not a text column, so the list is
	// encoded as h2-per-question markup in that one field. The format lives in
	// `@civicos/shared/data/faq` because civicos parses what this writes.
	const faqs = $derived(readFaqs(conversation?.faqs));

	/** Write the whole list, as one h2-per-question blob. */
	async function saveFaqs(next: FaqEntry[]) {
		await writeTextContent('faqs', toFaqsHtml(next));
		await invalidate(`campaign:${page.params.slug}`);
	}

	// Same interim metadata storage as the colour scheme, same whole-key write.
	const asks = $derived(readAskToggles(conversation?.metadata));

	// --- Color Scheme ----------------------------------------------------------
	// An id, not colours: the hexes live in the shared module (ADR 0012).
	const colorSchemeId = $derived(readColorScheme(conversation?.metadata)?.id ?? null);

	const selectColorScheme = (id: string) => patchMetadata({ colorScheme: id });

	// Built from the last object sent, not from `asks`, which only catches up after
	// the invalidate: a second toggle inside that window sent a stale object and
	// undid the first. Queued so the writes land in the order they were made.
	let sentAsks: AskToggles | null = null;
	let asksQueue: Promise<void> = Promise.resolve();

	function setAsk(key: AskKey, next: boolean) {
		const all = { ...(sentAsks ?? asks), [key]: next };
		sentAsks = all;
		const write = asksQueue.then(() => patchMetadata({ participantAsks: all }));
		asksQueue = write
			.catch(() => {})
			.then(() => {
				if (sentAsks === all) sentAsks = null;
			});
		return write;
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
			deleteError =
				permissionDenied(e, 'delete this Campaign') ??
				`Could not delete the conversation: ${describeApiFailure(e)}`;
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
					maxlength={TEXT_LIMITS.campaignTitle}
					class="font-display w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body-lg font-semibold focus:border-primary focus:outline-none"
				/>
			{/snippet}
		</Form.Control>
		<CharCount count={$formData.title.length} limit={TEXT_LIMITS.campaignTitle} class="mt-1" />
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
					maxlength={TEXT_LIMITS.keyQuestion}
					rows="2"
					class="field-sizing-content w-full resize-none rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
				></textarea>
			{/snippet}
		</Form.Control>
		<CharCount count={$formData.keyQuestion.length} limit={TEXT_LIMITS.keyQuestion} class="mt-1" />
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
	</Form.Field>
{/snippet}

{#snippet areasField()}
	<div class="flex min-h-9 flex-wrap items-center gap-2">
		{#each campaign.areas as area (area.geoid)}
			<span class="rounded-[10px] bg-primary/5 px-2.5 py-1.5 text-caption font-medium text-primary">
				{area.name}
			</span>
		{:else}
			<span class="text-body text-muted-foreground">No areas picked yet</span>
		{/each}
		<Button variant="link" size="sm" class="h-auto p-0" onclick={() => (areasOpen = true)}>
			{areaNames.length ? 'Edit areas' : 'Pick areas'}
		</Button>
	</div>
{/snippet}

{#snippet thankYouMessageField()}
	<Form.Field {form} name="thankYouMessage">
		<Form.Control>
			{#snippet children({ props })}
				<RichTextEditor
					value={$formData.thankYouMessage}
					onChange={(html) => ($formData.thankYouMessage = html)}
					attributes={{
						id: props.id,
						'aria-describedby': props['aria-describedby'],
						'aria-invalid': props['aria-invalid'],
						'aria-required': props['aria-required']
					}}
				/>
			{/snippet}
		</Form.Control>
		<CharCount
			count={blockHtmlToPlainText($formData.thankYouMessage).length}
			limit={TEXT_LIMITS.thankYouMessage}
			class="mt-1"
		/>
		<Form.FieldErrors class="mt-1 text-caption text-destructive" />
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
		<CharCount
			count={blockHtmlToPlainText($formData.description).length}
			limit={TEXT_LIMITS.description}
			class="mt-1"
		/>
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
			areas={areaNames}
			{titleField}
			{slugField}
			{keyQuestionField}
			{areasField}
			{colorSchemeId}
			onSelectColorScheme={selectColorScheme}
		/>

		<!-- Where the Campaign runs (#514), opened from the Identity card. -->
		<AreasDialog bind:open={areasOpen}>
			<AreasPicker areas={campaign.areas} onSave={(areas) => patchMetadata({ areas })} />
		</AreasDialog>

		<!-- ===== Co-Hosts ===== -->
		<!-- Live co-hosts; "Add New…" opens the org picker and grants the
		     co-host role on this Conversation (#362). -->
		<CoHostsCard
			{cohosts}
			convId={data.convId}
			owningOrgId={data.owningOrgId}
			onAddNew={() => {
				cohostNotice = null;
				addCohostsOpen = true;
			}}
			notice={cohostNotice}
			onNotice={(text) => (cohostNotice = text)}
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
							cohostNotice = noticeFrom(result);
							// A partial failure still granted some, so the list has changed too.
							const changed =
								result.type === 'success' ||
								(result.type === 'failure' && result.data?.changed === true);
							if (changed) await invalidate(`cohosts:${data.convId}`);
							if (result.type === 'success') addCohostsOpen = false;
							grantingCohosts = false;
						};
					}}
				>
					<input type="hidden" name="convId" value={data.convId} />
					<input type="hidden" name="owningOrgId" value={data.owningOrgId ?? ''} />
					{#each selected as id (id)}
						<input type="hidden" name="orgIds" value={id} />
						<input type="hidden" name="orgNames" value={orgName(id)} />
					{/each}
					{#if cohostNotice && addCohostsOpen}
						<p class="mb-2 text-caption text-destructive" role="alert">{cohostNotice}</p>
					{/if}
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
			defaults={demographics.defaults}
			custom={demographics.custom}
			locked={lockMessage(demographics.lock)}
			live={campaign.pollLaunched === true}
			onToggle={toggleDemographic}
			onToggleCustom={toggleDemographic}
			onAddCustom={addCustomDemographic}
			onEditCustom={editCustomDemographic}
			onRemoveCustom={removeCustomDemographic}
		/>

		<!-- ===== Participant Asks =====
		     One switch per ask, governing both surfaces civicos shows it on: the
		     mid-poll checkpoint screen and the end-page CTA card. They already
		     share a completion flag per ask, so they are one ask shown twice.
		     Stored in conversation.metadata, and obeyed by civicos since #426. -->
		<ParticipantAsksCard
			title="Participant Asks"
			subtitle="What we ask participants for besides their votes. Each one shows up while they vote and again on the thank-you page. Turn off any you don't want to ask for."
			toggles={asks}
			onToggle={setAsk}
		/>

		<!-- ===== Context for Participants ===== -->
		<ContextCard {description} {descriptionField} {thankYouMessage} {thankYouMessageField} />

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
		{#if data.canDelete}
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
		{/if}
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
