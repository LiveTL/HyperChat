<script lang='ts'>
  import Button, { Label } from '@smui/button/styled';
  import Tooltip, { Wrapper } from '@smui/tooltip/styled';

  const disabled = localStorage.getItem('HC:ENABLED') === 'false';

  const onClick = () => {
    localStorage.setItem('HC:ENABLED', disabled ? 'false' : 'true');
    location.reload();
  };

  const logo = chrome.runtime.getURL(('assets') + '/logo-48.png');
</script>

<div class="container">
  <Wrapper>
    <Button
    on:click={onClick}
    class="button-shaped-round"
    color="secondary"
    variant="outlined"
    ripple={false}
    style="height: 28px; border-radius: 4px; padding: 4px 10px; margin: -2px 0;"
    >
      <img src={logo} alt="hc-logo"/>
      <div class="hc-label" class:disabled>
        <Label>HC</Label>
      </div>
    </Button>
    <Tooltip xPos="center">{disabled ? 'Enable' : 'Disable'} HyperChat</Tooltip>
  </Wrapper>
</div>

<style>
  .container {
    float: right;
  }

  .hc-label {
    font-size: 15px;
    color: #30acff;
  }

  .hc-label.disabled {
    color: #676778;
  }

  img {
    width: 30px;
    height: 30px;
    margin: -3px 0;
    margin-right: 4px;
  }

  :global(yt-live-chat-app) {
    min-height: 0px;
    min-width: 0px;
  }
</style>
