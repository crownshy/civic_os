<script lang="ts">
    import { fade } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { AppShell } from '$lib/components/layout';
    import { SwipeCarousel, Button, Dialog, Link } from '$lib/components/ui';
    import { session } from '$lib/services/session.svelte';

    const slides: string[] = [
        'This conversation is about how AI can enter the loop of communities, rather than the other way around. We want to hear from everyone, whether you work in technology, care, education, or simply live alongside it.',
        'You will see statements about AI and community life. You can vote: agree, disagree, or pass on each one. There are no wrong answers.',
        'This Open Poll will reveal shared concerns and values. The results will feed directly into live conversations at the Civic AI Conference at Rhodes House, Oxford, and into ongoing work on how AI can support relational health.',
    ];

    const isReturning = session.hasSession;

    // --- Flow steps ---
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
        const success = await session.join('');
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
                    <p class="truncate font-sans text-base font-medium text-primary-foreground">Institute for Ethics in AI, University of Oxford</p>
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
                   How should Civic AI care with — and for — our communities? 
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
            <Button variant="primary" fullWidth disabled={joining} onclick={() => {
                if (hasAgreedToTos) {
                    handleJoin();
                } else {
                    showTermsModal();
                }
            }} class="mt-3">
                {isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
            </Button>
  
		  <span class="mt-2.5 opacity-50 text-center font-mono text-xs font-medium uppercase">

			<p>This is a civic space, not a data marketplace.</p>
			<p>Your data is not sold. Insights are shared anonymously, and you choose if civic partners can
			contact you.</p>
		  </span>
			
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
            <p class="font-sans text-lg font-medium leading-7">
                First, thank you for joining this conversation. We really appreciate your time, perspective, and
willingness to engage. 
            </p>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
                We are a group of researchers, practitioners, and community members who believe that the
people most affected by AI should have the strongest voice in how it is shaped. This Open Poll
is part of a broader initiative called Civic AI, which asks a simple question: how can we make
sure AI works with and for us, our families, our communities, and our societies? 
            </p>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
		AI is already present in our daily lives, from the way health decisions are made to how schools
teach, how employers hire, and how governments deliver services. Some of these changes
bring real benefits. Others raise serious concerns about fairness, jobs, privacy, and the quality
of human relationships.
            </p>
            <p class="mt-4 font-sans text-lg font-medium leading-7">
	We believe that no matter how different our views may be, there is common ground to be found.
This poll is designed to surface that common ground and to identify the real tensions that need
honest conversation.	
            </p>

            <p class="mt-4 font-sans text-lg font-medium leading-7">
		Whether you are a researcher, a care worker, an artist, a student, a parent, or simply someone
who wants to have a say, your perspective matters here.
            </p>
			
			<p class="mt-4 font-sans text-lg font-medium leading-7">
		  If you have questions, please reach out at: <a href='mailto:hi@civic.ai'>hi@civic.ai</a> 

	  </p>
    </Dialog>

    <Dialog
        bind:open={showTermsMessage}
        title="Our Approach to Data"
        buttonText="I AGREE TO THESE TERMS"
        onButtonClick={handleAgreeToTos}
        requireScrollToBottom
    >
        <div class="px-7 pt-6">
            <p class="font-sans text-lg font-medium leading-7">
                We treat your data as part of a shared civic process — not a product to be sold.
            </p>
            <ul class="mt-4 font-sans text-lg font-medium leading-7 list-[square] pl-6">
                <li><span class="font-bold">We collect only what’s needed</span> to run these public-problem solving processes and improve the platform.</li>
                <li><span class="font-bold">You remain in control.</span> You can access, correct, or delete your data at any time by emailing us at: <a href='mailto:au@civic.ai'>au@civic.ai</a></li>
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
