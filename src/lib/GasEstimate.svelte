<script lang="ts">
  import { formatPrimaryToken } from '../config'

  export let estimatedGasCost: bigint
  export let label: string
</script>

<div class="gas-estimate">
  <span>{label}</span>
  <span class="dot-line"></span>
  <span>{formatPrimaryToken(estimatedGasCost)}</span>
</div>

<style>
  .gas-estimate {
    padding: 0.5rem;
    font-size: small;
    opacity: 0.8;
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .gas-estimate > .dot-line {
    flex-grow: 1;
    border-bottom: 1px dotted currentColor;
    opacity: 0.5;
  }
</style>
