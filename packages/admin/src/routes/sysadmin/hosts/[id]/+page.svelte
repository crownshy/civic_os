<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$lib/activity.svelte';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowLeft, CheckCircle2, AlertCircle, Pencil, ShieldCheck } from '@lucide/svelte';
	import { addMemberSchema, type AddMemberMessage } from './member-schema';
	import HostDetailsFields from '$lib/components/hosts/HostDetailsFields.svelte';
	import { hostDetailsSchema, type HostDetailsMessage } from '$lib/hosts/host-details-schema';
	import ConversationsCard from './ConversationsCard.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const org = $derived(data.org);
	const team = $derived(data.team);

	const form = superForm(
		untrack(() => data.form),
		{
			validators: zod4Client(addMemberSchema),
			resetForm: true
		}
	);
	const { form: formData, enhance: addEnhance, submitting, message } = form;
	const msg = $derived($message as AddMemberMessage | undefined);

	let editing = $state(false);
	const detailsForm = superForm(
		untrack(() => data.detailsForm),
		{
			dataType: 'json',
			validators: zod4Client(hostDetailsSchema),
			resetForm: false,
			onUpdated({ form }) {
				if (form.valid && (form.message as HostDetailsMessage | undefined)?.kind === 'ok') {
					editing = false;
				}
			}
		}
	);
	const {
		enhance: detailsEnhance,
		submitting: savingDetails,
		message: detailsMessage
	} = detailsForm;
	const detailsMsg = $derived($detailsMessage as HostDetailsMessage | undefined);

	function cancelEdit() {
		detailsForm.reset();
		editing = false;
	}

	// Error from the small role/remove actions (SvelteKit fail()).
	const actionError = $derived((page.form as { error?: string } | null)?.error);

	function displayUrl(url?: string | null): string {
		return url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
	}
	// By email: comhairle generates the username, and it reads as noise (#477).
	function label(m: { username?: string | null; email?: string | null }): string {
		return m.email || m.username || 'Unknown user';
	}
</script>

<!-- The app shell clips overflow, so the page scrolls itself (#461). -->
<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-3xl p-6 sm:p-8">
		<a
			href={resolve('/sysadmin/hosts')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Hosts
		</a>

		<div class="mb-1 flex items-start justify-between gap-4">
			<h1 class="text-h4 font-bold md:text-h3">{org.name}</h1>
			{#if !editing}
				<Button variant="outline" size="sm" onclick={() => (editing = true)}>
					<Pencil class="size-4" />
					Edit details
				</Button>
			{/if}
		</div>
		<div class="mb-8 flex flex-wrap gap-x-4 gap-y-1 text-body text-muted-foreground">
			{#if org.externalUrl}
				<a
					href={org.externalUrl}
					target="_blank"
					rel="noreferrer"
					class="underline-offset-2 hover:text-foreground hover:underline"
				>
					{displayUrl(org.externalUrl)}
				</a>
			{/if}
			{#if org.contactEmail}
				<a
					href={`mailto:${org.contactEmail}`}
					class="underline-offset-2 hover:text-foreground hover:underline"
				>
					{org.contactEmail}
				</a>
			{/if}
			{#if org.places.length}
				<span>{org.places.join(', ')}</span>
			{/if}
		</div>
		{#if org.description && !editing}
			<p class="-mt-4 mb-8 text-body whitespace-pre-line">{org.description}</p>
		{/if}

		{#if editing}
			<form
				method="POST"
				action="?/updateHost"
				use:detailsEnhance
				class="mb-8 flex flex-col gap-6 rounded-xl border border-border p-5"
			>
				{#if detailsMsg?.kind === 'error'}
					<div
						class="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
					>
						<AlertCircle class="size-4 shrink-0" />
						<span>{detailsMsg.text}</span>
					</div>
				{/if}
				<HostDetailsFields form={detailsForm} regions={data.regions} />
				<div class="flex items-center gap-3">
					<Button type="submit" disabled={$savingDetails}>
						{$savingDetails ? 'Saving…' : 'Save details'}
					</Button>
					<Button type="button" variant="outline" onclick={cancelEdit}>Cancel</Button>
				</div>
			</form>
		{/if}

		<!-- ===== Campaigns ===== -->
		<div class="mb-6">
			<ConversationsCard
				conversations={data.conversations}
				assignable={data.assignableConversations}
			/>
		</div>

		<!-- ===== Team ===== -->
		<section class="rounded-xl border border-border">
			<div class="border-b border-border px-5 py-4">
				<h2 class="text-body font-bold">Team</h2>
				<p class="text-caption text-muted-foreground">
					Admins can manage this Host. Members can view it.
				</p>
			</div>

			{#if actionError}
				<div
					class="flex items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-5 py-2.5 text-caption text-destructive"
				>
					<AlertCircle class="size-4 shrink-0" />
					<span>{actionError}</span>
				</div>
			{/if}

			{#if team.length === 0}
				<p class="px-5 py-6 text-body text-muted-foreground">No team members yet.</p>
			{:else}
				<ul>
					{#each team as m (m.id)}
						{@const isSelf = m.id === data.currentUserId}
						<li class="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
							<div class="min-w-0 flex-1">
								<span class="text-body font-semibold">{label(m)}</span>
								{#if isSelf}
									<span class="text-caption text-muted-foreground"> · you</span>
								{/if}
							</div>

							<span
								class={[
									'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-caption font-semibold',
									m.role === 'admin'
										? 'bg-success/15 text-success'
										: 'bg-muted text-muted-foreground'
								].join(' ')}
							>
								{#if m.role === 'admin'}<ShieldCheck class="size-3" />{/if}
								{m.role}
							</span>

							{#if !isSelf}
								<form method="POST" action="?/setRole" use:enhance>
									<input type="hidden" name="userId" value={m.id} />
									<input
										type="hidden"
										name="role"
										value={m.role === 'admin' ? 'member' : 'admin'}
									/>
									<Button type="submit" variant="outline" size="sm">
										{m.role === 'admin' ? 'Make member' : 'Make admin'}
									</Button>
								</form>
								<form method="POST" action="?/removeMember" use:enhance>
									<input type="hidden" name="userId" value={m.id} />
									<Button type="submit" variant="destructive-outline" size="sm">Remove</Button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			<!-- Add member -->
			<form
				method="POST"
				action="?/addMember"
				use:addEnhance
				class="border-t border-border px-5 py-4"
			>
				{#if msg}
					<div
						class={[
							'mb-3 flex items-center gap-2 text-caption',
							msg.kind === 'ok' ? 'text-success' : 'text-destructive'
						].join(' ')}
					>
						{#if msg.kind === 'ok'}<CheckCircle2 class="size-4 shrink-0" />{:else}<AlertCircle
								class="size-4 shrink-0"
							/>{/if}
						<span>{msg.text}</span>
					</div>
				{/if}

				<div class="flex flex-wrap items-start gap-2">
					<Form.Field {form} name="email" class="min-w-0 flex-1">
						<Form.Control>
							{#snippet children({ props })}
								<input
									{...props}
									type="email"
									bind:value={$formData.email}
									placeholder="person@example.org"
									class="w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors class="mt-1 text-caption text-destructive" />
					</Form.Field>

					<select
						bind:value={$formData.role}
						class="rounded-[10px] border border-stone-300 bg-transparent px-3 py-2 text-body focus:border-primary focus:outline-none"
					>
						<option value="admin">Admin</option>
						<option value="member">Member</option>
					</select>

					<Button type="submit" disabled={$submitting}>
						{$submitting ? 'Adding…' : 'Add'}
					</Button>
				</div>
				<p class="mt-2 text-caption text-muted-foreground">
					New emails get an account and a set-password email.
				</p>
			</form>
		</section>
	</div>
</div>
