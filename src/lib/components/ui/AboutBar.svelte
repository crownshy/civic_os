<script lang="ts">
    import Dialog from './Dialog.svelte';
    import Button from './Button.svelte';
	import type { RegionConfig } from '$lib/config/regions';

    interface Props {
        countyName: string;
		region: RegionConfig;
        onBack?: () => void;
        backLabel?: string;
    }

    let { countyName, onBack, backLabel = '← BACK TO VOTING' , region}: Props = $props();
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
		{#each region.aboutConversation as para, index}
		  {#if index==0}
			<p class="font-sans text-lg font-medium leading-7">
				{@html para}
			</p>
		  {:else}
			<p class="mt-4 font-sans text-lg font-medium leading-7">
				{@html para}
			</p>
		  {/if}
		{/each}
    </div>
</Dialog>
