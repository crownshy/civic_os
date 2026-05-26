<script lang="ts">
	import {  EmojiCircle } from '$lib/components/ui';
	import type { Snippet } from 'svelte';

        type Props = {
            title?: string;
            message?: Snippet;
        }

        let { title, message }: Props = $props();
</script>

<div class="flex flex-col items-center px-8 pt-14">
        <EmojiCircle emoji="🎉" size="lg" />

        <h1 class="mt-6 text-center font-sans text-4xl font-bold leading-10 text-foreground">
            {title ?? 'Thank you!'}
        </h1>

        {#if message}
            {@render message()}
        {:else}
            <p class="mt-2 text-center font-sans text-base font-medium leading-6 text-foreground/80">
                Someone will be in touch soon
            </p>
        {/if}
</div>
