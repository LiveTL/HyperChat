<script lang="ts">
  import { Tooltip } from 'smelte';

  type AnchorValues = 'left' | 'center' | 'right';
  /** Horizontal padding in Tailwind units. Default: '2' */
  export let px = '2';
  /** Vertical padding in Tailwind units. Default: '2' */
  export let py = '2';
  /** Top margin in Tailwind units. Default: '1' */
  export let mt = '1';
  /** Background color. Default: 'gray-600' */
  export let bgColor = 'gray-600';
  /** Text color. Default: 'gray-50' */
  export let textColor = 'gray-50';
  /** Position to anchor to. Default: 'center' */
  export let anchor: AnchorValues = 'center';

  const makeAnchorClass = (anchor: AnchorValues) => {
    switch (anchor) {
      case 'left':
        return 'left-0';
      case 'center':
        return 'left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'right-0';
      default:
        console.error(`Invalid anchor ${anchor}`);
        return '';
    }
  };

  $: positionClass = makeAnchorClass(anchor);
  $: classes = 'whitespace-nowrap absolute rounded z-30 shadow ' +
    `mt-${mt} bg-${bgColor} text-${textColor} px-${px} ` +
    `py-${py} ${positionClass}`;
</script>

<Tooltip classes={classes}>
  <slot name="activator" slot="activator" />
  <div style="font-size: 0.75em;">
    <slot />
  </div>
</Tooltip>
