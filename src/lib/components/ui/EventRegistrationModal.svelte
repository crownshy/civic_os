<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import { Mail } from 'lucide-svelte';
	import { Button } from '$lib/components/ui';
	import { format } from 'date-fns';
	import { api } from '$lib/services/api';
	import type { ConversationEvent } from '$lib/types/mock-data';
	import { Spinner } from './spinner';
	import { isValidEmail } from '$lib/utils/forms';
	import { cn } from '$lib/utils';
	import ThankYouMessage from './ThankYouMessage.svelte';

        type Props = {
            open: boolean,
            event: ConversationEvent,
            conversationId: string,
        }

        let { open, event, conversationId }: Props = $props();

	const formattedDate = $derived(event ? format(new Date(event.date), 'EEEE, MMMM d') : '');

        let email = $state('');
        let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
        let error = $state('');
        let inputError = $state('');

        async function handleSubmit(e: Event) {
            e.preventDefault();
            error = '';
            inputError = '';

            if (!isValidEmail(email)) {
                return inputError = 'Please enter a valid email';
            }

            try {
                status = 'loading';
                await api.CreateInvite(
                    {
                            invite_type: { email },
                            expires_at: event.date,
                            event_id: event.id,
                    },
                    { params: { conversation_id: conversationId } }
                );
                status = 'success';
            } catch (e) {
                console.error(e);
                status = 'error';
            }
        }
</script>

<Dialog
        bind:open={open}
        title="Registration: Community Conversation"
        buttonText="← BACK TO CONVERSATIONS"
        description={`Fill out the below information to register for the ${event.name} community conversation on ${formattedDate}.`}
>
        {#if status === 'success'}
            <div class="flex flex-col justify-between gap-10">
                <ThankYouMessage
                    title="Thank you! We'll see you soon."
                >
                    {#snippet message()}
                        <div class="font-sans text-lg font-medium leading-6 text-foreground/80 mt-8 flex flex-col gap-8">
                            <p class="text-center">
                                You should receive a confirmation email soon, plus more information and reminders shortly before the event.
                            </p>
                            <p class="text-center">
                                Email <a href="mailto:hello@bloom-project.org" class="font-bold text-red-500">hello@bloom-project.org</a> if you have any questions.
                            </p>
                        </div>
                    {/snippet}
                </ThankYouMessage>
                <div class="flex gap-4 w-full justify-between px-7">
                    <!-- TODO: <Button variant="soft" class="w-full">Add to calendar</Button>-->
                    <!-- TODO: <Button class="w-full">Go to poll</Button>-->
                </div>
            </div>
        {:else}
            <form
                class="px-7 flex flex-col gap-4 mt-8 justify-between"
                onsubmit={handleSubmit}
            >
                    <div class="flex flex-col gap-2">
                        <span class="relative">
                                <Input
                                    type="email"
                                    bind:value={email}
                                    class={cn("text-2xl md:text-2xl py-6 h-auto pl-14 rounded-3xl", inputError && 'border-red-500')}
                                    placeholder="Email address"
                                />
                                <Mail class="absolute top-1/2 left-5 -translate-y-1/2" />
                        </span>
                        {#if inputError}<span class="px-12 text-red-500">{inputError}</span>{/if}
                    </div>
                <Button type="submit" class="w-full" disabled={!email}>Sign up{#if status === 'loading'}<Spinner class="ml-4" />{/if}</Button>
                {#if error}<span class="font-bold text-lg text-center text-red-500">{error}</span>{/if}
            </form>
        {/if}
</Dialog>
