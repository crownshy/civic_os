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
	const form = superForm(untrack(() => data.form), {
		dataType: 'json',
		validators: zod4Client(createHostSchema),
		resetForm: false
	});
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
			class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-body"
		>
			<ArrowLeft class="size-4" />
			Hosts
		</a>

		<h1 class="mb-1 text-section font-bold">Create Host</h1>
		<p class="text-muted-foreground mb-8 text-body">
			Create a new Host organization. Members are added from the Host's page afterwards.
		</p>

		{#if msg?.kind === 'error'}
			<div
				class="border-destructive/30 bg-destructive/5 text-destructive mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-body"
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
						<Form.Label class="text-label text-muted-foreground font-semibold tracking-wider uppercase"
							>Organization name</Form.Label
						>
						<input {...props} bind:value={$formData.name} class={inputClass} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-caption text-destructive mt-1" />
			</Form.Field>

			<!-- Website + contact email -->
			<div class="grid gap-6 sm:grid-cols-2">
				<Form.Field {form} name="website">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								class="text-label text-muted-foreground font-semibold tracking-wider uppercase"
								>Website</Form.Label
							>
							<div
								class="focus-within:border-primary flex items-center rounded-[10px] border border-stone-300 px-3"
							>
								<span class="text-muted-foreground text-body">https://</span>
								<input
									{...props}
									bind:value={$formData.website}
									placeholder="www.example.org"
									class="flex-1 bg-transparent py-2.5 pl-0.5 text-body focus:outline-none"
								/>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors class="text-caption text-destructive mt-1" />
				</Form.Field>

				<Form.Field {form} name="contactEmail">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label
								class="text-label text-muted-foreground font-semibold tracking-wider uppercase"
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
					<Form.FieldErrors class="text-caption text-destructive mt-1" />
				</Form.Field>
			</div>

			<!-- Org type -->
			<Form.Field {form} name="orgType">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-label text-muted-foreground font-semibold tracking-wider uppercase"
							>Organization type</Form.Label
						>
						<select {...props} bind:value={$formData.orgType} class={inputClass}>
							{#each orgTypes as t (t.value)}
								<option value={t.value}>{t.label}</option>
							{/each}
						</select>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-caption text-destructive mt-1" />
			</Form.Field>

			<!-- Places -->
			<Form.Field {form} name="regionIds">
				<span class="text-label text-muted-foreground mb-2 block font-semibold tracking-wider uppercase"
					>Place(s)</span
				>
				{#if data.regions.length === 0}
					<p class="text-muted-foreground text-body">No places available.</p>
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
				<Form.FieldErrors class="text-caption text-destructive mt-1" />
			</Form.Field>

			<!-- Basic description -->
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="text-label text-muted-foreground font-semibold tracking-wider uppercase"
							>Basic description</Form.Label
						>
						<p class="text-caption text-muted-foreground mb-1">
							This appears on the homepage for this Host.
						</p>
						<textarea {...props} bind:value={$formData.description} rows="4" class={inputClass}
						></textarea>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="text-caption text-destructive mt-1" />
			</Form.Field>

			<!-- Action row stays pinned to the bottom of the scroll region.
			     Negative margins cancel the column padding so it spans edge to edge. -->
			<div
				class="bg-background border-border sticky bottom-0 -mx-6 -mb-6 flex items-center gap-3 border-t px-6 py-4 sm:-mx-8 sm:-mb-8 sm:px-8"
			>
				<Button type="submit" disabled={$submitting}>
					{$submitting ? 'Creating…' : 'Create Host'}
				</Button>
				<Button href="/sysadmin/hosts" variant="outline" type="button">Cancel</Button>
			</div>
		</form>
	</div>
</div>
