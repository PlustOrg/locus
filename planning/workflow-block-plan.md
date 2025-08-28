## Unified Blueprint: The Locus `workflow` Block

### Purpose & Philosophy
The `workflow` block is a first-class, declarative construct for backend business processes—background jobs, orchestrations, and automations. It is designed for clarity, type-safety, and deterministic code generation, with world-class error reporting. All major blocks (`trigger`, `input`, `state`, `steps`, `on_error`, `concurrency`) follow the same block-based, top-down structure as `page` and `component`.

**Key Tenets:**
- Clarity: One file, one process, explicit data flow, no hidden state.
- Consistency: Block and directive syntax matches the rest of Locus (`on:create`, `forEach`, `run`, etc.).
- Flexibility: Supports multiple trigger types, custom step plugins, and future extensibility.
- Power: Built-in support for retries, concurrency, error handling, and integration with job queues/serverless.
- Ease of Use: Pinpoint error messages, deterministic output, and strong validation.

### Top-Level Structure
All blocks except `trigger` and `steps` are optional. Example:
```locus
workflow <WorkflowName> {
  trigger { ... }
  input { ... }
  state { ... }
  steps { ... }
  on_error { ... }
  concurrency { ... }
}
```

### Block Details & Final Decisions

#### Trigger Block
- **Syntax:**
  - `on:create(Entity)`
  - `on:update(Entity) where: { ... }`
  - `on:delete(Entity)`
  - `on:schedule(cron: "...")` or `on:schedule(rate: "...")`
  - `on:webhook` (secure endpoint, API key by default; signed payloads in future)
  - `on:dispatch` (manual/programmatic)
- **Multiple triggers allowed** (OR-combined), but only if compatible (e.g., not `webhook` + `create`).
- **Context:** `trigger` object (fields depend on trigger type).

#### Input Block
- **Schema:** Same as `entity`/`state` blocks. Primitives, inline objects, lists. Defaults allowed.
- **Validation:** Always enforced before first step. Exposed as `input.<field>`, read-only.

#### State Block
- **Schema:** Same as `input`. Defaults allowed. Read-only in MVP; future: explicit `update_state` step.

#### Steps Block
- **Step Types:**
  - `run <action>(...)`
  - `send_email { ... }`
  - `http_request <name>? { ... }`
  - `delay { for: "..." | until: ... }`
  - `branch { condition: { ... } steps { ... } else { ... } }`
  - `forEach <item> in <list> { ... }`
- **Control:** Only `const` bindings (no `let`). All bindings visible to subsequent steps; shadowing disallowed.
- **Naming:** Use `forEach` (camelCase) for workflow loops; keep `for:each` for UI.
- **Expressions:** MVP uses raw token bag; future: minimal expression parser for better diagnostics.

#### Data Flow
- Resolution order: local `const` → `input.` → `state.` → `trigger.` → previous step results.
- All references must be explicit; shadowing is a compile error.

#### Error Handling (`on_error` Block)
- **Retry:**
  - `retry { max_attempts: N strategy: exponential_backoff(initial_interval: "...") }`
  - Only applies if specified; default is no retry.
  - Pluggable strategies; unknown strategy is a validation error.
- **on_failure:**
  - Mini steps block; can use `run`, `http_request`, `send_email`.

#### Concurrency Block
- **Fields:**
  - `group: <expr>` (default: workflow name)
  - `limit: <int>` (default: 1 if group specified)
  - `policy: "queue" | "drop" | "cancel"` (default: "queue")
  - `timeout: "..."` (future)
- **Validation:** `limit >= 1`; `cancel` policy emits warning if backend doesn't support.

#### Extensibility & Plugins
- Hooks: `onWorkflowParse`, `onWorkflowValidate`, `registerWorkflowStep(kind, schema, codegenFn)`.
- Step plugins sorted lexicographically for deterministic output.

#### MVP Implementation Scope
- Triggers: create, update (with where), schedule (cron), dispatch.
- Steps: run, http_request, delay, branch (no nested branch in branch for MVP), forEach.
- Input validation, basic retry, concurrency (group/limit/policy).
- Deferred: webhook, send_email, on_failure multi-step, state mutability, cancel policy, nested branch, inline object schema in lists.

#### Example
<!-- skip-validate -->
```locus
workflow onNewPaidOrder {
  trigger {
    on:update(Order) where: { record.status == "paid" && old_record.status != "paid" }
  }
  input { notifyFinance: Boolean = true }
  concurrency { group: trigger.record.id limit: 1 policy: "queue" }
  steps {
    const lineItems = run getOrderLineItems(orderId: trigger.record.id)
    const erpResult = http_request sync_to_erp {
      method: "POST"
      url: env(ERP_API_URL)
      body: { orderId: trigger.record.id, items: lineItems }
    }
    branch {
      condition: { erpResult.status_code == 200 }
      steps {
        forEach item in lineItems {
          branch {
            condition: { item.product.type == "digital" }
            steps { run grantDigitalProductAccess(customerId: trigger.record.customerId, productId: item.product.id) }
          }
        }
      }
      else {
        run createManualReviewTask(orderId: trigger.record.id, reason: "ERP sync failed: {erpResult.status_code}")
      }
    }
  }
  on_error {
    retry { max_attempts: 3 strategy: exponential_backoff(initial_interval: "1 minute") }
    on_failure { run createAlert(message: "Failure in onNewPaidOrder for {trigger.record.id}") }
  }
}
```

#### Validation & Error Surfaces
- Unknown step kind → "Unknown workflow step 'FOO_STEP'. Did you mean 'http_request'?"
- Missing trigger block → error.
- Incompatible triggers (e.g., webhook + create) → error.
- Shadowed binding → error.
- Invalid concurrency (limit: 0) → error.
- Retry strategy typo → suggestion.

#### Code Generation
Target: deterministic manifest for each workflow, suitable for queue/serverless backends. Example:
```ts
registerWorkflow({
  name: 'onNewPaidOrder',
  trigger: { type: 'entity.update', entity: 'Order', where: 'record.status == "paid" && old_record.status != "paid"' },
  steps: [ ... ],
  retry: { maxAttempts: 3, strategy: { type: 'exponential', initial: '1 minute' } },
  concurrency: { group: '$trigger.record.id', limit: 1, policy: 'queue' }
});
```

#### Open Questions
- Webhook security: API key (default) vs signed payloads (future)?
- State mutation: explicit `update_state` step or only via action return?
- Time semantics: canonical duration grammar (ISO8601 or short units)?
- Expression language: minimal parser for better error spans?
- Cancellation hooks: add `on_cancel` in future.

#### Next Steps
1. Token + grammar scaffold for all blocks and step kinds.
2. AST + merger updates, error location propagation.
3. Validator rules for binding, triggers, step kinds.
4. Codegen stub (JSON manifest), build integration.
5. Basic executor for tests; queue backend later.
6. Retry/concurrency simulation tests.
7. Extend with http_request, branch, forEach.
8. Plugin step registration API.

### Top-Level Structure

A workflow is defined in its own `.locus` file (e.g., `onboarding.workflow.locus`) or alongside other blocks.

```locus
workflow <WorkflowName> {
  // 1. Trigger: What starts this workflow?
  trigger { ... }

  // 2. Input (Optional): Defines the data the workflow expects.
  input { ... }

  // 3. State (Optional): Defines a schema for the workflow's internal state.
  state { ... }

  // 4. Steps: The sequence of actions to perform.
  steps { ... }

  // 5. Error Handling: Defines what to do when a step fails.
  on_error { ... }
  
  // 6. Concurrency (Optional): Defines how to handle multiple runs.
  concurrency { ... }
}
```

---

### 1. The `trigger` Block (Required)

This block defines the event that initiates the workflow. Only one trigger is allowed per workflow.

#### Trigger Types:

*   **Database Events:** Runs when data is created, updated, or deleted.
    ```locus
    trigger {
      // Runs when a new Order is created
      on:create(Order)
      
      // Runs only when an Order's status is changed to "paid"
      on:update(Order) where: {
        record.status == "paid" && old_record.status != "paid"
      }
    }
    ```
    *   **Context:** Provides `trigger.record` (the new entity state) and `trigger.old_record` (for updates).

*   **Scheduled Events:** Runs on a recurring schedule.
    ```locus
    trigger {
      // Runs at midnight every day
      on:schedule(cron: "0 0 * * *")
      
      // Runs every 5 minutes
      on:schedule(rate: "5 minutes")
    }
    ```

*   **Webhook (API Endpoint):** Exposes a secure, unique URL to be called by external services.
    ```locus
    trigger {
      on:webhook
    }
    ```
    *   The compiler generates the URL and handles authentication (e.g., API key).
    *   **Context:** Provides `trigger.payload`, `trigger.headers`, and `trigger.query_params`.

*   **Manual Dispatch:** Allows the workflow to be started from a Locus `action`.
    ```locus
    trigger {
      on:dispatch
    }
    ```
    *   This generates a global `dispatch(WorkflowName, input)` function that can be called from any backend `action`.

### 2. The `input` Block (Optional)

For `webhook` and `dispatch` triggers, this block defines the expected data schema, providing type-safety and validation.

```locus
input {
  customerId: String
  products: list of { productId: String, quantity: Integer }
  sendWelcomeEmail: Boolean = true // With default values
}
```

### 3. The `steps` Block (Required)

This is the heart of the workflow, defining a sequence of operations. Steps are executed in order.

#### Built-in Step Types:

*   **`run`**: Execute a custom, server-side Locus `action`. This is the primary way to interact with your own business logic and database.
    ```locus
    // Runs an action defined elsewhere in the Locus project
    const updatedUser = run getUserAndEnrich(userId: trigger.record.id)
    ```

*   **`send_email`**: A declarative, high-level step for sending emails.
    ```locus
    send_email {
      to: trigger.record.customer.email
      subject: "Your order #{trigger.record.id} has been confirmed!"
      // Points to a template file, with variables automatically injected
      template: "emails/order_confirmation.html"
      // You can pass additional data to the template
      with: {
        customerName: trigger.record.customer.name,
        orderTotal: trigger.record.total
      }
    }
    ```

*   **`http_request`**: Make a call to an external API.
    ```locus
    const sapData = http_request "update_sap" {
      method: "POST"
      url: "https://api.sap.com/v1/orders"
      headers: { Authorization: env(SAP_API_KEY) }
      body: { orderId: trigger.record.id, amount: trigger.record.total }
    }
    ```
    *   The result (e.g., `sapData.body`, `sapData.status_code`) is available to subsequent steps.

*   **`delay`**: Pause the workflow for a duration or until a specific time.
    ```locus
    delay { for: "24 hours" }
    // or
    delay { until: trigger.record.trialExpiresAt }
    ```

*   **`branch`**: Conditional logic to execute different steps.
    ```locus
    branch {
      condition: { trigger.record.total > 1000.00 }
      
      // 'if' block
      steps {
        run assignVipStatus(customerId: trigger.record.customerId)
      }
      
      // 'else' block (optional)
      else {
        send_email { to: "sales@example.com", subject: "Review order..." }
      }
    }
    ```

*   **`forEach`**: Loop over a list of items.
    ```locus
    const productList = find(Product, where: { ... })
    
    forEach item in productList {
      // The 'item' variable is available inside the loop
      run updateInventory(productId: item.id)
    }
    ```

### 4. Data Flow

Data flows through the workflow explicitly:
1.  The `trigger` object is globally available.
2.  Steps can be assigned to constants (`const result = ...`).
3.  The output of a named step can be referenced by subsequent steps using dot notation (e.g., `result.body.id`).

### 5. The `on_error` Block (Optional)

Defines a global error handling strategy for any step that fails.

```locus
on_error {
  // Retry the failed step up to 5 times
  retry {
    max_attempts: 5
    // With exponential backoff: 10s, 20s, 40s...
    strategy: exponential_backoff(initial_interval: "10 seconds")
  }
  
  // After all retries fail, run this logic
  on_failure {
    // Send a notification to a Slack channel
    http_request "notify_slack" {
      url: env(SLACK_WEBHOOK_URL)
      body: { text: "Workflow '{workflow.name}' failed on step '{error.step}' for run '{workflow.runId}'. Error: {error.message}" }
    }
  }
}
```

### 6. The `concurrency` Block (Optional)

Manages how many instances of a workflow can run simultaneously. This is crucial for preventing race conditions.

```locus
concurrency {
  // Use a value from the trigger to group runs.
  // Here, only one workflow will run at a time for any given customer ID.
  group: trigger.record.customerId

  // Max number of concurrent runs within the group
  limit: 1

  // What to do if the limit is reached
  // "queue": Wait for the current run to finish. (Default)
  // "drop": Ignore the new workflow run.
  // "cancel": Stop the currently running job and start the new one.
  policy: "queue"
}
```

---

### Comprehensive Example: A New Paid Order Workflow

```locus
// file: paid_order.workflow.locus

workflow onNewPaidOrder {
  // TRIGGER: Runs when an Order is updated and its status becomes "paid"
  trigger {
    on:update(Order) where: {
      record.status == "paid" && old_record.status != "paid"
    }
  }

  // CONCURRENCY: Ensure we only process one workflow per order at a time
  concurrency {
    group: trigger.record.id
    limit: 1
  }

  // STEPS: The main logic of the workflow
  steps {
    // 1. Fetch the line items for the order using a Locus action
    const lineItems = run getOrderLineItems(orderId: trigger.record.id)

    // 2. Try to update the external ERP system
    const erpResult = http_request "sync_to_erp" {
      method: "POST"
      url: env(ERP_API_URL)
      body: {
        orderId: trigger.record.id,
        customerEmail: trigger.record.customer.email,
        items: lineItems
      }
    }

    // 3. Check if the ERP sync was successful
    branch {
      condition: { erpResult.status_code == 200 }

      // 3a. IF SUCCESSFUL: Fulfill digital products immediately
      steps {
        forEach item in lineItems {
          branch {
            condition: { item.product.type == "digital" }
            steps {
              run grantDigitalProductAccess(
                customerId: trigger.record.customerId,
                productId: item.product.id
              )
            }
          }
        }
      }
      
      // 3b. ELSE: Create a task for manual review
      else {
        run createManualReviewTask(
          orderId: trigger.record.id,
          reason: "ERP sync failed with status {erpResult.status_code}"
        )
      }
    }

    // 4. Send the confirmation email to the customer
    send_email {
      to: trigger.record.customer.email
      subject: "Thank you for your order!"
      template: "emails/order_paid.html"
      with: { order: trigger.record }
    }
  }

  // ERROR HANDLING: If any step fails, retry and then notify
  on_error {
    retry { max_attempts: 3, strategy: exponential_backoff(initial_interval: "1 minute") }
    on_failure {
      run createAlert(message: "Critical failure in onNewPaidOrder workflow for order {trigger.record.id}.")
    }
  }
}
```

### Tooling Integration

*   **CLI:** `locus workflow list`, `locus workflow trigger <name> --input '{...}'` for manual runs.
*   **Dev UI:** The Locus dev mode would include a UI for viewing all workflow runs, inspecting their state, seeing logs for each step, and re-running failed workflows. This visual feedback is essential for debugging.