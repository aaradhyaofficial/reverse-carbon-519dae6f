Project Overview: Reverse Carbon
This repository contains the source code and configuration for Reverse Carbon, a specialized solution designed to tackle environmental sustainability through automated carbon accounting and tracking.

1. Chosen Vertical: ClimateTech & Carbon Management
  We chose the ClimateTech vertical—specifically focusing on Carbon Insetting/Offsetting and Supply Chain Emissions Tracking.

 Why this Vertical?
 As global regulations tighten and businesses face mounting pressure to report their Scope 1, 2, and 3 emissions, many companies struggle with manual, fragmented data tracking.
 This project aims to bridge the gap by providing an automated, developer-friendly infrastructure to ingest data, compute carbon metrics, and orchestrate verifiable reductions or offsets.

2. Approach and Logic
   The repository leverages a modern TypeScript tech stack coupled with a serverless backend database (Supabase) to ensure reliable, scalable, and atomic state tracking.
   Core Architectural Approach:
    Modular Architecture: Separate directories for frontend components, backend functions (supabase), and application configurations allow for decoupled scaling.
    Type-Safe Core: Built heavily with TypeScript to eliminate runtime execution errors across data schemas and calculations.
    Database-Driven Computations: Utilizing PLpgSQL database functions within Supabase to handle complex mathematical rollups and metrics calculation directly on the server level, minimizing data-transfer latency.

 3. How the Solution Works
   The application operates as a full-stack platform that acts as a central hub for carbon data verification:
   Data Ingestion & Event Emitting: External APIs or file uploads feed data into the system regarding energy usage, shipping metrics, or manufacturing logs.
   Serverless Processing: Supabase Edge Functions parse incoming payloads and validate them against strict schema definitions.
  The Carbon Logic Engine: Data points are passed to database triggers and PLpgSQL scripts that apply localized emission factor algorithms to compute total equivalent metric tons of CO₂.
  UI Visualization: A highly responsive frontend (configured via Vite and modern components) queries the processed metrics to display real-time emission dashboards and carbon-credit accounting tabs.

4. Key Assumptions Made
   To ensure a streamlined initial release, the following assumptions were integrated into the core logic:
   Standard Emission Coefficients: It is assumed that default Greenhouse Gas Protocol (GHG) emission factors are acceptable baselines unless custom regional factors are explicitly declared in the data payload.
   Agnostic Data Ingestion: The solution assumes that pre-ingested third-party ERP or shipping data has undergone basic sanitization prior to reaching our entry edge functions.
   Continuous Supabase Connectivity: The real-time tracking element assumes an always-online connection to the underlying Supabase instance for instant state synchronization.
