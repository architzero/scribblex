# ScribbLeX - Quick Start Guide

## 🚀 Testing the New Features

### 1. Start the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

### 2. Test Room Management

1. **Login** to your account
2. You should see the **Dashboard** with your rooms
3. Click **"New Canvas"** button
4. Fill in:
   - Title: "My First Canvas"
   - Description: "Testing the new features"
   - Visibility: Public or Private
5. Click **"Create"**
6. You'll be redirected to the room

**Try:**
- Switch between Grid and List view
- Create multiple rooms
- Delete a room (only works for rooms you created)

---

### 3. Test Live Cursors

1. Open the same room in **two different browsers** (or incognito)
2. Login as different users in each browser
3. Move your mouse around the canvas
4. You should see:
   - Colored cursor with the other user's name
   - Smooth cursor movement
   - Cursor disappears when user leaves

**Keyboard Shortcuts:**
- Press `V` to switch to Select tool (see cursors)
- Press `P` to switch to Pen tool (cursors hidden)
- Press `Escape` to exit pen mode

---

### 4. Test Freehand Drawing

1. In the room, click the **Pen tool** button (or press `P`)
2. Your cursor should change to a crosshair
3. Click and drag to draw
4. Try:
   - Click the **color circle** to open color picker
   - Choose different colors
   - Adjust the **stroke width slider** (1-10)
   - Click **Eraser icon** to clear canvas

**In Second Browser:**
- You should see the drawings appear in real-time!
- Draw something yourself
- Both users' drawings should sync

---

### 5. Test Node Collaboration

1. Switch back to **Select tool** (press `V`)
2. Click **"Add Node"** button
3. Drag the node around
4. Type in the node to edit text
5. Click trash icon to delete

**In Second Browser:**
- You should see nodes appear/move/update in real-time
- Try editing the same node simultaneously
- CRDT ensures no conflicts!

---

## 🎨 Feature Showcase

### Dashboard Features:
- ✅ Grid view with room thumbnails
- ✅ List view with metadata
- ✅ Create room modal
- ✅ Public/Private visibility toggle
- ✅ Delete room (creator only)
- ✅ Participant count badge
- ✅ Last updated timestamp

### Canvas Features:
- ✅ Live cursors with user names
- ✅ Freehand drawing tool
- ✅ Color picker (7 colors)
- ✅ Stroke width control
- ✅ Clear canvas
- ✅ Tool switcher (Select/Pen)
- ✅ Draggable nodes
- ✅ Real-time sync
- ✅ Participant panel

### Keyboard Shortcuts:
- `V` - Select tool
- `P` - Pen tool
- `Escape` - Exit to select tool

---

## 🐛 Troubleshooting

### "Not connected to server"
- Check if backend is running on port 4000
- Check browser console for WebSocket errors
- Verify JWT token in localStorage

### "Cursors not showing"
- Make sure you're in Select tool mode (press `V`)
- Check if other user is actually moving their mouse
- Verify both users are in the same room

### "Drawings not syncing"
- Check browser console for errors
- Verify WebSocket connection status (green dot in header)
- Try refreshing both browsers

### "Can't create room"
- Check if title is filled in
- Verify authentication token
- Check backend logs for errors

---

## 📊 What to Test

### Functionality:
- [ ] Create room with different visibilities
- [ ] Join room from dashboard
- [ ] See other users' cursors
- [ ] Draw with different colors and widths
- [ ] Clear canvas
- [ ] Add/edit/delete nodes
- [ ] Drag nodes around
- [ ] Switch tools with keyboard
- [ ] Delete room

### Performance:
- [ ] Add 50+ nodes (should be smooth)
- [ ] Draw complex shapes (should render fast)
- [ ] 3+ users in same room (should sync well)
- [ ] Refresh page (state should persist)

### Edge Cases:
- [ ] Disconnect and reconnect
- [ ] Create room with very long title
- [ ] Draw outside canvas bounds
- [ ] Rapid tool switching
- [ ] Multiple users editing same node

---

## 🎯 Next Features to Build

Based on testing, prioritize:

1. **Undo/Redo** - Most requested feature
2. **Pan & Zoom** - For larger canvases
3. **Node Colors** - Visual organization
4. **Export Canvas** - Save work as image
5. **Room Templates** - Quick start layouts

---

## 💡 Tips for Demo

When showing to users:
1. Start with Dashboard - show grid/list views
2. Create a room - emphasize speed (2 clicks)
3. Open in two browsers - show real-time magic
4. Draw something together - highlight collaboration
5. Add nodes - show CRDT conflict resolution
6. Use keyboard shortcuts - show power user features

**Key Message:**
"Create a collaborative canvas in seconds, draw together in real-time, no conflicts, no friction."

---

## 🚀 Ready to Ship?

Before production:
- [ ] Add error boundaries
- [ ] Implement rate limiting
- [ ] Add analytics tracking
- [ ] Set up monitoring (Sentry)
- [ ] Write API documentation
- [ ] Create user onboarding flow
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Add E2E tests
- [ ] Set up CI/CD

---

## 📞 Support

If you encounter issues:
1. Check browser console
2. Check backend logs
3. Verify database connection
4. Test WebSocket connection
5. Clear localStorage and retry

**Happy Testing! 🎉**
