<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { GripVertical, Pencil, Plus, Trash2, Users } from '@lucide/svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { data } = $props();

	const event = $derived(data.event);
	const api = $derived(data.api);
	const campaign = $derived(data.campaign);

	type BasicRow = {
		id: string;
		kind: 'basic';
		title: string;
		description: string;
		estimated_time: number;
	};
	type BreakoutRow = {
		id: string;
		kind: 'breakout';
		prompt: string;
		instructions: string;
		estimated_time: number;
		time_limit: number | null;
		max_per_room: number | null;
	};
	type Row = BasicRow | BreakoutRow;

	let nextId = 0;
	const newId = () => `row-${++nextId}`;

	const DEFAULT_ITEMS: () => Row[] = () => [
		{
			id: newId(),
			kind: 'basic',
			title: 'Welcome & context (host)',
			description: '',
			estimated_time: 15
		},
		{
			id: newId(),
			kind: 'breakout',
			prompt: 'Small-group breakouts',
			instructions: '',
			estimated_time: 30,
			time_limit: null,
			max_per_room: null
		},
		{
			id: newId(),
			kind: 'basic',
			title: 'Share-out & themes',
			description: '',
			estimated_time: 25
		},
		{ id: newId(), kind: 'basic', title: 'Closing reflection', description: '', estimated_time: 10 }
	];

	function fromAgenda(agenda: any[] | undefined): Row[] {
		if (!agenda?.length) return [];
		const out: Row[] = [];
		for (const item of agenda) {
			if ('Basic' in item) {
				out.push({
					id: newId(),
					kind: 'basic',
					title: item.Basic.title ?? '',
					description: item.Basic.description ?? '',
					estimated_time: item.Basic.estimated_time ?? 0
				});
			} else if ('BreakoutRoom' in item) {
				out.push({
					id: newId(),
					kind: 'breakout',
					prompt: item.BreakoutRoom.prompt ?? '',
					instructions: item.BreakoutRoom.instructions ?? '',
					estimated_time: item.BreakoutRoom.estimated_time ?? 0,
					time_limit: item.BreakoutRoom.time_limit ?? null,
					max_per_room: item.BreakoutRoom.max_per_room ?? null
				});
			}
		}
		return out;
	}

	function toAgenda(rows: Row[]) {
		return rows.map((r) => {
			if (r.kind === 'breakout') {
				return {
					BreakoutRoom: {
						prompt: r.prompt,
						instructions: r.instructions,
						estimated_time: r.estimated_time,
						time_limit: r.time_limit,
						max_per_room: r.max_per_room
					}
				};
			}
			return {
				Basic: {
					title: r.title,
					description: r.description,
					estimated_time: r.estimated_time
				}
			};
		});
	}

	let items = $state<Row[]>([]);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let loaded = false;

	$effect(() => {
		if (loaded) return;
		const next = fromAgenda(event?.agenda);
		if (next.length || event) {
			items = next;
			loaded = true;
		}
	});

	async function persist(next: Row[]) {
		if (!event) return;
		const prev = items;
		items = next;
		saving = true;
		error = null;
		try {
			await api.UpdateEvent(
				{ agenda: toAgenda(next) },
				{
					params: {
						conversation_id: campaign.id,
						event_id: event.id
					}
				}
			);
			await invalidate(`events:detail:${event.id}`);
		} catch (e) {
			console.error('UpdateEvent(agenda) failed', e);
			items = prev;
			error = 'Save failed.';
		} finally {
			saving = false;
		}
	}

	function addBasic() {
		persist([
			...items,
			{ id: newId(), kind: 'basic', title: 'New item', description: '', estimated_time: 10 }
		]);
	}

	function addBreakout() {
		persist([
			...items,
			{
				id: newId(),
				kind: 'breakout',
				prompt: 'Breakout prompt',
				instructions: '',
				estimated_time: 20,
				time_limit: null,
				max_per_room: null
			}
		]);
	}

	function removeAt(i: number) {
		persist(items.filter((_, idx) => idx !== i));
	}

	function resetToDefault() {
		persist(DEFAULT_ITEMS());
	}

	function commitEdit(i: number, patch: Partial<Row>) {
		const next = items.slice();
		next[i] = { ...next[i], ...patch } as Row;
		persist(next);
	}

	const FLIP_MS = 200;

	function handleConsider(e: CustomEvent<DndEvent<Row>>) {
		items = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<DndEvent<Row>>) {
		const next = e.detail.items;
		const orderChanged = next.length !== items.length || next.some((r, i) => r.id !== items[i]?.id);
		items = next;
		if (orderChanged) persist(next);
	}
</script>

<div class="space-y-4">
	<div class="flex items-end justify-between">
		<div>
			<h3 class="text-body font-bold">Agenda</h3>
			<p class="text-caption text-muted-foreground">
				Inherited from the conversation's default agenda. Drag to reorder.
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if saving}
				<span class="text-caption text-muted-foreground">saving…</span>
			{/if}
			{#if error}
				<span class="text-caption text-destructive">{error}</span>
			{/if}
			<button
				type="button"
				onclick={resetToDefault}
				class="rounded-full px-3 py-1.5 text-caption text-destructive/50 hover:text-destructive"
			>
				reset to default
			</button>
			<button
				type="button"
				onclick={addBreakout}
				class="inline-flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1.5 text-caption text-foreground"
			>
				<Users class="size-3" /> add breakout
			</button>
			<button
				type="button"
				onclick={addBasic}
				class="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-caption text-primary-foreground"
			>
				<Plus class="size-3" /> add item
			</button>
		</div>
	</div>

	{#if items.length === 0}
		<div
			class="rounded-lg border border-dashed py-10 text-center text-body text-muted-foreground italic"
		>
			No agenda items yet. Click <span class="font-bold">add item</span> or
			<span class="font-bold">reset to default</span>.
		</div>
	{:else}
		<div
			class="space-y-2"
			use:dndzone={{
				items,
				flipDurationMs: FLIP_MS,
				dropTargetStyle: {
					outline: '2px dashed var(--color-primary, currentColor)',
					'outline-offset': '4px',
					'border-radius': '12px'
				}
			}}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each items as item, i (item.id)}
				<div
					animate:flip={{ duration: FLIP_MS }}
					class="rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl border border-foreground/20 bg-muted/30 px-3 py-2.5"
				>
					<div class="flex items-center gap-2.5">
						<button
							type="button"
							class="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
							aria-label="Drag to reorder"
						>
							<GripVertical class="size-4" />
						</button>
						{#if item.kind === 'breakout'}
							<Users class="size-4 shrink-0 text-muted-foreground" />
							<label class="group/title relative flex flex-1 items-center">
								<input
									type="text"
									value={item.prompt}
									onblur={(e) => commitEdit(i, { prompt: e.currentTarget.value } as Partial<Row>)}
									placeholder="Breakout prompt"
									class="w-full rounded-md border border-foreground/0 bg-transparent px-1.5 py-1 pr-6 text-caption font-bold transition-colors outline-none hover:border-foreground/15 focus:border-foreground/20"
								/>
								<Pencil
									class="pointer-events-none absolute right-1.5 size-3 text-muted-foreground/0 transition-colors group-hover/title:text-muted-foreground/60"
								/>
							</label>
						{:else}
							<label class="group/title relative flex flex-1 items-center">
								<input
									type="text"
									value={item.title}
									onblur={(e) => commitEdit(i, { title: e.currentTarget.value } as Partial<Row>)}
									class="w-full rounded-md border border-foreground/0 bg-transparent px-1.5 py-1 pr-6 text-caption font-bold transition-colors outline-none hover:border-foreground/15 focus:border-foreground/20"
								/>
								<Pencil
									class="pointer-events-none absolute right-1.5 size-3 text-muted-foreground/0 transition-colors group-hover/title:text-muted-foreground/60"
								/>
							</label>
						{/if}
						<div class="flex items-center gap-1 text-caption">
							<input
								type="number"
								min="0"
								value={item.estimated_time}
								onblur={(e) =>
									commitEdit(i, {
										estimated_time: Number(e.currentTarget.value) || 0
									} as Partial<Row>)}
								class="w-14 rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-2xl border border-foreground/20 bg-foreground/10 px-2 py-1 text-right outline-none"
							/>
							<span class="text-muted-foreground">min</span>
						</div>
						<button
							type="button"
							onclick={() => removeAt(i)}
							class="text-muted-foreground hover:text-destructive"
							title="Delete"
						>
							<Trash2 class="size-4" />
						</button>
					</div>

					{#if item.kind === 'breakout'}
						<div class="mt-2.5 ml-6 space-y-2">
							<textarea
								value={item.instructions}
								onblur={(e) =>
									commitEdit(i, { instructions: e.currentTarget.value } as Partial<Row>)}
								placeholder="Instructions for participants"
								rows="2"
								class="w-full rounded-lg border border-foreground/15 bg-foreground/5 px-2 py-1.5 text-caption outline-none"
							></textarea>
							<div class="flex items-center gap-4 text-caption text-muted-foreground">
								<label class="flex items-center gap-1.5">
									<span>time limit</span>
									<input
										type="number"
										min="0"
										value={item.time_limit ?? ''}
										onblur={(e) => {
											const v = e.currentTarget.value;
											commitEdit(i, {
												time_limit: v === '' ? null : Number(v) || 0
											} as Partial<Row>);
										}}
										placeholder="—"
										class="w-14 rounded-md border border-foreground/20 bg-foreground/10 px-2 py-1 text-right outline-none"
									/>
									<span>min</span>
								</label>
								<label class="flex items-center gap-1.5">
									<span>max per room</span>
									<input
										type="number"
										min="0"
										value={item.max_per_room ?? ''}
										onblur={(e) => {
											const v = e.currentTarget.value;
											commitEdit(i, {
												max_per_room: v === '' ? null : Number(v) || 0
											} as Partial<Row>);
										}}
										placeholder="—"
										class="w-14 rounded-md border border-foreground/20 bg-foreground/10 px-2 py-1 text-right outline-none"
									/>
								</label>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
