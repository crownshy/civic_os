<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { Button } from '@civicos/shared/ui/button';
	import { AlertCircle, ArrowLeft } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import PlaceFields from '../PlaceFields.svelte';
	import { placeSchema, type PlaceMessage } from '../place-schema';

	let { data } = $props();

	// Seeded once from the initial load data, same as Create Host.
	const form = superForm(
		untrack(() => data.form),
		{ dataType: 'json', validators: zod4Client(placeSchema), resetForm: false }
	);
	const { enhance, submitting, message } = form;

	const msg = $derived($message as PlaceMessage | undefined);
</script>

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-5xl px-6 pt-6 sm:px-8 sm:pt-8">
		<a
			href={resolve('/places')}
			class="mb-4 inline-flex items-center gap-1.5 text-body text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="size-4" />
			Places
		</a>

		<h1 class="mb-1 text-h3 font-bold md:text-h2">Create Place</h1>
		<p class="mb-8 text-body text-muted-foreground">
			Name a Place and pick the areas it covers. Conversations running in those areas show on its
			page.
		</p>

		{#if msg?.kind === 'error'}
			<div
				role="alert"
				class="mb-6 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-body text-destructive"
			>
				<AlertCircle class="size-4 shrink-0" />
				<span>{msg.text}</span>
			</div>
		{/if}

		<form method="POST" use:enhance novalidate class="flex flex-col gap-6">
			<PlaceFields {form} />

			<div
				class="sticky bottom-0 mt-4 flex items-center gap-3 border-t border-border bg-background py-4"
			>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Creating…' : 'Create Place'}
				</Button>
				<Button href={resolve('/places')} variant="outline" type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
