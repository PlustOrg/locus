# Building TypeScript Plugins

TypeScript plugins provide the deepest level of integration with Locus. They allow you to extend the compiler, add new CLI commands, and provide custom React components to be used in `.locus` files. This guide is for developers who want to build powerful, reusable integrations.
uilding TypeScript Plugins

TypeScript plugins provide the deepest level of integration with Locus. They allow you to extend the compiler, add new CLI commands, and provide custom React components to be used in `.feature` files. This guide is for developers who want to build powerful, reusable integrations.

## Plugin Anatomy

A Locus plugin is an npm package that exports a specific interface. The `locus` CLI discovers and registers plugins listed in the `Locus.toml` configuration file.

**File Structure of a typical plugin:**

```
locus-plugin-stripe/
├── src/
│   ├── index.ts         # Main plugin entry point
│   ├── commands/
│   │   └── setup.ts     # Definition for `locus stripe setup`
│   └── components/
│       ├── StripeCheckoutButton.tsx # The React component
│       └── index.ts     # Exports components for Locus
├── package.json
└── tsconfig.json
```

## The Plugin Definition File

The main entry point of your plugin (`src/index.ts`) must export a default object that conforms to the `LocusPlugin` interface.

```typescript
// src/index.ts
import { LocusPlugin } from 'locus-plugin-sdk';
import { setupCommand } from './commands/setup';
import { components } from './components';

const stripePlugin: LocusPlugin = {
  name: 'locus-plugin-stripe',
  
  // Register new CLI commands
  commands: [
    setupCommand
  ],

  // Provide new components to the Locus language
  components: {
    // The key is the name used in Locus UI, e.g., <StripeCheckoutButton>
    StripeCheckoutButton: './components/StripeCheckoutButton.tsx'
  },

  // Add custom API endpoints to the backend
  apiRoutes: [
    {
      path: '/api/webhooks/stripe',
      handler: './api/stripe-webhook-handler.ts'
    }
  ],

  // Modify the generated code during compilation
  hooks: {
    // Example: wrap the generated React app in a StripeProvider
    afterGenerate: (config, generatedFiles) => {
      const appJsx = generatedFiles.find(f => f.path.endsWith('pages/_app.jsx'));
      if (appJsx) {
        appJsx.content = `<StripeProvider apiKey={...}>${appJsx.content}</StripeProvider>`;
      }
      return generatedFiles;
    }
  }
};

export default stripePlugin;
```

## Creating a New CLI Command

You can add subcommands to the `locus` CLI.

**`src/commands/setup.ts`:**

```typescript
import { LocusCommand } from 'locus-plugin-sdk';
import { prompt } from 'enquirer'; // For interactive prompts

export const setupCommand: LocusCommand = {
  name: 'stripe:setup',
  description: 'Configures Stripe API keys and webhooks for your project',
  async run(config) {
    console.log('Setting up Stripe for your Locus project...');

    const response = await prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'What is your Stripe secret key?'
      },
      {
        type: 'input',
        name: 'webhookSecret',
        message: 'What is your webhook signing secret?'
      }
    ]);

    // Here you would typically save these to a .env file
    // or update the Locus.toml configuration.
    console.log('Stripe configured successfully!');
  }
};
```

## Providing a Custom UI Component

This is how you can provide a React component to be used in `.feature` files.

**`src/components/StripeCheckoutButton.tsx`:**

```typescript
// This is a standard React component.
// It will be bundled by Locus and made available to your features.
import React from 'react';
import { useStripe } from '@stripe/react-stripe-js';

interface Props {
  // Props are passed from your Locus UI code
  priceId: string;
}

export default function StripeCheckoutButton({ priceId }: Props) {
  const stripe = useStripe();

  const handleClick = async () => {
    if (!stripe) return;
    // Logic to redirect to Stripe checkout
    await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      successUrl: window.location.href,
      cancelUrl: window.location.href,
    });
  };

  return (
    <button onClick={handleClick}>
      Checkout
    </button>
  );
}
```

Now, a user of your plugin can simply write this in their `.locus` file:

```locus
ui {
  <StripeCheckoutButton priceId="price_12345" />
}
```


## Adding an API Route

Plugins can add new endpoints to the generated Express backend.

**`src/api/stripe-webhook-handler.ts`:**

```typescript
// This file exports a function that is a valid Express middleware.
import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req: Request, res: Response) {
  // Logic to handle an incoming webhook from Stripe
  // ...
  res.status(200).send({ received: true });
}
```

## Using a Plugin

To use a plugin, a developer would:

1.  **Install the package:**
    `npm install locus-plugin-stripe`

2.  **Register it in `Locus.toml`:**
    ```toml
    [plugins]
    stripe = "locus-plugin-stripe"
    ```

Once registered, the `locus` CLI will automatically load the plugin, making its commands, components, and API routes available to the project.
