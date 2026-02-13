ScribbleX — Collective Thinking Canvas
“Not just collaboration. Structured collective intelligence.”
1️⃣ What Is ScribbleX?

ScribbleX is a real-time collaborative thinking platform where multiple users join a shared canvas to brainstorm, sketch, and write ideas together.

But unlike Miro, Jamboard, or a normal whiteboard…

👉 ScribbleX doesn’t just let people draw.
👉 It understands what’s being written.
👉 It organizes ideas automatically.

It adds an AI intelligence layer on top of collaboration.

2️⃣ The Core Problem

When people brainstorm together:

The board becomes messy

Ideas overlap

Topics mix randomly

Important thoughts get buried

After the session, the board is unusable

Most collaborative tools are:

Real-time ✔

But not intelligent ❌

There is no structure.

Once people leave, the board becomes digital garbage.

3️⃣ What Makes ScribbleX Different?

ScribbleX turns:

Chaotic brainstorming
into
Structured collective intelligence

Instead of a static whiteboard, it becomes a living idea system.

4️⃣ How It Works (Conceptually)

Imagine 5 people in a room writing ideas:

User A writes:

“AI for healthcare”

User B writes:

“ML model for disease detection”

User C writes:

“Hospital automation system”

Normally:
All of this is random text on a board.

In ScribbleX:
The system detects that these ideas are semantically related.

It automatically:

Clusters them visually

Labels the cluster as “Healthcare AI”

Groups them spatially

Suggests connections

The canvas evolves.

5️⃣ Core Features (Detailed)
🔴 1. Live Multi-User Canvas

Real-time drawing

Real-time typing

WebSocket-powered updates

Low-latency synchronization

Users can:

Draw strokes

Add sticky notes

Move elements

Connect ideas

🟢 2. Room-Based Collaboration

Users create or join rooms

Each room has:

Owner

Members

Public/private toggle

JWT-authenticated access

Role-based control

This allows:

Team brainstorming

Classroom collaboration

Hackathon planning

🔵 3. Automatic Idea Clustering (ML Layer)

This is the heart of the project.

When text is added:

Convert text → embedding (Sentence-BERT)

Compare semantic similarity

Apply clustering (K-means / DBSCAN)

Group similar thoughts

Example:

“Startup funding”
“Seed capital”
“Angel investors”


System clusters them under:
“Funding”

🟣 4. Theme Detection & Highlighting

The system:

Detects dominant topics in the room

Highlights emerging themes

Suggests labels

Adjusts color coding dynamically

The canvas becomes self-organizing.

🟡 5. Ephemeral vs Persistent Rooms

Two room types:

Ephemeral

Temporary

Auto-deletes after inactivity

Useful for quick brainstorming

Persistent

Saved in database

Version history

Reopen anytime

Idea evolution tracking

6️⃣ ML & Intelligence Layer (Technical Depth)

This is where your project becomes final-year level.

✨ Semantic Embeddings

Using:

Sentence-BERT

OpenAI embeddings

Local embedding model

Transforms text into vector space.

✨ Spatial Clustering

Combines:

Text similarity

Canvas position

Temporal proximity

To determine:
Which ideas belong together.

✨ Topic Modeling

Uses:

LDA

BERTopic

HDBSCAN clustering

To extract dominant themes.

✨ Temporal Decay

Old inactive ideas:

Fade visually

Lose cluster priority

De-prioritize over time

So canvas reflects current thinking.

7️⃣ System Architecture (Your Actual Stack)
🖥 Frontend

React

Canvas API or WebGL

WebSocket client

Minimal, Gen-Z aesthetic UI

Handles:

Drawing

Idea creation

Real-time updates

Visual clustering

⚙ Backend

Fastify (Node.js)

WebSockets

JWT authentication

Room management

Prisma ORM

Neon PostgreSQL

Handles:

Auth

Room system

Real-time broadcast

Data persistence

🤖 ML Layer

Separate service:

Python FastAPI

Sentence-BERT

Clustering algorithms

Embedding similarity search

Backend communicates with ML service via API.

🗄 Database

PostgreSQL (persistent rooms, users)

Redis (optional real-time pub/sub scaling)

8️⃣ Why This Is a Strong Final-Year Project

Because it combines:

Real-time systems

WebSockets

Database modeling

Authentication flow

ML embeddings

Clustering algorithms

UI/UX design

Distributed architecture thinking

It’s not just CRUD.

It’s system-level engineering.

9️⃣ Product Vision

Long term:

ScribbleX could evolve into:

AI-powered brainstorming tool

Research collaboration platform

Startup ideation board

Classroom intelligent whiteboard

Collective knowledge builder
