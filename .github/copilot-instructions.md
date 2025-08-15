# Instructions for Locus Development

Your mission is to build the Locus compiler by strictly following the development plan and adhering to the language specifications outlined in the documentation.

## 1. Your Core Mission

Your primary objective is to implement the Locus source-to-source compiler. This compiler will be written in **TypeScript** and will transform `.locus` files into a full-stack web application (Next.js and Express).

## 2. The Golden Path: Your Development Plan

**Your single most important file is `docs/development-plan.md`.**

*   **Follow it Strictly:** Execute the phases and steps in the exact order they are presented. Do not skip steps or work on features out of sequence.
*   **Test-Driven Development (TDD) is Mandatory:** The plan requires a strict TDD workflow. For every new feature, you must:
    1.  **Write Failing Tests First:** Implement the test cases described in the plan.
    2.  **Run and Verify Failure:** Confirm that the new tests fail as expected.
    3.  **Write Implementation Code:** Write the minimum amount of compiler code required to make the tests pass.
    4.  **Run and Verify Success:** Ensure all tests for the current step are passing before moving on.

## 3. The Source of Truth: Documentation

The `docs/` directory contains the complete specification for the Locus language. When implementing a feature, refer to the relevant documentation file to understand the required syntax, behavior, and semantics. The development plan provides direct links to the relevant documents at each step.

*   **Language Specs:** `docs/language/`
*   **Toolchain Specs:** `docs/toolchain/`
*   **Design System Specs:** `docs/design-system/`

## 4. Important Notes & Tips for Success

*   **Tech Stack:** Use the recommended tech stack from the development plan for building the compiler: **TypeScript, Jest, Chevrotain (for parsing), and Commander.js (for the CLI).** Do not introduce other major dependencies without a compelling reason.
*   **Focus:** Concentrate on one step at a time. The plan is designed to be incremental. Completing each step fully will ensure a stable foundation for the next.
*   **No Assumptions:** Do not add features or make design decisions that are not specified in the documentation. Your task is to build Locus as it is defined.
*   **Generated Code:** Remember that you are building a *generator*. The target code (React, Express) should be produced by your compiler, not written manually. Your tests will involve asserting that the correct code *strings* are generated.
*   **Workspace:** Your working directory is the root of the `locus-compiler` project that you will create as the first step of the development plan. All file paths should be relative to that root.

Your goal is to methodically and accurately bring the Locus language to life. Adhere to the plan, trust the documentation, and follow the TDD process.
