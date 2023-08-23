# High-level overview of Execution Flows

The below sections provide a high-level overview of the execution different flows for the Safe{Core} Protocol.

## Enable Integration flow

```mermaid
---
title: Safe{Core} Protocol High-level execution flow for enabling Integration
---
flowchart TD;
subgraph Users
   User(User)
end

subgraph SafeAccounts
   User(User) -->|Call manager to enable Sample Plugin| SafeAccount
end

subgraph SafeProtocolManager
    SafeAccount -->|Enable Sample Plugin Tx| Enable_Integration(Enable Integration on a Safe)
    Enable_Plugin --> Validator{Is Sample Integration trusted?<br>Call SafeProtocolRegistry}
    Validator -- Yes --> C(Sample Integration enabled on Safe)
    Validator -- No ----> E(Revert transaction)
end
```



## Transaction execution through Plugin

```mermaid
---
title: Safe{Core} Protocol High-level Plugin execution flow
---
flowchart TD;
   TxExecuteFromPlugin(Call to Plugin to execute tx ) --> ExamplePlugin1
   Safe --> Execute_Transaction_From_Plugin(Execute transaction)
   Validate_ExecuteFromPluginFlow -- Yes --> Safe(Safe Account)
subgraph Plugins
   ExamplePlugin1(Sample Plugin)
end

subgraph SafeProtocolManager
    ExamplePlugin1 -->|Execute tx for a Safe through Plugin| Execute_Transaction(Execute transaction from a Plugin) --> Validate_ExecuteFromPluginFlow{Is Plugin Enabled?<br>Call SafeProtocolRegistry<br>and validate if Plugin trusted}
    Validate_ExecuteFromPluginFlow -- No ----> E(Revert transaction) 
end
```

## Safe transaction execution with Hooks

```mermaid
---
title: Safe{Core} Protocol High-level execution flow through Safe
---
flowchart TD;
subgraph Users
   User(User)
end

subgraph SafeAccounts
   User(User) -->|Execute Safe Tx| SafeAccount
   End
end

subgraph SafeAccount [Safe with SafeProtocolManager enabled as Hook]
   PreCheck_Hook
   PreCheck_Hook("Pre-check Hook") -->|On passing pre-checks| ExecuteTx(Execute Safe Transaction)
   ExecuteTx -->|On successful execution| PostCheckHook(Post-check hook)
   PostCheckHook -->|On passing post checks| End
end
```
## Function Handler

```mermaid
---
title: Safe{Core} Protocol Function Handler execution
---
flowchart TD;
subgraph Users
   User(User)
end

subgraph SafeAccounts [Account]
   User(User) --> |Call a function that is not natively defined in the account|SafeAccount
end

subgraph SafeAccount [Account with Manager enabled as Fallback handler]
   IsFunctionHandlerAdded
   IsFunctionHandlerAdded{"`Is Function Handler added by account for the function selector?`"} -->|Yes| CallFunctionHandler("Call handle() function of the Function Handler")
   IsFunctionHandlerAdded --> |No| Revert
end
```

## Signature Verifier

```mermaid
---
title: Safe{Core} Protocol High-level execution flow for signature verification
---
flowchart TD;
   Sign_Transaction(Signature forward to a smart contract for validation as input)

subgraph Users
   User(User)
end

subgraph SignatureVerifier [Signature verifier enabled for the given Safe]
   isValidSignature(isValidSignature)
   isValidSignature --> |No| E(Revert transaction)
end

Sign_Transaction --> RequestToValidate
RequestToValidate(Call to validate a Signature for given Safe) --> SafeProtocolManager

SafeProtocolManager --> isValidSignature{isValidSignature}

isValidSignature --> |Yes| ExecuteTx(Continue transaction execution)

User("`Users(s)`") --> |Generate a Safe signature| Sign_Transaction
```