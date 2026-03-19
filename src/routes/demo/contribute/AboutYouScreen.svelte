<script lang="ts">
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { SvelteSet } from 'svelte/reactivity';
    import type { AboutYouQuestion } from '$lib/types/mock-data';
    import { AboutBar, Button, Dialog, Link } from '$lib/components/ui';
    import { Check, Plus } from 'lucide-svelte';

    interface Props {
        countyName: string;
        questions: AboutYouQuestion[];
        zipCode?: string;
        onDone: (demographics?: { age?: string; ethnicity?: string; gender?: string }) => void;
        onSkip?: () => void;
    }

    let { countyName, questions, zipCode = '', onDone, onSkip }: Props = $props();

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

    function getCategoryLabel(q: AboutYouQuestion): string {
        if (q.id === 'about-001') return 'Age?';
        if (q.id === 'about-002') return 'Ethnicity?';
        if (q.id === 'about-003') return 'Gender?';
        return q.question;
    }

    function collectDemographics(): { age?: string; ethnicity?: string; gender?: string } {
        const result: { age?: string; ethnicity?: string; gender?: string } = {};
        for (const q of questions) {
            const sel = selections[q.id];
            if (!sel || sel.size === 0) continue;
            const values = [...sel].map((i) => q.options[i]).join(', ');
            if (q.id === 'about-001') result.age = values;
            else if (q.id === 'about-002') result.ethnicity = values;
            else if (q.id === 'about-003') result.gender = values;
        }
        return result;
    }

    let dialogQuestion = $derived(openDialog ? questions.find((q) => q.id === openDialog) : null);
</script>

<div class="flex h-full flex-col bg-gradient-primary">
    <AboutBar {countyName} />

    <div class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
        <span
            class="font-mono text-sm font-medium text-foreground/80"
            in:fly={{ y: -10, duration: 300, delay: 100, easing: cubicOut }}
        >BEFORE YOU GO...</span>
        
        <p
            class="mt-4 font-sans text-4xl font-bold leading-9 text-foreground"
            in:fly={{ y: 10, duration: 400, delay: 200, easing: cubicOut }}
        >
            Let's get to know you.
        </p>
        
        <p
            class="mt-3 font-sans text-sm font-medium text-foreground/80"
            in:fly={{ y: 10, duration: 400, delay: 300, easing: cubicOut }}
        >
            This information helps us make sure everyone is represented in the conversation. Share only as much as you’d like to, and you have full control over your data. See our full privacy terms <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" external>here</Link>.
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
                            <Check class="h-4 w-4 text-card stroke-4" />
                        </span>
                    {:else}
                        <span class="absolute left-6 right-16 truncate">
                            {getCategoryLabel(q)}
                        </span>
                        <span class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground opacity-40">
                            <Plus class="h-4 w-4 text-card stroke-4" />
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
        title={dq.question}
        description={dq.description}
        buttonText="SUBMIT"
        onButtonClick={closeDialog}
        onOpenChange={(v) => { if (!v) closeDialog(); }}
    >
    <div class="mt-10">
        {#each dq.options as option, i (option)}
            <button
                onclick={() => toggleOption(dq.id, i, dq.multiSelect)}
                class="relative flex px-8 h-16 w-full items-center border-b border-foreground/20 text-left font-sans text-lg font-bold leading-5 text-foreground/70 transition-colors hover:bg-secondary/5"
            >
                <span class="flex-1">{option}</span>
                <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 {(selections[dq.id] ?? new SvelteSet()).has(i)
                        ? 'bg-foreground'
                        : 'bg-foreground/30'}"
                >
                    {#if (selections[dq.id] ?? new SvelteSet()).has(i)}
                        <Plus class="h-3 w-3 text-card stroke-4" />
                    {/if}
                </span>
            </button>
        {/each}
    </div>
    </Dialog>
{/if}