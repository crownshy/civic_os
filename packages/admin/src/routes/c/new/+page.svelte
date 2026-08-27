<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowLeft, AlertCircle } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import {
		createConversationSchema,
		type CreateConversationMessage
	} from './create-conversation-schema';

	let { data } = $props();

	// Seeded once from the initial load data; untrack makes that intentional
	// one-time read explicit (same pattern as Create Host and Setup).
	const form = superForm(
		untrack(() => data.form),
		{
			dataType: 'json',
			validators: zod4Client(createConversationSchema),
			resetForm: false
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

	const inputClass =
		'w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2.5 text-body focus:border-primary focus:outline-none';
	const labelClass = 'text-label font-semibold tracking-wider text-muted-foreground uppercase';
</script>

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-3xl p-6 sm:p-8">
		<a
			href={resolve('/')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Conversations
		</a>

		<h1 class="mb-1 text-h3 font-bold">New Conversation</h1>
		<p class="mb-8 text-body text-muted-foreground">
			This creates the Polis poll too, so the conversation is ready to set up. It stays a draft
			until you make it live.
		</p>

		{#if data.hosts.length === 0}
			<div
				class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
			>
				<AlertCircle class="size-4 shrink-0 translate-y-1" />
				<span>
					You are not a member of any Host, and a conversation needs one to own it. Ask an admin to
					add you to a Host first.
				</span>
			</div>
		{:else}
			{#if msg?.kind === 'error'}
				<div
					class="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
				>
					<AlertCircle class="size-4 shrink-0" />
					<span>{msg.text}</span>
				</div>
			{/if}

			<form method="POST" use:enhance class="flex flex-col gap-6">
				<Form.Field {form} name="title">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class={labelClass}>Title</Form.Label>
							<input
								{...props}
								bind:value={$formData.title}
								oninput={onTitleInput}
								class={inputClass}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>

				<Form.Field {form} name="slug">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class={labelClass}>Slug</Form.Label>
							<p class="mb-1 text-caption text-muted-foreground">
								The last part of the conversation's URL. You can change it later.
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
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>

				<Form.Field {form} name="keyQuestion">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class={labelClass}>Key question</Form.Label>
							<p class="mb-1 text-caption text-muted-foreground">
								What participants are asked to deliberate on. This becomes the Polis conversation's
								topic.
							</p>
							<textarea {...props} bind:value={$formData.keyQuestion} rows="2" class={inputClass}
							></textarea>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>

				{#if data.hosts.length > 1}
					<Form.Field {form} name="hostId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class={labelClass}>Host</Form.Label>
								<p class="mb-1 text-caption text-muted-foreground">
									The organization that owns this conversation.
								</p>
								<select {...props} bind:value={$formData.hostId} class={inputClass}>
									<option value="">Select a host…</option>
									{#each data.hosts as host (host.id)}
										<option value={host.id}>{host.name}</option>
									{/each}
								</select>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class="mt-1 text-caption text-destructive" />
					</Form.Field>
				{/if}

				<Form.Field {form} name="description">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label class={labelClass}>Basic description</Form.Label>
							<p class="mb-1 text-caption text-muted-foreground">
								This appears on the homepage for this conversation. You can add it later.
							</p>
							<textarea {...props} bind:value={$formData.description} rows="4" class={inputClass}
							></textarea>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>

				<!-- Action row stays pinned to the bottom of the scroll region.
			     Negative margins cancel the column padding so it spans edge to edge. -->
				<div
					class="sticky bottom-0 -mx-6 -mb-6 flex items-center gap-3 border-t border-border bg-background px-6 py-4 sm:-mx-8 sm:-mb-8 sm:px-8"
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
