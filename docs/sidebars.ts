import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/project-structure',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core/architecture',
        'core/database',
        'core/services',
        'core/providers',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/products',
        'features/orders',
        'features/cart',
        'features/collections',
        'features/payments',
        'features/shipping',
        'features/assets',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/overview',
        'integrations/job-queue',
        'integrations/events',
        'integrations/sync-runner',
        'integrations/webhooks',
        'integrations/erp-example',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/endpoints',
        'api/form-actions',
      ],
    },
  ],
};

export default sidebars;
