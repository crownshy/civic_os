<script lang="ts">
	import { untrack } from 'svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import * as Form from '@civicos/shared/ui/form';
	import { TEXT_LIMITS } from '@civicos/shared/data/text-limits';
	import CharCount from '$lib/components/CharCount.svelte';
	import type { HostDetailsSchema } from '$lib/hosts/host-details-schema';

	interface Props {
		form: SuperForm<z.infer<HostDetailsSchema>>;
		regions: Array<{ id: string; name: string }>;
		/** Under Basic description; Create Host says it can wait. */
		descriptionHint?: string;
	}

	let { form, regions, descriptionHint }: Props = $props();
	// One superForm for the component's whole life, so its store is read once.
	const formData = untrack(() => form.form);

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

	const labelClass = 'text-label font-semibold tracking-wider text-muted-foreground uppercase';
	const inputClass =
		'focus:border-primary w-full rounded-[10px] border border-stone-300 bg-transparent px-3 py-2.5 text-body focus:outline-none';
</script>

<Form.Field {form} name="name">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label class={labelClass}>Organization name</Form.Label>
			<input
				{...props}
				bind:value={$formData.name}
				maxlength={TEXT_LIMITS.hostName}
				class={inputClass}
			/>
		{/snippet}
	</Form.Control>
	<CharCount count={$formData.name.length} limit={TEXT_LIMITS.hostName} class="mt-1" />
	<Form.FieldErrors class="mt-1 text-caption text-destructive" />
</Form.Field>

<div class="grid gap-6 sm:grid-cols-2">
	<Form.Field {form} name="website">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class={labelClass}>Website</Form.Label>
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
				<Form.Label class={labelClass}>Contact email</Form.Label>
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

<Form.Field {form} name="orgType">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label class={labelClass}>Organization type</Form.Label>
			<select {...props} bind:value={$formData.orgType} class={inputClass}>
				{#each orgTypes as t (t.value)}
					<option value={t.value}>{t.label}</option>
				{/each}
			</select>
		{/snippet}
	</Form.Control>
	<Form.FieldErrors class="mt-1 text-caption text-destructive" />
</Form.Field>

<Form.Field {form} name="regionIds">
	<span class="mb-2 block {labelClass}">Place(s)</span>
	{#if regions.length === 0}
		<p class="text-body text-muted-foreground">No places available.</p>
	{:else}
		<div class="flex flex-wrap gap-2">
			{#each regions as region (region.id)}
				{@const checked = $formData.regionIds.includes(region.id)}
				<label
					class={[
						'cursor-pointer rounded-[10px] border px-3 py-1.5 text-body font-semibold transition-colors',
						checked
							? 'border-primary bg-primary/5 text-primary'
							: 'border-stone-300 text-foreground hover:border-stone-400'
					]}
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

<Form.Field {form} name="description">
	<Form.Control>
		{#snippet children({ props })}
			<Form.Label class={labelClass}>Basic description</Form.Label>
			{#if descriptionHint}
				<p class="mb-1 text-caption text-muted-foreground">{descriptionHint}</p>
			{/if}
			<textarea
				{...props}
				bind:value={$formData.description}
				maxlength={TEXT_LIMITS.hostDescription}
				rows="4"
				class={inputClass}
			></textarea>
		{/snippet}
	</Form.Control>
	<CharCount
		count={$formData.description.length}
		limit={TEXT_LIMITS.hostDescription}
		class="mt-1"
	/>
	<Form.FieldErrors class="mt-1 text-caption text-destructive" />
</Form.Field>
