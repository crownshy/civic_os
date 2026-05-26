<script lang="ts">
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { SvelteSet } from 'svelte/reactivity';
    import type { AboutYouQuestion } from '$lib/types/mock-data';
    import { InfoBar, Button, Dialog, Link } from '$lib/components/ui';
    import { Check, Plus } from 'lucide-svelte';
	import type { RegionConfig } from '$lib/config/regions';

    interface Props {
        countyName: string;
        questions: AboutYouQuestion[];
        zipCode?: string;
		region:RegionConfig;
        onDone: (demographics?: { age?: string; ethnicity?: string; gender?: string; politicalParty?: string }) => void;
        onSkip?: () => void;
    }

    let { countyName, questions, zipCode = '', onDone, onSkip, region }: Props = $props();

    let openDialog = $state<string | null>(null);
    let dialogOpen = $derived(openDialog !== null);
    let selections = $state<Record<string, SvelteSet<number>>>({});

    function openCategory(id: string) {
        openDialog = id;
    }

    function closeDialog() {
        openDialog = null;
    }

    function toggleOption(questionId: string, idx: number, multiSelect: boolean) {
        const current = selections[questionId] ?? new SvelteSet<number>();
        const next = new SvelteSet(current);
        if (multiSelect) {
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
        } else {
            next.clear();
            next.add(idx);
        }
        selections = { ...selections, [questionId]: next };
    }

    function getSelectionLabel(q: AboutYouQuestion): string {
        const sel = selections[q.id];
        if (!sel || sel.size === 0) return '';
        return [...sel].map((i) => q.options[i]).join(', ');
    }

    function hasSelection(questionId: string): boolean {
        const sel = selections[questionId];
        return !!sel && sel.size > 0;
    }

    function getCategoryTitle(q: AboutYouQuestion): string {
        if (q.id === 'about-001') return 'Age';
        if (q.id === 'about-002') return 'Race / Ethnicity';
        if (q.id === 'about-003') return 'Gender';
        if (q.id === 'about-004') return 'Political Affiliation or Leaning';
        return q.question;
    }

    function collectDemographics(): { age?: string; ethnicity?: string; gender?: string; politicalParty?: string } {
        const result: { age?: string; ethnicity?: string; gender?: string; politicalParty?: string } = {};
        for (const q of questions) {
            const sel = selections[q.id];
            if (!sel || sel.size === 0) continue;
            const values = [...sel].map((i) => q.options[i]).join(', ');
            if (q.id === 'about-001') result.age = values;
            else if (q.id === 'about-002') result.ethnicity = values;
            else if (q.id === 'about-003') result.gender = values;
            else if (q.id === 'about-004') result.politicalParty = values;
        }
        return result;
    }

    let dialogQuestion = $derived(openDialog ? questions.find((q) => q.id === openDialog) : null);
</script>

<div class="flex h-full flex-col bg-gradient-primary">
    <InfoBar region={region} {countyName} />

    <div class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
        <span
            class="font-mono text-sm font-medium text-foreground/80"
            in:fly={{ y: -10, duration: 300, delay: 100, easing: cubicOut }}
        >BEFORE YOU GO...</span>
        
        <p
            class="mt-4 font-display tracking-display text-4xl font-medium leading-9 text-foreground"
            in:fly={{ y: 10, duration: 400, delay: 200, easing: cubicOut }}
        >
		  Help {region.stateName} see itself.
        </p>
        
        <p
            class="mt-3 font-sans text-sm font-medium text-foreground"
            in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
        >
		  This conversation is richer when it reflects the full range of {region.stateName}. Sharing a little about yourself helps the whole community see who's in this conversation — and whose voices might still be missing.
       </p>
        <p
            class="mt-3 font-sans text-sm font-medium text-foreground"
            in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
        >
		  Every question is optional. Share only what you're comfortable with.
		</p>

        <p
            class="mt-3 font-sans text-sm font-medium text-foreground"
            in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
        >
		  See our full privacy terms <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" external>here</Link>.
		</p>

        <div class="mt-8 flex flex-col gap-2 pb-12">
            {#each questions as q, qIdx (q.id)}
                <button
                    onclick={() => openCategory(q.id)}
                    class="relative flex h-16 w-full items-center rounded-[20px] text-left font-sans text-2xl font-bold leading-7 transition-all duration-300 {hasSelection(q.id)
                        ? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
                        : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15'}"
                    in:fly={{ y: 15, delay: 400 + qIdx * 80, duration: 400, easing: cubicOut }}
                >
                    {#if hasSelection(q.id)}
                        <span class="absolute left-6 right-16 truncate">
                            {getSelectionLabel(q)}
                        </span>
                        <span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                            <Check class="h-3.5 w-3.5 text-card stroke-3" />
                        </span>
                    {:else}
                        <span class="absolute left-6 right-16 truncate">
                            {getCategoryTitle(q)}?
                        </span>
                        <span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/40">
                            <Plus class="h-3 w-3 text-accent stroke-3" />
                        </span>
                    {/if}
                </button>
            {/each}
        </div>
    </div>

    <div class="flex shrink-0 items-center gap-3.5 border-t border-secondary/70 bg-accent px-7 py-8">
        <Button variant="primary" fullWidth onclick={() => onDone(collectDemographics())}>
            CONTINUE
        </Button>
    </div>
</div>

{#if dialogQuestion}
    {@const dq = dialogQuestion}
    <Dialog
        open={dialogOpen}
        title={getCategoryTitle(dq)}
        description={dq.question}
        buttonText="SUBMIT"
        onButtonClick={closeDialog}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
    >
    <div class="mt-6">
        {#each dq.options as option, i (option)}
            <button
                onclick={() => toggleOption(dq.id, i, dq.multiSelect)}
                class="relative flex h-16 w-full items-center border-b border-foreground/20 px-7 text-left font-sans text-lg font-bold leading-5 transition-colors hover:bg-accent/30 {(selections[dq.id] ?? new SvelteSet()).has(i)
                    ? 'bg-accent/30 text-foreground'
                    : 'text-foreground/70'}"
            >
                <span class="flex-1">{option}</span>
                {#if (selections[dq.id] ?? new SvelteSet()).has(i)}
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground">
                        <Check class="h-2.5 w-2.5 text-card stroke-[2.5]" />
                    </span>
                {:else}
                    <span class="h-5 w-5 shrink-0 rounded-full border-2 border-foreground/50"></span>
                {/if}
            </button>
        {/each}
    </div>
    </Dialog>
{/if}
