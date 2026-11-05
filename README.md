FC NEXUS 27 — Ultimate Team Intelligence Suite
An advanced, AI-orchestrated companion architecture and tactical management platform engineered for EA Sports FC 27 Ultimate Team. Built on a high-concurrency TypeScript and Bun runtime, FC NEXUS 27 bridges local club telemetry with multi-tiered Gemini intelligence to optimize squad building, track live evolutions, and automate market decisions.
Overview
Managing an Ultimate Team club in FC 27 requires balancing complex tactical chemistry, live card evolution pathways, Squad Building Challenge (SBC) cost efficiency, and club inventory churn. FC NEXUS 27 operates as an intelligent club engine that replaces manual guesswork with automated computational workflows:
Adaptive Model Routing: Routes analytical tasks through a 5-tier intelligent orchestration pipeline powered by Google Gemini, ensuring low-latency parsing for quick queries and heavy reasoning models for multi-variable squad solving.
Live Evolutions Engine: Dynamically calculates attribute stat ceilings, playstyle synergy, and multi-evolution chain paths before committing club resources.
Algorithmic SBC Solver: Uses mathematical constraint satisfaction to solve challenge requirements using untradeable club stock first, minimizing coin burn on the transfer market.
Real-Time Club Sync: Ingests, normalizes, and validates club inventories, trade piles, and duplicates via dedicated parsing endpoints and interactive modal interfaces.
Architecture & Tech Stack
The project structure is scaffolded from the Google AI Studio application blueprint, prioritizing type safety, lightning-fast script execution, and secure serverless data persistence:
Core Runtime & Package Manager: Bun (utilizing bun.lock for deterministic, sub-millisecond dependency resolution).
Primary Language: TypeScript (99.2% codebase coverage ensuring strict end-to-end type validation).
AI Orchestration & Agent Routing: Google AI Studio SDK & Gemini API integrated via a modular 5-tier agent matrix (.agents/).
Backend & Persistence: Cloud Firestore with granular database security boundaries (firestore.rules and firebase-blueprint.json).
Frontend Architecture: Component-driven UI supporting modular club analytics views (HubView, ClubSyncHubModal).
Repository Structure



Plaintext
FC-27-UT-App/
├── .agents/                        # 5-tier AI smart model router & prompt agents
├── .aistudio/                      # AI Studio brain artifacts & implementation specs
├── public/assets/aistudio/         # Application branding, static visual assets, icons
├── src/                            # Core application source code
│   ├── components/                 # UI components (ClubSyncHubModal, HubView, SBC grids)
│   ├── lib/                        # Chemistry engine, math solvers, Firebase client
│   └── routes/                     # Application endpoints & club data parsing routers
├── .env.example                    # Environment variable configuration template
├── bun.lock                        # Deterministic Bun dependency lockfile
├── firebase-applet-config.json     # Firebase deployment & client applet parameters
├── firebase-blueprint.json         # Architectural schema & service map
├── firestore.rules                 # Cloud Firestore declarative security definitions
└── tsconfig.json                   # Strict TypeScript compiler options


Core Features
1. 5-Tier Smart Model Router
Rather than sending every task to a single large language model, the system classifies incoming user queries and squad tasks into five distinct complexity tiers:
Tier 1 (Instant Telemetry): Fast metadata extraction and quick stat lookups.
Tier 2 (Parsing & Normalization): Raw club JSON and transfer payload structuring.
Tier 3 (Tactical Chemistry Engine): Position modifier logic, league/nation link evaluation, and manager boosts.
Tier 4 (Evolutions & Pathfinding): Multi-step upgrade simulations combining stat caps and PlayStyle+ slots.
Tier 5 (Deep Algorithmic SBC Solving): Heavy combinatorial search matching minimum team ratings with unassigned duplicate cards.
2. Club Sync Hub (ClubSyncHubModal)
Direct, secure ingestion endpoints for syncing club inventories.
Automated detection of duplicate untradeables, flagging high-rated duplicates for immediate reinvestment into active SBCs.
Real-time squad status monitors detailing club value, tradable asset distribution, and consumable inventories.
3. Live Evolutions Pathway Tracker
Evaluates active EA FC 27 Evolution chains against current club player telemetry.
Simulates attribute transformations, tracking pace splits, physical boosts, and role proficiency adjustments before starting an evolution slot.
4. Cloud Firestore Security Engine
Enforces strict read/write authorization rules at the database level (firestore.rules).
Secures user-specific squad templates, private club sync tokens, and custom tactical presets against unauthorized cross-user reads.
Getting Started
Prerequisites
Make sure you have Bun installed on your system.
Desktop / Web Development Environment:
Bash
# Verify Bun installation
bun --version


Installation & Local Setup
Step 1: Clone the repository



Bash
git clone https://github.com/Adinkra99/FC-27-UT-App.git
cd FC-27-UT-App


Step 2: Install dependencies



Bash
bun install


Step 3: Configure Environment Variables
Copy the example environment configuration file to create your active .env:



Bash
cp .env.example .env


Open .env and populate your credentials:



Code snippet
# Google AI Studio / Gemini API
GEMINI_API_KEY="your-gemini-api-key"

# Firebase & Firestore Configuration
FIREBASE_API_KEY="your-firebase-api-key"
FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"


Step 4: Launch the Local Development Server



Bash
bun run dev


Navigate to http://localhost:3000 (or the console-designated local port) to interact with the FC NEXUS 27 interface.
Deployment & Workflow Guidelines
Type Verification: Run type verification checks before pushing updates:
Bash
bun run typecheck


Firestore Rules Verification: Ensure modifications to firestore.rules adhere to security scopes prior to deploying through Firebase CLI:
Bash
firebase deploy --only firestore:rules


Computer Science Jargon Glossary
Technical Term
Beginner-Friendly Analogy & Definition
Smart Model Router
The Dispatcher Analogy: Like a postal sorting depot that routes a simple postcard through regular post and a fragile, heavy parcel through a specialized freight truck. It inspects your request and chooses a fast, cheap AI model for simple questions, or a powerful, complex AI model for hard math problems.
Runtime (Bun)
The Engine Room Analogy: If your code is a sheet of musical notes, the runtime is the musician who plays them out loud. Bun is a modern engine that reads and executes JavaScript/TypeScript code noticeably faster than older tools.
Lockfile (bun.lock)
The Blueprint Snapshot Analogy: A locked inventory record that notes the exact version of every single building block used to build the app, guaranteeing it builds identically on every computer without unexpected changes.
Firestore Rules
The Digital Security Guard: A set of gatekeeping instructions stored in the cloud that checks a user's digital ID badge before letting them view or change club data in the database.
Ingestion Endpoint
The Loading Bay Analogy: A dedicated digital doorway in the app designed specifically to receive large deliveries of incoming data (like your club's player list) and inspect them before unpacking.
Modal (ClubSyncHubModal)
The Pop-Up Workstation Analogy: A focused window that temporarily appears over the main screen to let you perform a specific action (like syncing club inventory) without redirecting you away from your page.
TypeScript
The Safety Stencil Analogy: A version of JavaScript with built-in spell-checking and rule validation. It stops errors before the code is even run by checking that numbers stay numbers and player names stay text.
Constraint Satisfaction Solver
The Puzzle Master Analogy: A specialized computer calculation that solves logic puzzles (like an SBC) by trying combinations until all strict requirements (e.g., minimum 85 rating, 3 Premier League cards, lowest coin price) are satisfied.
Deterministic Resolution
The Recipe Guarantee: When an action is guaranteed to give the exact same outcome every time without random surprises, regardless of when or where it is executed.
Combinatorial Search
The Vault Combination Analogy: Testing and evaluating huge numbers of different groupings and arrangements of items (like thousands of potential 11-player squad combinations) to find the single best option.


