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
            <span class="font-mono text-sm font-medium text-foreground/70">{countyName.toUpperCase()}</span>
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
            This conversation is about how Utah can prepare for the growing impact of AI in so many aspects of our lives (work and the economy, education, wellbeing, information quality, government services, etc). 
        </p>
        <p class="mt-4 font-sans text-lg font-medium leading-7">
            It is hosted by Utah Common Ground, a collaboration of diverse nonpartisan organizations across Utah. You can find out more about them at utahcommonground.org.
        </p>
    </div>
</Dialog>