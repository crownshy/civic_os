<script lang="ts">
    import Dialog from './Dialog.svelte';
    import Button from './Button.svelte';

    interface Props {
        countyName: string;
        onBack?: () => void;
        backLabel?: string;
    }

    let { countyName, onBack, backLabel = '← BACK TO VOTING' }: Props = $props();
    let showAbout = $state(false);
</script>

<div class="flex items-center justify-between pr-3.75 pl-6 pt-3.75">
    {#if onBack}
        <Button variant="soft" size="xs" onclick={onBack}>
            {backLabel}
        </Button>
    {:else}
        <div class="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-foreground/80">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
            <span class="flex items-center justify-center overflow-hidden rounded-[10px] bg-destructive px-1.5 py-px">
                <span class="font-mono text-[10px] font-medium leading-4 text-destructive-foreground">BETA</span>
            </span>
        </div>
    {/if}
    
    <Button variant="soft" size="xs" onclick={() => (showAbout = true)}>
        ABOUT →
    </Button>
</div>

<Dialog
    bind:open={showAbout}
    title="About this Conversation"
>
    <div class="px-7 pt-6">
        <p class="font-sans text-lg font-medium leading-7">
            This space is hosted by the Institute for Ethics in AI at the University of Oxford and partners from across academia, technology, civil society, and public life. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           The Civic AI initiative is built on three premises: 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           First, that we humans are interdependent and thrive best in healthy communities that care for each other. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           Second, that common ground can be found even among people with very different views. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           Third, that AI should be developed as smaller, context-specific systems that work with and for people, rather than as a single all-powerful system. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           We invite everyone, regardless of their background or experience with AI, to share what matters
most to them about the future of AI and its impact on communities. Over the coming weeks, this
process will surface concerns, tensions, and opportunities for deeper discussion. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
           The results of this Open Poll will feed directly into small-group dialogues at the Civic AI
Conference at Rhodes House, Oxford, on 25 March 2026, and into the Civic AI book project.
They will help shape practical recommendations for how AI can support what we call &quot;relational
health,&quot; the ongoing flourishing of human relationships, communities, and societies. 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
        If you would like more information about this process or the Civic AI framework, please visit
<a href='https://civic.ai/conference'>https://civic.ai/conference</a> or contact us at <a href='mailto:hi@civic.ai'>hi@civic.ai</a>. 
        </p>
    </div>
</Dialog>
