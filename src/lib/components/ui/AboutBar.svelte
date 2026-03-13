<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import AboutOverlay from './AboutOverlay.svelte';

    interface Props {
        countyName: string;
    }

    let { countyName }: Props = $props();
    let showAbout = $state(false);
</script>

<div class="flex items-center justify-between pr-3.75 pl-6 pt-3.75">
    <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-foreground/80">
            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        </svg>
        <span class="font-mono text-sm font-medium text-foreground/80">{countyName.toUpperCase()}</span>
    </div>
    
    <button
        onclick={() => (showAbout = true)}
        class="flex items-center gap-2.5 overflow-hidden rounded-[20px] bg-secondary/10 px-1.5 py-0.5 transition-colors hover:bg-secondary/20"
    >
        <span class="font-mono text-sm font-medium text-secondary">ABOUT →</span>
    </button>
</div>

{#if showAbout}
    <div 
        transition:fade={{ duration: 200 }} 
        class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
    >
        <div 
            class="h-full w-full"
            transition:fly={{ y: 500, duration: 400, easing: cubicOut }}
        >
            <AboutOverlay {countyName} onClose={() => (showAbout = false)} />
        </div>
    </div>
{/if}