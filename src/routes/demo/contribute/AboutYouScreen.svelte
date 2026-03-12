<script lang="ts">
    import { fly, slide, scale } from 'svelte/transition';
    import { cubicOut, backOut } from 'svelte/easing';
    import { tick } from 'svelte';
    import type { AboutYouQuestion } from '$lib/types/mock-data';
    import { AboutBar, Button } from '$lib/components/ui';
    import { Check, Plus } from 'lucide-svelte';

    interface Props {
        countyName: string;
        questions: AboutYouQuestion[];
        zipCode?: string;
        onDone: (demographics?: { age?: string; ethnicity?: string; gender?: string }) => void;
        onSkip?: () => void;
    }

    let { countyName, questions, zipCode = '', onDone, onSkip }: Props = $props();

    let expandedCategory = $state<string | null>(null);
    let selections = $state<Record<string, Set<number>>>({});
    let containerRef = $state<HTMLDivElement | null>(null);

    $effect(() => {
        if (expandedCategory) {
            handleScroll(expandedCategory);
        }
    });

    async function handleScroll(id: string) {
        await tick();
        const el = document.getElementById(`question-${id}`);
        if (el) {
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    function toggleCategory(id: string) {
        expandedCategory = expandedCategory === id ? null : id;
    }

    function toggleOption(questionId: string, idx: number, multiSelect: boolean) {
        const current = selections[questionId] ?? new Set<number>();
        const next = new Set(current);
        if (multiSelect) {
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
        } else {
            next.clear();
            next.add(idx);
        }
        selections = { ...selections, [questionId]: next };

        if (!multiSelect) {
            setTimeout(() => { expandedCategory = null; }, 400); 
        }
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
        if (q.id === 'about-002') return 'Gender?';
        if (q.id === 'about-003') return 'Ethnicity?';
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
</script>

<div class="flex h-full flex-col bg-gradient-primary">
    <AboutBar {countyName} />

    <div bind:this={containerRef} class="flex flex-1 flex-col overflow-y-auto px-6 pt-8">
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
            This information helps us make sure everyone is represented in the conversation. You can share only as much as you'd like to.
        </p>

        <div class="mt-8 flex flex-col gap-3 pb-12">
            {#each questions as q, qIdx}
                <div 
                    id="question-{q.id}"
                    class="flex flex-col gap-2 scroll-mt-6 transition-opacity duration-300"
                    class:opacity-40={expandedCategory && expandedCategory !== q.id}
                    in:fly={{ y: 15, delay: 400 + qIdx * 80, duration: 400, easing: cubicOut }}
                >
                    <button
                        onclick={() => toggleCategory(q.id)}
                        class="relative flex h-16 w-full items-center rounded-[20px] text-left font-sans text-2xl font-bold leading-7 transition-all duration-300 {(expandedCategory === q.id || hasSelection(q.id))
                            ? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
                            : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15'}"
                    >
                        {#if hasSelection(q.id)}
                            <span class="absolute left-6 right-16 truncate" in:fly={{ y: 10, duration: 250, delay: 150 }} out:fly={{ y: -10, duration: 150 }}>
                                {getSelectionLabel(q)}
                            </span>
                            
                            <span 
                                class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground" 
                                in:scale={{ duration: 250, delay: 150, easing: backOut }} 
                                out:scale={{ duration: 150 }}
                            >
                                <Check class="h-4 w-4 text-card stroke-4" /> 
                            </span>
                        {:else}
                            <span class="absolute left-6 right-16 truncate" in:fly={{ y: -10, duration: 250, delay: 150 }} out:fly={{ y: 10, duration: 150 }}>
                                {getCategoryLabel(q)}
                            </span>
                            
                            <span 
                                class="absolute right-5 flex h-8 w-8 items-center justify-center rounded-full bg-foreground opacity-40 transition-transform duration-300"
                                in:scale={{ duration: 250, delay: 150, easing: backOut }} 
                                out:scale={{ duration: 150 }}
                            >
                                <Plus class="h-4 w-4 text-card stroke-4" />  
                            </span>
                        {/if}
                    </button>

                    {#if expandedCategory === q.id}
                        <div transition:slide={{ duration: 300, easing: cubicOut }}>
                            <div class="flex flex-col gap-2 pb-2 pt-2">
                                {#each q.options as option, i}
                                    <button
                                        onclick={() => toggleOption(q.id, i, q.multiSelect)}
                                        class="relative flex h-16 w-full shrink-0 items-center rounded-[20px] px-6 text-left font-sans text-2xl font-bold leading-7 transition-all duration-200 {(selections[q.id] ?? new Set()).has(i)
                                            ? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
                                            : 'bg-secondary/10 text-foreground/70 hover:bg-secondary/15'}"
                                        in:fly={{ y: -10, delay: i * 30, duration: 250, easing: cubicOut }}
                                    >
                                        {option}
                                    </button>
                                {/each}
                                
                                {#if q.multiSelect}
                                    <button
                                        onclick={() => { expandedCategory = null; }}
                                        class="mt-1 flex items-center gap-2 px-2 font-mono text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
                                    >
                                        DONE <Check class="h-3 w-3" />
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>

    <div class="flex shrink-0 items-center gap-3.5 border-t border-secondary/70 bg-accent px-7 py-8">
        <Button variant="primary" fullWidth onclick={() => onDone(collectDemographics())}>
            CONTINUE
        </Button>
    </div>
</div>