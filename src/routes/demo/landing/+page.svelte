<script lang="ts">
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { AppShell } from '$lib/components/layout';
    import { SwipeCarousel, Button, Dialog, ZipInput } from '$lib/components/ui';
    import { session } from '$lib/services/session.svelte';

    const slides: string[] = [
        'This conversation is about how Utahns can direct the growing impact of artificial intelligence to benefit our communities.',
        'You’ll see statements from your neighbors and other community members about this question. You can vote: agree, disagree, or unsure on each one.',
        'This “Open Poll” will reveal shared concerns and values that will be the basis of action-oriented community conversations in the coming months.',
    ];

    const isReturning = session.hasSession;

    // --- Flow steps ---
    let zipCode = $state(isReturning ? session.zipCode : '');
    let hasZip = $derived(!!zipCode.trim());
    let slideIndex = $state(0);
    let joining = $state(false);
    let showHostMessage = $state(false);
    let showTermsMessage = $state(false);
    let hasAgreedToTos = $derived(session.hasAgreedToTos);

    function showTermsModal() {
        showTermsMessage = true;
    }

    function handleAgreeToTos() {
        session.setSessionField('hasAgreedToTos', true);
        handleJoin();
    }

    async function handleJoin() {
        if (isReturning) {
            goto('/demo/contribute');
            return;
        }
        joining = true;
        const success = await session.join(zipCode.trim());
        joining = false;
        if (success) {
            goto('/demo/contribute');
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
                    <p class="truncate font-sans text-base font-medium text-primary-foreground">Utah Common Ground</p>
                </div>
                
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card/15">
                    <span class="text-3xl pb-3 text-card">⟶</span>
                </div>
            </button>
        </div>

        <!-- Main content — vertically centered, scrollable on small screens / large fonts -->
        <div class="relative z-10 flex-1 min-h-0 overflow-y-auto">
            <div class="flex min-h-full flex-col items-center justify-center px-6 sm:px-8 py-4 sm:py-6 max-w-xl mx-auto">
                <span class="text-center font-mono text-base font-medium uppercase text-muted-foreground">
                    WHAT SHOULD WE DO ABOUT
                </span>
                <h1 class="mt-2 sm:mt-3 text-center font-sans text-4xl font-bold leading-tight text-muted-foreground">
                    AI and the Future of Our Communities
                </h1>

                <div class="mx-auto mt-4 sm:mt-6 h-1 w-20 rounded-full bg-muted-foreground"></div>

                <SwipeCarousel count={slides.length} bind:index={slideIndex} autoScrollMs={5000} class="mt-4 sm:mt-6 w-full">
                    {#snippet children(i)}
                        <p class="font-sans text-lg font-medium leading-relaxed text-muted-foreground">
                            {slides[i]}
                        </p>
                    {/snippet}
                </SwipeCarousel>
            </div>
        </div>

        <!-- Bottom CTA -->
        <div class="relative z-10 shrink-0 flex flex-col items-center px-7 pb-3 pt-2">
            <span class="font-mono text-base font-medium uppercase text-muted-foreground/80">YOUR LOCATION</span>
            <div class="mt-1.5">
                <ZipInput bind:value={zipCode} disabled={isReturning} />
            </div>

            <Button variant="primary" fullWidth disabled={!hasZip || joining} onclick={() => {
                if (hasAgreedToTos) {
                    handleJoin();
                } else {
                    showTermsModal();
                }
            }} class="mt-3">
                {isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
            </Button>

            <span class="mt-2.5 font-mono text-sm font-medium text-secondary/70">POWERED BY <a href="https://www.bloom-project.org/" class="underline" target="_blank" rel="noopener noreferrer">BLOOM PROJECT</a></span>
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
            <p class="font-sans text-lg font-medium leading-7">
                This space is hosted by <a href="https://www.utahcommonground.org/home" class="text-destructive underline" target="_blank" rel="noopener noreferrer">Utah Common Ground</a>, a coalition of nonprofit organizations from around the state, including Utah State University Center for Anticipatory Intelligence, the AI Ethics and Governance Institute, Engage Utah, and Mormon Women for Ethical Governance. We came together to help citizens come together across political differences to identify issues of local concern, consider possible solutions, and take the necessary steps to achieve meaningful, measurable change. 
            </p>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
                We invite all Utahns to share what matters most to them about the future of AI and its impact on communities across the state. Over several weeks, this process will surface concerns, tensions, and opportunities for deeper discussion, as well as areas where additional information could help promote understanding. 
            </p>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
                After this period of broad public input, a representative group of approximately 30 to 50 residents from three counties (Cache, Salt Lake, and Utah Counties) will be invited to convene in person in August and September 2026 for a Solutions Forum. Participants will reflect the demographic, geographic, and political diversity of Utah and will receive stipends to ensure participation is accessible.
            </p>
        </div>
    </Dialog>

    <Dialog
        bind:open={showTermsMessage}
        title="Our Approach to Personal Data"
        buttonText="I AGREE TO THESE TERMS"
        onButtonClick={handleAgreeToTos}
    >
        <div class="px-7 pt-6">
            <p class="font-sans text-lg font-medium leading-7">
                We treat your data as part of a shared civic process — not a product to be sold.
            </p>
            <ul class="mt-4 font-sans text-lg font-medium leading-7 list-[square] pl-6">
                <li><span class="font-bold">We collect only what’s needed</span> to run these public-problem solving processes and improve the platform.</li>
                <li><span class="font-bold">You remain in control.</span> You can access, correct, or delete your data at any time.</li>
                <li><span class="font-bold">We do not sell or monetize your personal data</span>, and we minimize the collection of identifiable data wherever possible.</li>
                <li><span class="font-bold">We share insights from deliberations with civic partners to support community decision-making.</span> These insights are aggregated and do not identify you personally</li>
                <li><span class="font-bold">If you choose, you can stay connected locally.</span> With your permission, we may share your contact information (like your email) with your hosts so they can follow up about this deliberation or related opportunities.</li>
            </ul>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
                For more information, please view the full <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=ba402bb7-5499-4b37-860b-bbb507d3c3c1" class="text-destructive underline" target="_blank" rel="noopener noreferrer">Privacy Policy.</a>
            </p>
        </div>
    </Dialog>
</AppShell>
