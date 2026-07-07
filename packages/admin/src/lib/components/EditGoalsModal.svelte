<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Dialog from '@civicos/shared/ui/dialog';
	import { Button } from '@civicos/shared/ui/button';
	import { Input } from '@civicos/shared/ui/input';
	import { Label } from '@civicos/shared/ui/label';
	import {
		METRIC_BUCKETS,
		METRIC_LABELS,
		type GoalMetric
	} from '$lib/config/representation-goals';

	interface Props {
		open: boolean;
		metric: GoalMetric | null;
		currentGoals: Record<string, number>;
		totalGoal: number;
		conversationId: string;
		workflowId: string | null;
		/** Overrides the static bucket list — used for county, whose buckets are per-region. */
		buckets?: string[];
	}

	let {
		open = $bindable(),
		metric,
		currentGoals,
		totalGoal,
		conversationId,
		workflowId,
		buckets: bucketsOverride
	}: Props = $props();

	const title = $derived(metric ? `Modify ${METRIC_LABELS[metric]} Goals` : '');
	const buckets = $derived(
		metric && metric !== 'totalParticipants'
			? (bucketsOverride ?? METRIC_BUCKETS[metric])
			: []
	);

	let submitting = $state(false);
	let errorMsg = $state<string | null>(null);

	function close() {
		open = false;
		errorMsg = null;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				Set the target number of participants per category. Leave a field blank to clear that
				goal.
			</Dialog.Description>
		</Dialog.Header>

		{#if metric && workflowId}
			<form
				method="POST"
				action="?/saveGoals"
				use:enhance={() => {
					submitting = true;
					errorMsg = null;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'failure') {
							errorMsg =
								(result.data as { error?: string } | undefined)?.error ?? 'Save failed.';
							await update({ reset: false });
							return;
						}
						await update();
						close();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="metric" value={metric} />
				<input type="hidden" name="conversationId" value={conversationId} />
				<input type="hidden" name="workflowId" value={workflowId} />

				{#if metric === 'totalParticipants'}
					<div class="space-y-1.5">
						<Label for="total-goal">Total participants goal</Label>
						<Input
							id="total-goal"
							type="number"
							name="value"
							min="0"
							step="1"
							value={totalGoal || ''}
							placeholder="0"
						/>
					</div>
				{:else}
					<div class="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
						{#each buckets as bucket (bucket)}
							{@const id = `goal-${metric}-${bucket}`}
							<div class="grid grid-cols-[1fr_8rem] items-center gap-3">
								<Label for={id} class="truncate">{bucket}</Label>
								<Input
									{id}
									type="number"
									name={`bucket:${bucket}`}
									min="0"
									step="1"
									value={currentGoals[bucket] ?? ''}
									placeholder="—"
								/>
							</div>
						{/each}
					</div>
				{/if}

				{#if errorMsg}
					<p class="text-destructive text-caption">{errorMsg}</p>
				{/if}

				<Dialog.Footer class="gap-2">
					<Button type="button" variant="outline" onclick={close} disabled={submitting}>
						Cancel
					</Button>
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Saving…' : 'Save'}
					</Button>
				</Dialog.Footer>
			</form>
		{:else if !workflowId}
			<p class="text-destructive text-caption">No workflow loaded — cannot save goals.</p>
			<Dialog.Footer>
				<Button onclick={close}>Close</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
