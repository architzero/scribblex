Working Tagline
“Where ideas play together.”
One-Line Description
An infinite collaborative canvas with spatial audio and public rooms — designed to make online interaction feel alive, social, and creative.

1. Product Vision
Most digital collaboration tools are:
Static


Corporate


Meeting-driven


Ephemeral


This product reimagines collaboration as:
Spatial


Persistent


Social


Playful


Instead of joining a video call, users enter a shared creative space.
Instead of meetings ending, rooms evolve.
Instead of isolated whiteboards, canvases become discoverable communities.

2. Core Identity
The product rests on three non-negotiable pillars:
1️⃣ Spatial Audio Presence
Users hear each other based on distance — creating natural conversational clusters.
2️⃣ Living Rooms
Rooms don’t disappear after sessions — they evolve, archive, and grow.
3️⃣ Public Discovery
Users can browse and spectate active canvases like social media.
This is not a productivity tool first.
 It is a social creative environment.

3. MVP (Phase 1 Launch)
The MVP must feel:
Alive


Intuitive


Social


Smooth


A. Infinite Canvas Core
Infinite pan and zoom


Momentum-based object physics (throw and drag naturally)


Real-time multiplayer sync (<100ms target latency)


Real-time cursors with names + avatars


Drawing tools:


Pen


Shapes


Text


Sticky notes


Image upload


Undo/redo with time history slider


Mobile + desktop optimized


No advanced physics modes yet. Just smooth, satisfying movement.

B. Spatial Audio (Core Differentiator)
WebRTC-based proximity audio:
Distance-based volume attenuation


Avatar glow when speaking


Subtle ripple animation while talking


Double-tap avatar to mute


“Party Mode” toggle (everyone hears everyone equally)


No music zones in MVP.
 No complex whisper/broadcast logic initially.
Polish > complexity.

C. Rooms System (Clean Architecture)
Room Types
1. Community Rooms (Platform-Owned)
Always available


Themed (e.g., Daily Sketch, Brainstorm Hub)


Auto-reset every 24 hours


Archived automatically


Purpose: Keep platform alive.

2. User Rooms (Host-Created)
When creating a room, host selects:
Ephemeral Room


Auto-clears after selected time


Persistent Room


Saved indefinitely


Can archive manually


Rooms never feel cluttered because content can expire or archive.

D. Social Discovery
Explore Page includes:
🔥 Live Now (real-time activity count)


🏷️ Interest tags


Spectator mode before joining


Follow creators


Follow rooms


Rooms display:
Live participant count


Activity pulse animation



E. Sketch Rush (Single Game Mode)
A simple, polished game:
Everyone receives same prompt


60-second timer


Anonymous voting


Winner receives session crown icon


Auto time-lapse generated


No AI judging.
 No complex modes.
 One game done extremely well.

F. Clips Library
Users can:
Select any element


Save to personal “Clips”


Reuse in other rooms


Export as image


Save area snapshot


This supports the “Living Rooms” concept without permanent clutter.

G. Memory Snapshots
Save full canvas snapshot


Time-lapse export (30s / 60s)


Shareable link


Rooms evolve but moments are preserved.

🌱 4. Phase 2 – Engagement Expansion
After MVP gains traction:
A. Light AI Organization
“Smart Suggest” button:
Group by color


Cluster by text similarity


Organize by timeline


Preview before applying.
 One-click undo.
No automatic chaos meter yet.

B. Scrapbook Mode
Upload photo as canvas background


Collaborative doodling


Reaction bubbles on photos


“Memory Wall” inside profile



C. Collaboration Circles
Private mini-communities:
5–20 members


Shared template library


Private rooms


Visual equivalent of small Discord servers.

D. Portal System
Create shortcuts between canvas regions:
Mark A and B


Swirl animation


Two-way jump


Label portals


Useful for large canvases and guided tours.

🧠 5. Phase 3 – Intelligence & Creative Depth
A. Smart Meeting Mode
When enabled:
Audio transcription


AI-detected:


Decisions


Action items


Questions


Highlighted zones on canvas


Search by speaker or topic


Export summary document


This becomes your “Why not Zoom?” answer.

B. Guided Presentation Mode
Record navigation path


Add voiceover


Zoom-based storytelling


Interactive Q&A mode


Non-linear flow


Better than slide decks because canvas is spatial.

C. Advanced Search
Search by:
Keywords


Creator


Date range


Color


Shape


Natural language queries


Search results:
Canvas highlights


Mini-map pins


Jump navigation



D. Invisible Ink Mode
Hidden content mechanics:
Hover reveals


Click to unlock


Timed release


Used for games, secrets, surprises.

E. Night Mode / Dream Mode
Opt-in late night theme:
Soft ambient UI


No notifications


“Drop a dream” quick capture


Morning AI synthesis summary


Designed for night owls.

F. Canvas DNA Matching (Experimental)
Analyze user behavior:
Tool usage


Color patterns


Collaboration style


Suggest compatible collaborators.
Not launch-critical.

🏘️ 6. Living Rooms Model (Final Explanation)
Rooms are:
Not static boards.
 Not disposable meetings.
They are:
Persistent spaces with evolving states.
Structure:
Active State


Archived State


Snapshot History


Users can:
Clear canvas


Archive session


Restore older version


Rooms feel alive, not cluttered.

📈 7. Retention & Growth Loops
Retention mechanisms:
Daily themed public rooms


Time-lapse sharing on social media


Follow favorite creators


Collaboration circles


Weekly trending rooms highlight


Growth vector:
Public room discovery → Spectate → Participate → Follow → Return.

🔐 8. Privacy & Safety Model
Visibility Levels:
Public


Unlisted


Private (invite only)


Safe Mode (Under 18):
Profanity filter


Image moderation


Restricted DMs


Optional time limits


Universal:
Report system


Block users


Strike system


Admin review


Session management


Moderation AI introduced gradually.

🏗️ 9. Technical Architecture
Frontend
React + TypeScript


Canvas rendering: Konva.js (better abstraction) or Fabric.js


Zustand (lighter than Redux)


WebRTC for audio


WebSockets (Socket.io or Ably)


Backend
Node.js + Fastify


PostgreSQL (primary storage)


Redis (real-time cache)


S3 / Cloudflare R2 (file storage)


Infrastructure
Vercel (frontend)


Railway / Render (backend)


Cloudflare CDN


Sentry (monitoring)


PostHog (product analytics)


Performance is critical:
Delta-based canvas updates


CRDT or operational transform for conflict resolution


Audio latency optimization



10. Final Positioning
Primary Target:
 Ages 16–30
 Friend groups
 Creative hangouts
 Online communities
Secondary:
 Small teams
 Creators
 Workshops
Core Differentiation:
Spatial audio makes it feel real.


Public rooms make it social.


Persistent canvases make it meaningful.




