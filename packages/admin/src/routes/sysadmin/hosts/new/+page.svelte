<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import * as Form from '@civicos/shared/ui/form';
	import { Button } from '@civicos/shared/ui/button';
	import { ArrowLeft, AlertCircle } from '@lucide/svelte';
	import { createHostSchema, type CreateHostMessage } from './create-host-schema';

	let { data } = $props();

	// superForm is seeded once from the initial load data; untrack makes that
	// intentional one-time read explicit (same pattern as the Setup overview page).
	const form = superForm(
		untrack(() => data.form),
		{
			dataType: 'json',
			validators: zod4Client(createHostSchema),
			resetForm: false
		}
	);
	const { form: formData, enhance, submitting, message } = form;

	const msg = $derived($message as CreateHostMessage | undefined);

	const orgTypes = [
		{ value: 'non_profit', label: 'Non-profit' },
		{ value: 'governmental', label: 'Governmental' },
		{ value: 'other', label: 'Other' }
	] as const;

	function toggleRegion(id: string, checked: boolean) {
		$formData.regionIds = checked
			? [...$formData.regionIds, id]
			: $formData.regionIds.filter((r) => r !== id);
	}

	const inputClass =
		'focus:border-primary w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2.5 text-body focus:outline-none';
</script>

<div class="min-h-0 flex-1 overflow-y-auto">
	<div class="mx-auto max-w-3xl p-6 sm:p-8">
		<a
			href="/sysadmin/hosts"
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
			<!-- Organization name -->
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label
							class="text-label font-semibold tracking-wider text-muted-foreground uppercase"
							>Organization name</Form.Label
						>
						<input {...props} bind:value={$formData.name} class={inputClass} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="mt-1 text-caption text-destructive" />
			</Form.Field>

			<!-- Website + contact email -->
			<div class="grid gap-6 sm:grid-cols-2">
				<Form.Field {form} name="website">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								class="text-label font-semibold tracking-wider text-muted-foreground uppercase"
								>Website</Form.Label
							>
							<div
								class="flex items-center rounded-[10px] border border-stone-300 px-3 focus-within:border-primary"
							>
								<span class="text-body text-muted-foreground">https://</span>
								<input
									{...props}
									bind:value={$formData.website}
									placeholder="www.example.org"
									class="flex-1 bg-transparent py-2.5 pl-0.5 text-body focus:outline-none"
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>

				<Form.Field {form} name="contactEmail">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								class="text-label font-semibold tracking-wider text-muted-foreground uppercase"
								>Contact email</Form.Label
							>
							<input
								{...props}
								type="email"
								bind:value={$formData.contactEmail}
								placeholder="info@example.org"
								class={inputClass}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="mt-1 text-caption text-destructive" />
				</Form.Field>
			</div>

			<!-- Org type -->
			<Form.Field {form} name="orgType">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label
							class="text-label font-semibold tracking-wider text-muted-foreground uppercase"
							>Organization type</Form.Label
						>
						<select {...props} bind:value={$formData.orgType} class={inputClass}>
							{#each orgTypes as t (t.value)}
								<option value={t.value}>{t.label}</option>
							{/each}
						</select>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="mt-1 text-caption text-destructive" />
			</Form.Field>

			<!-- Places -->
			<Form.Field {form} name="regionIds">
				<span
					class="mb-2 block text-label font-semibold tracking-wider text-muted-foreground uppercase"
					>Place(s)</span
				>
				{#if data.regions.length === 0}
					<p class="text-body text-muted-foreground">No places available.</p>
				{:else}
					<div class="flex flex-wrap gap-2">
						{#each data.regions as region (region.id)}
							{@const checked = $formData.regionIds.includes(region.id)}
							<label
								class={[
									'cursor-pointer rounded-[10px] border px-3 py-1.5 text-body font-semibold transition-colors',
									checked
										? 'border-primary bg-primary/5 text-primary'
										: 'border-stone-300 text-foreground hover:border-stone-400'
								].join(' ')}
							>
								<input
									type="checkbox"
									class="sr-only"
									value={region.id}
									{checked}
									onchange={(e) => toggleRegion(region.id, e.currentTarget.checked)}
								/>
								{region.name}
							</label>
						{/each}
					</div>
				{/if}
				<Form.FieldErrors class="mt-1 text-caption text-destructive" />
			</Form.Field>

			<!-- Basic description -->
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label
							class="text-label font-semibold tracking-wider text-muted-foreground uppercase"
							>Basic description</Form.Label
						>
						<p class="mb-1 text-caption text-muted-foreground">
							This appears on the homepage for this Host.
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
					{$submitting ? 'Creating…' : 'Create Host'}
				</Button>
				<Button href="/sysadmin/hosts" variant="outline" type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
