<script lang="ts">
  import { getContext } from 'svelte';

  const { data, xGet, yGet, xScale, yScale, width } = getContext('LayerCake');

  const LABEL_MAX_CHARS = 18;
  const LINE_HEIGHT = 14;

  function barColor(pct: number): string {
    if (pct < 50) return '#ef4444';
    if (pct < 70) return '#f59e0b';
    return '#22c55e';
  }

  function wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
</script>

<g>
  {#each $data as row (row.label)}
    {@const barY = $yGet(row)}
    {@const barH = $yScale.bandwidth()}
    {@const targetWidth = row.target != null ? $xScale(1) : null}
    {@const progressWidth = row.progress != null ? $xGet(row) : 0}
    {@const progressPct = row.progress != null ? Math.round(row.progress * 100) : null}

    <!-- Target background bar -->
    {#if targetWidth != null}
      <rect x={0} y={barY} width={targetWidth} height={barH} fill="var(--muted)" rx="4" />
    {/if}

    <!-- Count progress bar -->
    <rect x={0} y={barY} width={progressWidth} height={barH} fill={progressPct != null ? barColor(progressPct) : 'var(--primary)'} rx="4" opacity="0.85" />

    <!-- % label inside bar at right edge -->
    {#if progressPct != null && progressWidth > 0}
      <text
        x={progressWidth - 6}
        y={barY + barH / 2}
        text-anchor="end"
        dominant-baseline="middle"
        style="font-size: 12px; fill: #fff; font-family: var(--font-mono); font-weight: 600;"
      >
        {progressPct}%
      </text>
    {/if}

    <!-- Category label (left, wrapping) -->
    {@const lines = wrapText(row.label, LABEL_MAX_CHARS)}
    {@const firstLineY = barY + barH / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2}
    <text
      x={-10}
      y={firstLineY}
      text-anchor="end"
      dominant-baseline="middle"
      style="font-size: 13px; fill: var(--foreground); font-family: var(--font-sans);"
    >
      {#each lines as line, i (i)}
        <tspan x={-10} dy={i === 0 ? 0 : LINE_HEIGHT}>{line}</tspan>
      {/each}
    </text>

    <!-- Auxiliary: count / target -->
    <text
      x={$width + 10}
      y={barY + barH / 2 - 7}
      dominant-baseline="middle"
      style="font-family: var(--font-mono);"
    >
      <tspan style="font-size: 9px; fill: var(--muted-foreground);">count </tspan>
      <tspan style="font-size: 11px; fill: var(--muted-foreground);">{row.count}</tspan>
      {#if row.target != null}
        <tspan style="font-size: 9px; fill: var(--muted-foreground);"> · target </tspan>
        <tspan style="font-size: 11px; fill: var(--muted-foreground);">{row.target}</tspan>
      {/if}
    </text>

    <!-- Auxiliary: total -->
    {#if row.total != null}
      <text
        x={$width + 10}
        y={barY + barH / 2 + 7}
        dominant-baseline="middle"
        style="font-family: var(--font-mono);"
      >
        <tspan style="font-size: 9px; fill: var(--muted-foreground);">total </tspan>
        <tspan style="font-size: 11px; fill: var(--muted-foreground);">{row.total}</tspan>
      </text>
    {/if}
  {/each}
</g>
