PROJECT TITLE
ScribbleX — AI-Structured Real-Time Collaborative Idea Graph
1. FINAL PROJECT DESCRIPTION
Overview

ScribbleX is a real-time collaborative platform built around an infinite, node-based idea graph canvas. It enables multiple users to think, brainstorm, and solve problems visually in a shared space while an AI intelligence layer organizes ideas through semantic clustering and structured summarization.

Unlike chat-based systems that produce linear message streams, ScribbleX structures collective thinking spatially. Ideas are represented as interconnected nodes, forming a dynamic graph that evolves over time. The AI layer assists by identifying semantic similarity between ideas, suggesting clusters, and generating structured summaries.

The platform is designed to prove one core hypothesis:

AI-assisted real-time idea graphs improve collaborative thinking compared to linear communication tools.

Core Value Proposition

Escape linear chat constraints.

Visualize thought structures.

Organize chaotic brainstorming automatically.

Convert visual thinking into structured output.

Preserve the evolution of ideas over time.

Target Use Cases

Startup brainstorming sessions

Product requirement mapping

Academic group discussions

Research collaboration

Strategy planning

Hackathon ideation

2. SYSTEM ARCHITECTURE & DATABASE DESIGN
High-Level Architecture

Frontend:

React-based infinite canvas

CRDT-based collaborative state (Yjs or Automerge)

WebSocket connection to backend

Backend:

Node.js / FastAPI API server

PostgreSQL (relational data)

pgvector extension for embedding storage

Redis (optional, for presence and pub/sub)

AI Microservice:

Sentence-BERT (or similar embedding model)

Clustering algorithm (DBSCAN or K-Means)

Summarization model

Core Architectural Decisions

Relational database for metadata.

Vector storage inside PostgreSQL using pgvector.

CRDT for conflict-free real-time editing.

AI is suggestive, not authoritative.

Clustering is asynchronous and batched.

DATABASE DESIGN (V1)
1. Users

users

id (PK)

name

email

password_hash

created_at

last_active

2. Rooms

rooms

id (PK)

title

description

visibility (public/private)

created_by (FK → users.id)

created_at

is_active

3. Room Participants

room_participants

room_id (FK → rooms.id)

user_id (FK → users.id)

role (host/participant)

joined_at

Composite Primary Key: (room_id, user_id)

4. Nodes

nodes

id (PK)

room_id (FK → rooms.id)

created_by (FK → users.id)

content (text)

tag_type (nullable)

x_position

y_position

vote_count

embedding VECTOR(384 or 768) ← pgvector

cluster_id (nullable FK → clusters.id)

created_at

updated_at

5. Edges

edges

id (PK)

room_id (FK → rooms.id)

from_node_id (FK → nodes.id)

to_node_id (FK → nodes.id)

6. Clusters

clusters

id (PK)

room_id (FK → rooms.id)

label

summary

created_at

7. Snapshots

snapshots

id (PK)

room_id (FK → rooms.id)

summary

created_at

Vector Search Setup

Enable pgvector:

CREATE EXTENSION vector;

Embedding column:

embedding VECTOR(384);

Index:

CREATE INDEX ON nodes USING ivfflat (embedding vector_cosine_ops);

This enables fast semantic similarity search.

REAL-TIME COLLABORATION DESIGN

CRDT Layer:

Shared document per room.

Nodes and edges stored in CRDT state.

Server acts as awareness + persistence layer.

On interval, CRDT state serialized into database.

This prevents:

Race conditions

Node overwrite conflicts

Edge duplication issues

AI PIPELINE (V1)

Trigger conditions:

Node count > threshold

Host clicks “Analyze”

Time interval reached

Steps:

Fetch node embeddings from pgvector.

Perform clustering (approximate nearest neighbor + DBSCAN).

Create cluster entries.

Assign cluster_id to nodes.

Generate cluster label + summary.

Return cluster suggestions to frontend.

Frontend displays ghost bounding boxes.

Host confirms application.

AI never force-moves nodes automatically.

VERSION 1.0 (STRICT FOCUS)
Objective:

Prove that multiplayer AI-structured idea graphs improve collaboration.

V1 Feature Set

Authentication

Room creation via shareable link

Multiplayer infinite canvas

Node creation

Dragging nodes

Manual connections (edges)

Node voting

CRDT-based sync

Embedding generation

Suggestive clustering

Cluster summarization

Timeline playback (basic)

Graph-to-linear export (AI summary to structured text)

V1 Exclusions

Social feed

Follow system

Public discovery

Skill-based matching

Persistent communities

Reputation scoring

Complex moderation tools

Keep it lean.

VERSION 2.0 (PLATFORM EXPANSION)

After V1 stability.

1. Social Graph Layer

Friend requests

User profiles

Room invites

Activity presence

2. Skill-Based Matching System

New Tables:

skills

id (PK)

name

user_skills

user_id

skill_id

proficiency

Matching Algorithm:

MatchScore =
Skill overlap +
Topic similarity (embedding comparison) +
Participation similarity

Use Cases:

Suggest collaborators

Suggest rooms

Balance team composition

3. Community Mode

Rooms can be stabilized.

Add:

room_followers

room_id

user_id

Persistent idea graphs.
Snapshot history.
Cluster indexing.

4. Advanced AI Features

Conflict detection

Node similarity merge suggestions

Contribution analysis

Smart summarization over time

Auto-topic extraction

5. Advanced UX

Smooth graph animation

Role-based permissions

Moderation tools

Performance optimizations

DEVELOPMENT PHASE STRATEGY

Month 1:

CRDT + Canvas

Real-time stable sync

Node & edge management

Month 2:

Embedding pipeline

Clustering engine

Ghost clustering UX

Month 3:

Playback

Export

Performance tuning

Testing & polish

FINAL POSITIONING

V1 is:

An AI-assisted multiplayer idea graph engine.

V2 becomes:

A social collaborative intelligence platform