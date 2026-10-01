<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowLeft, AlertCircle } from '@lucide/svelte';
	import HostDetailsFields from '$lib/components/hosts/HostDetailsFields.svelte';
	import { hostDetailsSchema, type HostDetailsMessage } from '$lib/hosts/host-details-schema';
	import { resolve } from '$app/paths';

	let { data } = $props();

	// superForm is seeded once from the initial load data; untrack makes that
	// intentional one-time read explicit (same pattern as the Setup overview page).
	const form = superForm(
		untrack(() => data.form),
		{
			dataType: 'json',
			validators: zod4Client(hostDetailsSchema),
			resetForm: false
		}
	);
	const { enhance, submitting, message } = form;

	const msg = $derived($message as HostDetailsMessage | undefined);
</script>

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-3xl p-6 sm:p-8">
		<a
			href={resolve('/sysadmin/hosts')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Hosts
		</a>

		<h1 class="mb-1 text-section font-bold">Create Host</h1>
		<p class="mb-8 text-body text-muted-foreground">
			Create a new Host organization. Members are added from the Host's page afterwards.
		</p>

		{#if msg?.kind === 'error'}
			<div
				class="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{msg.text}</span>
			</div>
		{/if}

		<form method="POST" use:enhance class="flex flex-col gap-6">
			<HostDetailsFields
				{form}
				regions={data.regions}
				descriptionHint="Optional. The Host can add or change it later."
			/>

			<!-- Action row stays pinned to the bottom of the scroll region.
			     Negative margins cancel the column padding so it spans edge to edge. -->
			<div
				class="sticky bottom-0 -mx-6 -mb-6 flex items-center gap-3 border-t border-border bg-background px-6 py-4 sm:-mx-8 sm:-mb-8 sm:px-8"
			>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Creating…' : 'Create Host'}
				</Button>
				<Button href={resolve('/sysadmin/hosts')} variant="outline" type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
