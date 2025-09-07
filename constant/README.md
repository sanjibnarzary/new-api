# Constant Package (`/constant`)

This directory is solely for placing globally reusable **constant definitions** and does not contain any business logic or dependencies.

## Current Files

| File                 | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `azure.go`           | Defines global constants related to Azure, such as `AzureNoRemoveDotTime` (controls the cutoff time for deleting '.'). |
| `cache_key.go`       | Cache key format strings and Token-related field constants, unifying cache naming conventions. |
| `channel_setting.go` | Channel-level setting keys, such as `proxy`, `force_format`, etc.             |
| `context_key.go`     | Defines the `ContextKey` type and context key constants used throughout the project (request time, Token/Channel/User related information, etc.). |
| `env.go`             | Global variables related to environment configuration, injected during the startup phase based on configuration files or environment variables. |
| `finish_reason.go`   | A collection of `finish_reason` string constants returned by OpenAI/GPT requests. |
| `midjourney.go`      | Midjourney-related error codes and action (Action) constants, and a mapping table from models to actions. |
| `setup.go`           | Indicates whether the project has completed initial installation (`Setup` boolean value). |
| `task.go`            | Constants for various task platforms, actions, and mapping tables from models to actions, such as Suno, Midjourney, etc. |
| `user_setting.go`    | Key constants for user settings and notification types (Email/Webhook), etc.    |

## Usage Conventions

1. The `constant` package **can only be imported by other packages**. **It is forbidden to import other custom packages within this project into this package**. If necessary, only importing the **Go standard library** is allowed.
2. It is not allowed to write any logic code related to business processes, database operations, third-party service calls, etc., in this directory.
3. When adding new types, please keep the naming semantics clear and add a description to the **Current Files** table in this README to ensure team members can quickly understand their purpose.

> ⚠️ Violating the above conventions will lead to unnecessary coupling between packages, affecting code maintainability and testability. Please check your code before submitting.
