<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { goto } from '$app/navigation';
    import { AppShell } from '$lib/components/layout';
    import { SwipeCarousel, Button, InfoOverlay, ZipInput } from '$lib/components/ui';
    import { session } from '$lib/services/session.svelte';

    // --- Valid Utah zip codes (mock validation) ---
    const VALID_UTAH_ZIPS = new Set([
        '84001','84003','84004','84005','84006','84009','84010','84014','84015',
        '84020','84025','84037','84040','84041','84042','84043','84044','84045',
        '84047','84049','84057','84058','84059','84060','84062','84065','84070',
        '84074','84075','84078','84081','84084','84088','84092','84093','84094',
        '84095','84096','84097','84098','84101','84102','84103','84104','84105',
        '84106','84107','84108','84109','84111','84112','84113','84115','84116',
        '84117','84118','84119','84120','84121','84123','84124','84128','84129',
        '84132','84138','84143','84150','84157','84165','84170','84171','84180',
        '84189','84190','84199','84301','84302','84304','84306','84310','84311',
        '84314','84315','84317','84318','84319','84320','84321','84322','84324',
        '84325','84326','84327','84328','84330','84332','84333','84335','84336',
        '84337','84338','84339','84340','84341','84401','84403','84404','84405',
        '84414','84601','84602','84604','84606','84620','84626','84633','84640',
        '84645','84648','84651','84653','84655','84660','84663','84664','84701',
        '84720','84721','84737','84738','84741','84745','84770','84780','84790',
    ]);

    const zipOptions = [...VALID_UTAH_ZIPS];

    const slides = [
        'This conversation is about how Utah can prepare for the growing impact of AI in so many aspects of our lives (work and the economy, education, wellbeing, information quality, government services, etc). ',
        'In this conversation, you’ll see statements from your community about this question. You can vote (agree/disagree) or pass on each one.',
    ];

    const isReturning = session.hasSession;

    // --- Flow steps ---
    let zipCode = $state(isReturning ? session.zipCode : '');
    let hasZip = $state(isReturning && !!session.zipCode);
    let slideIndex = $state(0);
    let joining = $state(false);
    let showHostMessage = $state(false);

    function handleZipSelect(_zip: string) {
        hasZip = true;
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
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/5 w-[160%] aspect-2/1 rounded-t-full bg-linear-to-b from-background/30 to-transparent"></div>

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
            <div class="flex min-h-full flex-col items-center justify-center px-6 sm:px-8 py-4 sm:py-6">
                <span class="text-center font-mono text-base font-medium uppercase text-muted-foreground">
                    A PUBLIC CONVERSATION ON
                </span>
                <h1 class="mt-2 sm:mt-3 text-center font-sans text-4xl font-bold leading-tight text-muted-foreground">
                    AI and the Future of Our Communities
                </h1>

                <div class="mx-auto mt-4 sm:mt-6 h-1 w-20 rounded-full bg-muted-foreground"></div>

                <SwipeCarousel count={slides.length} bind:index={slideIndex} autoScrollMs={4000} class="mt-4 sm:mt-6 w-full">
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
                <ZipInput bind:value={zipCode} options={zipOptions} disabled={isReturning} onSelect={handleZipSelect} />
            </div>

            <Button variant="primary" fullWidth disabled={!hasZip} onclick={handleJoin} class="mt-3">
                {isReturning ? 'CONTINUE' : 'JOIN THE CONVERSATION'}
            </Button>

            <span class="mt-2.5 font-mono text-sm font-medium text-primary/80">POWERED BY BLOOM</span>
        </div>
    </div>

    {#if showHostMessage}
        <div 
            class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            transition:fade={{ duration: 250 }}
        >
            <div 
                class="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onclick={() => (showHostMessage = false)}
                aria-hidden="true"
            ></div>

            <div 
                class="relative w-full max-w-5xl h-full"
                transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
            >
                <InfoOverlay 
                    title="A Message from Your Hosts" 
                    buttonText="GO BACK" 
                    onClose={() => (showHostMessage = false)}
                >
                    <div class="pt-6">
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
                </InfoOverlay>
            </div>
        </div>
    {/if}
</AppShell>