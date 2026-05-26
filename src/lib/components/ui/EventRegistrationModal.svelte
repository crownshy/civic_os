<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Mail } from 'lucide-svelte';
	import { Button } from '$lib/components/ui';
	import { format } from 'date-fns';

        let { open, event } = $props();

	const formattedDate = $derived(event ? format(new Date(event.date), 'EEEE, MMMM d') : '');

        let email = $state('');

        async function handleSubmit(e: Event) {
            e.preventDefault();
        }
</script>

<Dialog
        bind:open={open}
        title="Registration: Community Conversation"
        buttonText="← BACK TO CONVERSATIONS"
        description={`Fill out the below information to register for the ${event.name} community conversation on ${formattedDate}.`}
>
        <form
            class="px-7 flex flex-col gap-4 mt-8 justify-between"
            onsubmit={handleSubmit}
        >
                <span class="relative">
                        <Input bind:value={email} class="text-2xl md:text-2xl py-6 h-auto pl-14 rounded-3xl" placeholder="Email address" />
                        <Mail class="absolute top-1/2 left-5 -translate-y-1/2" />
                </span>
            <Button type="submit" class="w-full">Sign up</Button>
        </form>
</Dialog>
