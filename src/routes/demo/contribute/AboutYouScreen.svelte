<script lang="ts">
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { Select } from 'bits-ui';
    import type { AboutYouQuestion } from '$lib/types/mock-data';
    import { AboutBar, Button, Link } from '$lib/components/ui';
    import { Check, Plus } from 'lucide-svelte';

    interface Props {
        countyName: string;
        questions: AboutYouQuestion[];
        zipCode?: string;
        onDone: (demographics?: { age?: string; ethnicity?: string; gender?: string; politicalParty?: string }) => void;
        onSkip?: () => void;
    }

    let { countyName, questions, zipCode = '', onDone, onSkip }: Props = $props();

    let selections = $state<Record<string, string>>({});

    function getCategoryLabel(q: AboutYouQuestion): string {
        if (q.id === 'about-001') return 'Age?';
        if (q.id === 'about-002') return 'Ethnicity?';
        if (q.id === 'about-003') return 'Gender?';
        if (q.id === 'about-004') return 'Political Party?';
        return q.question;
    }

    function collectDemographics(): { age?: string; ethnicity?: string; gender?: string; politicalParty?: string } {
        const result: { age?: string; ethnicity?: string; gender?: string; politicalParty?: string } = {};
        for (const q of questions) {
            const val = selections[q.id];
            if (!val) continue;
            if (q.id === 'about-001') result.age = val;
            else if (q.id === 'about-002') result.ethnicity = val;
            else if (q.id === 'about-003') result.gender = val;
            else if (q.id === 'about-004') result.politicalParty = val;
        }
        return result;
    }
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
            This information helps us make sure everyone is represented in the conversation. Share only as much as you'd like to, and you have full control over your data. See our full privacy terms <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" external>here</Link>.
        </p>

        <div class="mt-8 flex flex-col gap-2 pb-12">
            {#each questions as q, qIdx (q.id)}
                <div
                    in:fly={{ y: 15, delay: 400 + qIdx * 80, duration: 400, easing: cubicOut }}
                >
                    <Select.Root
                        type="single"
                        onValueChange={(val) => {
                            if (val) selections = { ...selections, [q.id]: val };
                        }}
                    >
                        <Select.Trigger
                            class="flex h-16 w-full cursor-pointer items-center rounded-[20px] pl-6 pr-5 transition-all duration-300 focus:outline-none {selections[q.id]
                                ? 'bg-card text-foreground shadow-[0px_5px_15px_0px_rgba(12,34,95,0.13)]'
                                : 'bg-secondary/10 text-foreground/70'}"
                        >
                            <span class="flex-1 truncate text-left font-sans text-2xl font-bold leading-7">
                                {selections[q.id] ?? getCategoryLabel(q)}
                            </span>
                            {#if selections[q.id]}
                                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground">
                                    <Check class="h-3.5 w-3.5 text-card stroke-3" />
                                </span>
                            {:else}
                                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/40">
                                    <Plus class="h-3.5 w-3.5 text-accent stroke-3" />
                                </span>
                            {/if}
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content
                                class="z-50 min-w-[340px] max-h-72 overflow-y-auto rounded-2xl border border-foreground/10 bg-card shadow-xl"
                                sideOffset={4}
                            >
                                <Select.Viewport>
                                    {#each q.options as option (option)}
                                        <Select.Item
                                            value={option}
                                            label={option}
                                            class="flex cursor-pointer items-center px-5 py-3.5 font-sans text-lg font-medium text-foreground/80 transition-colors hover:bg-secondary/10 data-highlighted:bg-secondary/10"
                                        >
                                            {#snippet children({ selected })}
                                                <span class="flex-1">{option}</span>
                                                {#if selected}
                                                    <Check class="h-4 w-4 text-foreground stroke-3" />
                                                {/if}
                                            {/snippet}
                                        </Select.Item>
                                    {/each}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
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