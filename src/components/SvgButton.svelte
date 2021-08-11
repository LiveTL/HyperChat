<script lang="ts">
  import { Button, Icon } from 'smelte';

  /** Padding of the Button component in Tailwind units. Default: 1.5 */
  export let padding = '1.5';
  /** SVG size. Default: 20px */
  export let size = '20px';
  /** SVG Path. */
  export let path = '';
  /** Color of the Button componenet. Default: blue */
  export let color = 'blue';
  /** Classes to add the the Button component. */
  export let add = '';
  /** Classes to remove from the Button component. */
  export let remove = '';
  /** Transparent button background. */
  export let transparent = false;
</script>

<Button
  add="p-{padding} rounded-full {add}"
  remove="py-2 px-4 uppercase text-sm font-medium rounded {remove}"
  color={color}
  text={transparent}
  on:click
>
  <Icon class="flex items-center">
    <svg
      xmlns="http://www.w3.org/2000/svg" 
      class="fill-current"
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      <path d={path} />
    </svg>
  </Icon>
</Button>
