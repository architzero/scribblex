# ScribbLeX - Testing Checklist

## ✅ Complete Testing Guide

### Pre-Testing Setup
- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] Database connected (Neon PostgreSQL)
- [ ] Two browsers ready (Chrome + Incognito or Firefox)

---

## 1. Authentication Flow

### Sign Up
- [ ] Navigate to `/`
- [ ] Click "Email Login"
- [ ] Enter email and password
- [ ] Click "Sign Up"
- [ ] Verify OTP sent to email
- [ ] Enter OTP code
- [ ] Redirected to CompleteProfile

### Complete Profile
- [ ] Step 1: Enter name → Press Enter
- [ ] Step 2: Upload avatar or choose preset
- [ ] Step 3: Enter username → Check availability
- [ ] Step 4: Select country from dropdown
- [ ] Step 5: Enter date of birth (8+ years old)
- [ ] Step 6: Add bio (optional)
- [ ] Step 7: Add social links (optional)
- [ ] Click "Finish" → Redirected to Home

### Login
- [ ] Navigate to `/`
- [ ] Click "Email Login"
- [ ] Enter credentials
- [ ] Click "Sign In"
- [ ] Redirected to Home

---

## 2. Home Screen (Dashboard)

### View Modes
- [ ] See "My Canvases" header
- [ ] Toggle between Grid and List view
- [ ] Grid view shows room cards with thumbnails
- [ ] List view shows compact room list

### Create Room
- [ ] Click "New Canvas" button
- [ ] Modal opens
- [ ] Enter title (required)
- [ ] Enter description (optional)
- [ ] Select visibility (Public/Private)
- [ ] Press Enter or click "Create"
- [ ] Redirected to room

### Room Actions
- [ ] Hover over room card → Delete button appears
- [ ] Click delete → Confirmation dialog
- [ ] Confirm → Room removed from list
- [ ] Click room card → Navigate to room

---

## 3. Room Collaboration

### Initial Load
- [ ] Room loads with title and description
- [ ] Connection status shows "Connected" (green dot)
- [ ] Participant count shows "1"
- [ ] Canvas is empty or shows existing content

### Tool Switching
- [ ] Click Hand icon → Select tool active
- [ ] Click Pen icon → Pen tool active
- [ ] Press `V` → Select tool
- [ ] Press `P` → Pen tool
- [ ] Press `Escape` → Back to select tool

### Undo/Redo
- [ ] Undo button disabled when no history
- [ ] Make a change → Undo button enabled
- [ ] Click Undo → Change reverted
- [ ] Toast shows "Undo"
- [ ] Press `Ctrl+Z` → Undo works
- [ ] Press `Ctrl+Y` → Redo works
- [ ] Redo button state updates correctly

---

## 4. Node Operations

### Create Node
- [ ] In Select tool, click "Add Node"
- [ ] Node appears with random color
- [ ] Node has default text "New Note"
- [ ] Node is 200x100px

### Edit Node
- [ ] Click inside node textarea
- [ ] Type multi-line text
- [ ] Text updates in real-time
- [ ] Click color picker
- [ ] Choose color → Node background changes
- [ ] Text color adjusts for readability

### Move Node
- [ ] Drag node to new position
- [ ] Node follows cursor smoothly
- [ ] Release → Node stays in place
- [ ] Position persists on refresh

### Delete Node
- [ ] Click trash icon on node
- [ ] Node disappears immediately
- [ ] Deletion syncs to other users

---

## 5. Freehand Drawing

### Basic Drawing
- [ ] Switch to Pen tool
- [ ] Cursor changes to crosshair
- [ ] Click and drag → Smooth stroke appears
- [ ] Release → Stroke completes

### Color Selection
- [ ] Click color circle
- [ ] Color picker opens with 7 colors
- [ ] Select color → Picker closes
- [ ] Next stroke uses new color

### Stroke Width
- [ ] Drag width slider (1-10)
- [ ] Draw stroke → Width matches slider
- [ ] Thin strokes (1-3) are precise
- [ ] Thick strokes (8-10) are bold

### Clear Canvas
- [ ] Click Eraser icon
- [ ] All drawings disappear
- [ ] Nodes remain intact
- [ ] Clear syncs to other users

---

## 6. Real-Time Collaboration

### Open Second Browser
- [ ] Open same room URL in incognito/different browser
- [ ] Login as different user
- [ ] Both users see each other in participant panel

### Live Cursors
- [ ] In Select tool, move mouse
- [ ] Other user sees your cursor with name
- [ ] Cursor color matches your user color
- [ ] Cursor moves smoothly
- [ ] Switch to Pen tool → Cursor disappears
- [ ] Back to Select → Cursor reappears

### Node Sync
- [ ] User A creates node
- [ ] User B sees node appear instantly
- [ ] User B edits node
- [ ] User A sees changes in real-time
- [ ] User A deletes node
- [ ] User B sees deletion

### Drawing Sync
- [ ] User A draws stroke
- [ ] User B sees stroke appear
- [ ] User B draws different color
- [ ] User A sees new stroke
- [ ] User A clears canvas
- [ ] User B's canvas clears

### Participant Panel
- [ ] Shows all online users
- [ ] Displays user avatars
- [ ] Shows "Host" for creator
- [ ] Shows "Participant" for others
- [ ] User leaves → Removed from list
- [ ] User joins → Added to list

---

## 7. Persistence & Recovery

### Data Persistence
- [ ] Create nodes and drawings
- [ ] Refresh page
- [ ] All content still there
- [ ] Restart backend server
- [ ] Refresh page
- [ ] Content still persists

### WebSocket Reconnection
- [ ] Stop backend server
- [ ] See "Disconnected" toast
- [ ] Connection status shows red
- [ ] Restart backend
- [ ] See "Reconnected" toast
- [ ] Connection status shows green
- [ ] Content resyncs automatically

### Undo/Redo Persistence
- [ ] Create several nodes
- [ ] Undo 3 times
- [ ] Refresh page
- [ ] Undo history is lost (expected)
- [ ] Content state is preserved

---

## 8. Keyboard Shortcuts

### Tool Shortcuts
- [ ] Press `V` → Select tool activates
- [ ] Press `P` → Pen tool activates
- [ ] Press `Escape` → Returns to select tool
- [ ] Shortcuts work from any tool

### Undo/Redo Shortcuts
- [ ] Make changes
- [ ] Press `Ctrl+Z` → Undo
- [ ] Press `Ctrl+Y` → Redo
- [ ] Press `Ctrl+Shift+Z` → Redo (alternative)
- [ ] Toast notifications appear

### Navigation
- [ ] Press `Escape` in pen tool → Exits to select
- [ ] Color picker open → `Escape` closes it

---

## 9. Edge Cases

### Empty States
- [ ] New room → Shows "Click Add Node to start"
- [ ] No participants → Shows "No one here yet"
- [ ] No rooms → Shows "No canvases yet"

### Validation
- [ ] Try creating room without title → Disabled
- [ ] Try username < 3 chars → Not allowed
- [ ] Try date of birth < 8 years → Error shown
- [ ] Try taken username → Shows suggestions

### Limits
- [ ] Create 50+ nodes → Performance OK
- [ ] Draw complex shapes → Renders smoothly
- [ ] 3+ users in room → All sync correctly

### Error Handling
- [ ] Invalid room ID → Redirects to home
- [ ] Network error → Shows error toast
- [ ] Unauthorized access → Redirects to login

---

## 10. UI/UX Polish

### Animations
- [ ] Room cards hover → Lift effect
- [ ] Buttons hover → Shadow appears
- [ ] Nodes drag → Smooth movement
- [ ] Cursors move → Smooth tracking
- [ ] Modals open → Scale animation

### Responsiveness
- [ ] Resize window → Layout adapts
- [ ] Mobile view → Touch-friendly
- [ ] Tablet view → Optimized layout

### Visual Feedback
- [ ] Loading states show spinners
- [ ] Success actions show green toasts
- [ ] Errors show red toasts
- [ ] Disabled buttons are grayed out
- [ ] Active tools are highlighted

---

## 11. Performance

### Load Times
- [ ] Home page loads < 2s
- [ ] Room loads < 3s
- [ ] Node creation < 100ms
- [ ] Drawing stroke < 16ms (60fps)

### Memory
- [ ] No memory leaks after 10min
- [ ] Browser doesn't slow down
- [ ] Multiple rooms don't crash

### Network
- [ ] Works on slow 3G
- [ ] Reconnects on network drop
- [ ] Syncs when back online

---

## 12. Security

### Authentication
- [ ] Can't access rooms without login
- [ ] Token expires after time
- [ ] Refresh token works
- [ ] Logout clears tokens

### Authorization
- [ ] Can't delete others' rooms
- [ ] Can't edit room settings (non-owner)
- [ ] Private rooms require access
- [ ] Public rooms are accessible

---

## 🐛 Known Issues to Watch For

1. **Prisma Client Generation Error**
   - Happens on Windows
   - Migration still applies
   - Restart backend to fix

2. **Port Already in Use**
   - Kill process: `taskkill /F /PID <pid>`
   - Find PID: `netstat -ano | findstr :4000`

3. **WebSocket Connection**
   - Check CORS settings
   - Verify token in localStorage
   - Check backend logs

4. **Drawing Not Syncing**
   - Verify pen tool is active
   - Check WebSocket connection
   - Refresh both browsers

---

## ✅ Success Criteria

### Must Pass:
- [ ] All authentication flows work
- [ ] Rooms can be created and deleted
- [ ] Nodes sync in real-time
- [ ] Drawings sync in real-time
- [ ] Cursors show for all users
- [ ] Undo/redo works
- [ ] Keyboard shortcuts work
- [ ] Data persists after refresh
- [ ] Reconnection works

### Nice to Have:
- [ ] Smooth animations
- [ ] Fast load times
- [ ] No console errors
- [ ] Mobile-friendly
- [ ] Accessible

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________

Authentication: ✅ / ❌
Room Management: ✅ / ❌
Node Operations: ✅ / ❌
Drawing: ✅ / ❌
Real-Time Sync: ✅ / ❌
Persistence: ✅ / ❌
Keyboard Shortcuts: ✅ / ❌
Error Recovery: ✅ / ❌

Issues Found:
1. ___________
2. ___________
3. ___________

Overall: PASS / FAIL
```

---

## 🚀 Ready to Test!

Start with authentication, then move through each section systematically. Test with 2 browsers for collaboration features. Report any bugs found!

**Happy Testing! 🎉**
