<template>
  <div class="attribution-modal-content">
    <h2>{{ $t('shared.ui.connectionStatus.thanks') }}</h2>
    <p>
      {{ $t('shared.ui.connectionStatus.mapFrom') }}
      <strong>Immersive Paper Map (3rd Edition) - Ckw25</strong>
    </p>
    <p>
      <strong>SureAI</strong>
      {{ $t('shared.ui.connectionStatus.enderal_attr') }}
      <strong>Enderal</strong>
    </p>
    <p>
      {{ $t('shared.ui.connectionStatus.iconsBy') }}
      <strong>game-icons.net</strong>
    </p>
  </div>
</template>

<style scoped lang="scss">
.attribution-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--skyrim-text-primary);
  line-height: 1.6;

  p {
    margin: 0;
  }

  strong {
    color: var(--skyrim-text-accent);
  }
}
</style>
