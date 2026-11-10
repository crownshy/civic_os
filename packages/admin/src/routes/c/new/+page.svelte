<script lang="ts">
	import CharCount from '$lib/components/CharCount.svelte';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { tick, untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { cn } from '@civicos/shared/utils';
	import { ArrowLeft, AlertCircle, ChevronDown, Plus, X } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import AddCoHostsDialog from '$lib/components/setup/AddCoHostsDialog.svelte';
	import { placeFromName, rescopedSlug } from '$lib/config/place';
	import PlaceSelector from '$lib/components/place-selector/PlaceSelector.svelte';
	import AreasDialog from '$lib/components/place-selector/AreasDialog.svelte';
	import { areasForIds, placeIdOf } from '$lib/components/place-selector/campaign-areas';
	import {
		createPlaceGeometrySource,
		createPlaceSource
	} from '$lib/components/place-selector/sources';
	import {
		createConversationSchema,
		type CreateConversationMessage
	} from './create-conversation-schema';

	let { data } = $props();

	// Seeded once from the initial load data; untrack makes that intentional
	// one-time read explicit (same pattern as Create Host and Setup).
	let errorBanner = $state<HTMLElement>();

	const form = superForm(
		untrack(() => data.form),
		{
			dataType: 'json',
			validators: zod4Client(createConversationSchema),
			resetForm: false,
			// superforms scrolls to a field error itself, but a failure with no field
			// to point at only shows the banner at the top, out of sight once the
			// Host has scrolled down to the Create button.
			async onUpdated({ form }) {
				const failed = (form.message as CreateConversationMessage | undefined)?.kind === 'error';
				if (!failed || Object.keys(form.errors).length > 0) return;
				await tick();
				errorBanner?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	);
	const { form: formData, enhance, submitting, message } = form;

	const msg = $derived($message as CreateConversationMessage | undefined);

	// The slug follows the title until it is edited by hand. Done on input rather
	// than in an effect: it is a one-way default, not state to keep in sync.
	let slugEdited = $state(false);

	const toSlug = (value: string) =>
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');

	function onTitleInput() {
		if (!slugEdited) $formData.slug = toSlug($formData.title);
	}

	// The slug the typed Place becomes, shown so the Host can see what
	// "Dundee, Scotland" turns into before they commit to it. The action derives
	// the same slug; this only previews it.
	const placeSlug = $derived(placeFromName($formData.placeName)?.slug ?? '');

	const placeSource = createPlaceSource();
	const placeGeometrySource = createPlaceGeometrySource();
	// Names resolve asynchronously, so a slow lookup must not overwrite a newer pick.
	let areasRequest = 0;
	async function onAreasChange(ids: string[]) {
		const request = ++areasRequest;
		const areas = await areasForIds(placeSource, ids);
		if (request === areasRequest) $formData.areas = areas;
	}

	let areasOpen = $state(false);
	const areaNames = $derived($formData.areas.map((area) => area.name).join(', '));

	let cohostPickerOpen = $state(false);

	const orgById = $derived(new Map(data.pickerOrgs.map((o) => [o.id, o])));
	// Filtered rather than pruned on change: switching the owner to a Host that was
	// picked as a co-host should not silently rewrite the selection, and the action
	// drops the duplicate before granting.
	const selectedCohosts = $derived(
		$formData.cohostIds
			.filter((id) => id !== $formData.hostId)
			.map((id) => ({ id, name: orgById.get(id)?.name ?? id }))
	);

	// The owning Host cannot also be a co-host, so it drops out of the picker and
	// out of the selection if it is switched to a Host already picked.
	const excludeIds = $derived($formData.hostId ? [$formData.hostId] : []);

	function commitCohosts(ids: string[]) {
		$formData.cohostIds = ids.filter((id) => id !== $formData.hostId);
		cohostPickerOpen = false;
	}

	function removeCohost(id: string) {
		$formData.cohostIds = $formData.cohostIds.filter((c) => c !== id);
	}

	// The address the Conversation will open at once the action scopes the slug
	// to the Place. Previewed so the Host sees the `-<place>` suffix before it
	// appears on its own.
	const conversationUrl = $derived(
		$formData.slug ? `${data.baseDomain}/${rescopedSlug($formData.slug, '', placeSlug)}` : ''
	);

	const inputClass =
		'w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2.5 text-body focus:border-primary focus:outline-none';
	const helpClass = 'text-caption text-muted-foreground';
	const errorClass = 'text-caption text-destructive';
	const sectionHeadingClass = 'text-lg font-medium md:text-h4';
</script>

<!-- Label with its counter on the same line, so the count reads as part of the
     field it counts. Hidden while empty: an empty field has nothing to count. -->
{#snippet fieldLabel(text: string, count?: number, limit?: number, optional = false)}
	<div class="flex items-baseline justify-between gap-3">
		<Form.Label class="text-body font-medium">
			{text}
			{#if optional}<span class="font-normal text-muted-foreground">(optional)</span>{/if}
		</Form.Label>
		{#if limit !== undefined && count}
			<CharCount {count} {limit} />
		{/if}
	</div>
{/snippet}

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-2xl px-6 pt-6 sm:px-8 sm:pt-8">
		<a
			href={resolve('/')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Conversations
		</a>

		<h1 class="mb-1 text-h3 font-bold">New Conversation</h1>
		<p class="mb-8 text-body text-muted-foreground">
			Creates a draft conversation. Nobody can see it until you make it live.
		</p>

		{#if data.hosts.length === 0}
			<div
				class="mb-8 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
			>
				<AlertCircle class="size-4 shrink-0 translate-y-1" />
				<span>
					{#if data.hostsError}
						Could not load the Hosts you can create a conversation for: {data.hostsError}
					{:else if data.isSuper}
						There are no Hosts yet, and a conversation needs one to own it.
						<a href={resolve('/hosts/new')} class="font-semibold underline">Create a Host</a> first.
					{:else}
						You are not a member of any Host, and a conversation needs one to own it. Ask an admin
						to add you to a Host first.
					{/if}
				</span>
			</div>
		{:else}
			{#if msg?.kind === 'error'}
				<div
					bind:this={errorBanner}
					role="alert"
					class="mb-6 flex scroll-mt-6 items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
				>
					<AlertCircle class="size-4 shrink-0" />
					<span>{msg.text}</span>
				</div>
			{/if}

			<form method="POST" use:enhance novalidate class="flex flex-col">
				<section class="flex flex-col gap-6" aria-labelledby="section-conversation">
					<h2 id="section-conversation" class={sectionHeadingClass}>The conversation</h2>

					<Form.Field {form} name="title" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel('Title', $formData.title.length, TEXT_LIMITS.campaignTitle)}
								<input
									{...props}
									bind:value={$formData.title}
									maxlength={TEXT_LIMITS.campaignTitle}
									oninput={onTitleInput}
									placeholder="e.g. Dogs in Bushrod Park"
									class={inputClass}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
					</Form.Field>

					<Form.Field {form} name="keyQuestion" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel(
									'Key question',
									$formData.keyQuestion.length,
									TEXT_LIMITS.keyQuestion
								)}
								<p class={helpClass}>
									What participants are asked to deliberate on. This becomes the Polis topic.
								</p>
								<textarea
									{...props}
									bind:value={$formData.keyQuestion}
									maxlength={TEXT_LIMITS.keyQuestion}
									rows="2"
									placeholder="e.g. Should dogs be allowed off-lead in Bushrod Park?"
									class={inputClass}
								></textarea>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
					</Form.Field>

					<Form.Field {form} name="description" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel(
									'Description',
									$formData.description.length,
									TEXT_LIMITS.description,
									true
								)}
								<p class={helpClass}>Shown on the conversation's homepage. You can add it later.</p>
								<textarea
									{...props}
									bind:value={$formData.description}
									maxlength={TEXT_LIMITS.description}
									rows="4"
									class={inputClass}
								></textarea>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
					</Form.Field>
				</section>

				<section
					class="mt-10 flex flex-col gap-6 border-t border-border pt-8"
					aria-labelledby="section-place"
				>
					<h2 id="section-place" class={sectionHeadingClass}>Where it runs</h2>

					<Form.Field {form} name="placeName" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel(
									'Place',
									$formData.placeName.length,
									TEXT_LIMITS.placeName,
									true
								)}
								<p class={helpClass}>
									The conversation is listed on this Place's page. You can change it later.
								</p>
								<input
									{...props}
									bind:value={$formData.placeName}
									maxlength={TEXT_LIMITS.placeName}
									placeholder="e.g. Dundee, Scotland"
									class={inputClass}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
						{#if placeSlug}
							<p class={helpClass}>Listed at {data.baseDomain}/{placeSlug}</p>
						{/if}
						<div class="flex flex-wrap items-center gap-x-2 text-caption">
							<span class={areaNames ? 'text-foreground' : 'text-muted-foreground'}>
								{areaNames ? `Covers ${areaNames}` : 'No areas picked yet'}
							</span>
							<Button
								variant="link"
								size="sm"
								class="h-auto p-0 text-caption"
								onclick={() => (areasOpen = true)}
							>
								{areaNames ? 'Edit areas' : 'Pick areas'}
							</Button>
						</div>
					</Form.Field>

					<AreasDialog bind:open={areasOpen} placeName={$formData.placeName}>
						<PlaceSelector
							source={placeSource}
							geometrySource={placeGeometrySource}
							selectedIds={$formData.areas.map(placeIdOf)}
							onchange={onAreasChange}
						/>
					</AreasDialog>

					<Form.Field {form} name="slug" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel('Slug')}
								<p class={helpClass}>
									Filled in from the title. The last part of the conversation's URL.
								</p>
								<input
									{...props}
									bind:value={$formData.slug}
									oninput={() => (slugEdited = true)}
									spellcheck="false"
									autocapitalize="off"
									autocorrect="off"
									class={inputClass}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
						{#if conversationUrl}
							<p class={cn(helpClass, 'break-all')}>Opens at {conversationUrl}</p>
						{/if}
					</Form.Field>
				</section>

				<section
					class="mt-10 flex flex-col gap-6 border-t border-border pt-8"
					aria-labelledby="section-hosts"
				>
					<h2 id="section-hosts" class={sectionHeadingClass}>Who runs it</h2>

					<Form.Field {form} name="hostId" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel('Host')}
								<p class={helpClass}>
									The organization that owns this conversation. Change it if you are creating it for
									another Host.
								</p>
								{#if data.hosts.length > 1}
									<div class="relative">
										<select
											{...props}
											bind:value={$formData.hostId}
											class={cn(inputClass, 'appearance-none pr-10')}
										>
											{#each data.hosts as host (host.id)}
												<option value={host.id}>{host.name}</option>
											{/each}
										</select>
										<ChevronDown
											class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
										/>
									</div>
								{:else}
									<!-- One Host to choose from: it is already the value, so show it
									     rather than a select with a single option. -->
									<p class="text-body font-medium">{data.hosts[0].name}</p>
									<input {...props} type="hidden" bind:value={$formData.hostId} />
								{/if}
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
					</Form.Field>

					<Form.Field {form} name="cohostIds" class="space-y-1.5">
						<Form.Control>
							{#snippet children({ props })}
								{@render fieldLabel('Co-hosts', undefined, undefined, true)}
								<p class={helpClass}>
									Other organizations stewarding this conversation with you. They can see and edit
									it.
								</p>
								<div {...props} class="flex flex-wrap items-center gap-2">
									{#each selectedCohosts as host (host.id)}
										<span
											class="inline-flex items-center gap-1.5 rounded-full border border-stone-300 py-1 pr-2 pl-3 text-body"
										>
											{host.name}
											<button
												type="button"
												onclick={() => removeCohost(host.id)}
												aria-label={`Remove ${host.name}`}
												class="touch-manipulation rounded-full p-0.5 text-muted-foreground transition-all hover:text-destructive active:scale-90 active:text-destructive/70 active:duration-0"
											>
												<X class="size-3.5" />
											</button>
										</span>
									{/each}
									<Button
										type="button"
										variant="link"
										size="sm"
										class="h-auto gap-1 p-0 text-caption"
										onclick={() => (cohostPickerOpen = true)}
									>
										<Plus class="size-3.5" />
										{selectedCohosts.length === 0 ? 'Add co-hosts' : 'Edit co-hosts'}
									</Button>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class={errorClass} />
					</Form.Field>

					<AddCoHostsDialog
						bind:open={cohostPickerOpen}
						pickerOrgs={data.pickerOrgs}
						{excludeIds}
						initialSelected={$formData.cohostIds}
					>
						{#snippet footer({ selected })}
							<Button type="button" onclick={() => commitCohosts(selected)}>
								{selected.length
									? `Add ${selected.length} co-host${selected.length === 1 ? '' : 's'}`
									: 'Done'}
							</Button>
						{/snippet}
					</AddCoHostsDialog>
				</section>

				<!-- Pinned to the bottom of the scroll region, and as wide as the form
				     column so its divider lines up with the fields above. -->
				<div
					class="sticky bottom-0 mt-10 flex items-center gap-3 border-t border-border bg-background py-4"
				>
					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Creating…' : 'Create Conversation'}
					</Button>
					<Button href={resolve('/')} variant="outline" type="button">Cancel</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
