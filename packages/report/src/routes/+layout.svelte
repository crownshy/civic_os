<script lang="ts">
	import { UmamiAnalytics } from '@lukulent/svelte-umami';
	import '../app.css';

	let { children } = $props();
</script>

<UmamiAnalytics
	websiteID="b1935676-9b40-42e1-add3-6fd0fbdc0e55"
	srcURL="https://cloud.umami.is/script.js"
/>

{@render children()}
