<script lang="ts">
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { AppShell } from '$lib/components/layout';
    import { SwipeCarousel, Button, Dialog, ZipInput, Link } from '$lib/components/ui';
    import { session } from '$lib/services/session.svelte';
    import { getRegionByZipcode, getRegionUrl } from '$lib/config/regions';
    import type { RegionConfig } from '$lib/config/regions';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    const region: RegionConfig = page.data.region;

    const isReturning = session.hasSession;

    // --- Flow steps ---
    let zipCode = $state(isReturning ? session.zipCode : '');
    let hasZip = $derived(!!zipCode.trim());
    let slideIndex = $state(0);
    let joining = $state(false);
    let showHostMessage = $state(false);
    let showTermsMessage = $state(false);
    let zipFlash = $state(false);
    let hasAgreedToTos = $derived(session.hasAgreedToTos);

    // Check for zipcode in URL parameter on mount
    onMount(() => {
        if (browser && !isReturning) {
            const urlParams = new URLSearchParams(window.location.search);
            const zipParam = urlParams.get('zip_code');
            if (zipParam) {
                zipCode = zipParam;
            }
        }
    });

    function showTermsModal() {
        showTermsMessage = true;
    }

    function handleAgreeToTos() {
        session.setSessionField('hasAgreedToTos', true);
        handleJoin();
    }

    async function handleJoin() {
        if (isReturning) {
            goto('/contribute');
            return;
        }

        // Resolve region from zipcode
        const zipRegion = getRegionByZipcode(zipCode.trim());

        // Check if we need to redirect to a different subdomain
        if (zipRegion.slug !== region.slug) {
            // Redirect to the appropriate subdomain with zipcode parameter
            const redirectUrl = getRegionUrl(zipRegion, zipCode.trim(), window.location.hostname);
            window.location.href = redirectUrl;
            return;
        }

        // Zipcode matches current region - proceed with registration
        joining = true;
        const success = await session.join(
            zipCode.trim(),
            undefined,
            zipRegion.conversationId,
            zipRegion.inviteId
        );
        joining = false;
        if (success) {
            goto('/contribute');
        }
    }
</script>

<AppShell>
    <div class="relative flex h-full flex-col bg-gradient-primary overflow-hidden">
	<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-5/12 md:translate-y-5/8 lg:translate-y-3/4  xl:translate-y-5/7 w-[160%] aspect-2/1 rounded-t-full bg-linear-to-b from-background/30 to-background/40"></div>
        <!-- Host banner -->
        <div class="relative z-10 shrink-0 px-5 pt-1">
            <button
                onclick={() => (showHostMessage = true)}
                class="flex w-full items-center gap-3 rounded-lg bg-primary p-3 shadow-[0px_4px_12px_0px_rgba(12,34,95,0.25)] outline-1 outline-white/10 overflow-hidden text-left transition-transform active:scale-[0.98]"
            >
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card/15">
                    <span class="text-3xl pr-1 origin-center rotate-130 [text-shadow:0px_4px_4px_rgb(0_0_0/0.25)]">📣</span>
                </div>
                <div class="min-w-0 grow">
                    <span class="font-mono text-xs font-medium uppercase text-primary-foreground/70">HOSTED BY</span>
                    <p class="truncate font-sans text-base font-medium text-primary-foreground">{region.hostName}</p>
                </div>
                
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card/15">
                    <span class="text-3xl pb-3 text-card">⟶</span>
                </div>
            </button>
        </div>

        <!-- Main content — vertically centered, scrollable on small screens / large fonts -->
        <div class="relative z-10 flex-1 min-h-0 overflow-y-auto">
            <div class="flex min-h-full flex-col items-center justify-center px-9 sm:px-8 py-4 sm:py-6 max-w-xl mx-auto">
                <span class="text-center font-mono text-base font-medium uppercase text-muted-foreground">
                    {region.carouselPreHeader}
                </span>
                <h1 class="mt-2 sm:mt-3 text-center font-sans text-4xl font-bold leading-tight text-muted-foreground">
                    {region.carouselHeader}
                </h1>

                <SwipeCarousel count={region.slides.length} bind:index={slideIndex} autoScrollMs={5000} class="mt-6 sm:mt-6 w-full">
                    {#snippet children(i)}
                        <p class="font-sans text-lg font-medium leading-relaxed text-muted-foreground">
                            {region.slides[i]}
                        </p>
                    {/snippet}
                </SwipeCarousel>
            </div>
        </div>

        <!-- Bottom CTA -->
        <div class="relative z-10 shrink-0 flex flex-col items-center px-7 pb-3 pt-2">
            <span class="font-mono text-base font-medium uppercase text-muted-foreground/80">YOUR LOCATION</span>
            <div class="mt-1.5">
                <ZipInput bind:value={zipCode} disabled={isReturning} bind:flash={zipFlash} regionPrefixes={region.zipPrefixes} />
            </div>

            <Button variant="primary" fullWidth disabled={joining} onclick={() => {
                if (!hasZip) {
                    zipFlash = true;
                    return;
                }
                if (hasAgreedToTos) {
                    handleJoin();
                } else {
                    showTermsModal();
                }
            }} class="mt-3">
                {isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
            </Button>

            <span class="mt-2.5 opacity-50 text-center font-mono text-xs font-medium uppercase">
                <span class="text-foreground">THIS IS A{" "}</span>
                <span class="text-destructive">BETA,{" "}</span>
                <span class="text-foreground">POWERED BY </span>
                <Link href="https://www.bloom-project.org/" external>BLOOM PROJECT.</Link>
                <span class="text-foreground"> SEE THE FULL TERMS AND CONDITIONS </span>
                <Link href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" external>HERE.</Link>
            </span>
        </div>
    </div>

    {#if joining}
        <div
            class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary"
            transition:fade={{ duration: 200 }}
        >
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-card-foreground/30 border-t-card-foreground"></div>
            <span class="mt-4 font-mono text-sm font-medium uppercase text-card-foreground/80">JOINING...</span>
        </div>
    {/if}

    <Dialog
        bind:open={showHostMessage}
        title="A Message from Your Hosts"
        buttonText="GO BACK"
    >
        <div class="px-7 pt-6">
            {#each region.hostMessage as paragraph}
                <p class="mt-4 first:mt-0 font-sans text-lg font-medium leading-7">
                    {@html paragraph}
                </p>
            {/each}
        </div>
    </Dialog>

    <Dialog
        bind:open={showTermsMessage}
        title="Our Approach to Personal Data"
        buttonText="I AGREE TO THESE TERMS"
        onButtonClick={handleAgreeToTos}
        requireScrollToBottom
    >
        <div class="px-7 pt-6">
            <p class="font-sans text-lg font-medium leading-7">
               We're here to run a community conversation, not collect data on you. 
            </p>
            <ul class="mt-4 font-sans text-lg font-medium leading-7 list-[square] pl-6">
                <li><span class="font-bold">We collect your responses and, if you choose, your contact info.</span> That's it.</li>
                <li><span class="font-bold">You are in control.</span> You can access or delete your data at any time. Email us at <a href='mailto:hello@bloom-project.org'>hello@bloom-project.org</a>. </li>
                <li><span class="font-bold">We never sell or monetize anything you share.</span></li>
                <li><span class="font-bold">OpenPoll results are public by design — so the whole community can see what people think.</span> Your responses are always anonymous.</li>
                <li><span class="font-bold">Want to stay in the loop?</span> We’ll share your contact info (email address) with the local organization(s) hosting this conversation so they can follow up about related opportunities.</li>
                <li><span class="font-bold">We look at how people use the platform to make it better</span> — not to profile you or target you with ads.</li>
            </ul>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
                For more information, please view the full <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" class="text-destructive underline" target="_blank" rel="noopener noreferrer">Privacy Policy.</a>
            </p>
        </div>
    </Dialog>
</AppShell>
