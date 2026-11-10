<script lang="ts">
	import { untrack } from 'svelte';
	import { defaults, setError, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import type { ApiClient } from '@crownshy/api-client/api';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import { Input } from '@civicos/shared/ui/input';
	import * as Form from '@civicos/shared/ui/form';
	import { renameAccount } from '$lib/services/account';
	import { profileNameSchema } from './profile-schema';

	type Props = {
		/** Empty when the account has no name yet. */
		name: string;
		api: Pick<ApiClient, 'UpdateUserDetails'>;
	};

	let { name, api }: Props = $props();

	let editing = $state(false);
	const initial = $derived(name.trim().charAt(0).toUpperCase());

	const form = superForm(
		defaults(
			untrack(() => ({ name })),
			zod4(profileNameSchema)
		),
		{
			SPA: true,
			validators: zod4Client(profileNameSchema),
			taintedMessage: false,
			resetForm: false,
			onUpdate: async ({ form: submitted }) => {
				if (!submitted.valid) return;
				const result = await renameAccount(api, submitted.data.name);
				if (result === 'saved') editing = false;
				else if (result === 'taken')
					setError(submitted, 'name', 'Someone already uses that name. Try adding an initial.');
				else setError(submitted, 'name', "Couldn't save your name. Please try again.");
			}
		}
	);
	const { form: fields, enhance } = form;
</script>

<div
	class="flex items-center gap-4 rounded-[20px] bg-white px-4 py-4 outline-1 -outline-offset-1 outline-foreground/20"
>
	<span
		class="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent font-display text-2xl font-medium text-foreground"
		aria-hidden="true">{initial}</span
	>
	<div class="min-w-0 flex-1">
		{#if editing}
			<form method="POST" novalidate use:enhance class="flex flex-col gap-1">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Input
								{...props}
								bind:value={$fields.name}
								maxlength={TEXT_LIMITS.participantName}
								autocomplete="name"
								placeholder="Your name..."
								class="h-9 rounded-xl text-xl md:text-xl"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-sm text-destructive" />
				</Form.Field>
				<div class="flex gap-4 text-sm">
					<button type="submit" class="font-bold text-primary">Save</button>
					<button type="button" class="text-foreground/70" onclick={() => (editing = false)}
						>Cancel</button
					>
				</div>
			</form>
		{:else}
			<p class="truncate font-display text-2xl font-medium text-foreground">
				{name || 'Add your name'}
			</p>
			<button type="button" class="text-sm text-destructive" onclick={() => (editing = true)}>
				change
			</button>
		{/if}
	</div>
</div>
