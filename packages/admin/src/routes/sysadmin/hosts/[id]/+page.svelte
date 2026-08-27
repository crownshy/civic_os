<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from '@lucide/svelte';
	import { addMemberSchema, type AddMemberMessage } from './member-schema';
	import ConversationsCard from './ConversationsCard.svelte';

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

	// Error from the small role/remove actions (SvelteKit fail()).
	const actionError = $derived((page.form as { error?: string } | null)?.error);

	function displayUrl(url?: string | null): string {
		return url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
	}
	function label(m: { username?: string | null; email?: string | null }): string {
		return m.username || m.email || 'Unknown user';
	}
</script>

<div class="mx-auto max-w-3xl p-6 sm:p-8">
	<a
		href="/sysadmin/hosts"
		class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
	>
		<ArrowLeft class="size-4" />
		Hosts
	</a>

	<h1 class="mb-1 text-section font-bold">{org.name}</h1>
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
							{#if m.username && m.email}
								<span class="text-caption text-muted-foreground"> · {m.email}</span>
							{/if}
							{#if isSelf}
								<span class="text-caption text-muted-foreground"> · you</span>
							{/if}
						</div>

						<span
							class={[
								'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-caption font-semibold',
								m.role === 'admin' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
							].join(' ')}
						>
							{#if m.role === 'admin'}<ShieldCheck class="size-3" />{/if}
							{m.role}
						</span>

						{#if !isSelf}
							<form method="POST" action="?/setRole" use:enhance>
								<input type="hidden" name="userId" value={m.id} />
								<input type="hidden" name="role" value={m.role === 'admin' ? 'member' : 'admin'} />
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
