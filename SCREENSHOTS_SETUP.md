# 🎬 Adding Screenshots and Demo Video

This guide explains how to add screenshots and a demo video to your GitHub repository.

## 📸 Adding Screenshots

### Step 1: Create a screenshots folder
```bash
mkdir screenshots
```

### Step 2: Take screenshots
Capture screenshots of each page:
1. **Dashboard** - Main dashboard with stats and streak
2. **Pomodoro** - Timer interface
3. **Subjects** - Subject list and management
4. **Important Dates** - Deadlines and dates
5. **Weekly Goals** - Goals management
6. **Study Statistics** - Analytics and graphs
7. **Streak** - Close-up of the study streak feature

### Step 3: Save screenshots
- Save as `.png` or `.jpg` format
- Name them clearly: `dashboard.png`, `pomodoro.png`, etc.
- Place in the `screenshots/` folder

### Step 4: Reference in README
The README already has placeholders:
```markdown
![Dashboard Screenshot](./screenshots/dashboard.png)
```

Just add your actual screenshots and they'll display on GitHub!

---

## 🎥 Adding Demo Video

### Option 1: YouTube (Recommended)

1. **Record your demo**
   - Show all main features
   - Demonstrate Pomodoro timer
   - Show data persistence
   - Showcase responsive design
   - Duration: 2-5 minutes

2. **Upload to YouTube**
   - Go to youtube.com
   - Click "Create" → "Upload video"
   - Upload your video
   - Set to "Public"
   - Copy the video ID from URL

3. **Add to README**
   In the README, replace `YOUR_VIDEO_ID` with your actual YouTube video ID:
   ```markdown
   [![Watch Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
   ```

### Option 2: GitHub Video Embed

1. **Record and save as MP4**
2. **Upload to GitHub**
   - Go to your repo
   - Click "Issues" → "New Issue"
   - Drag and drop your video
   - Copy the markdown link
   - Paste in README

### Option 3: Inline Video Markdown

```markdown
[Watch Video](https://user-images.githubusercontent.com/YOUR_USERNAME/YOUR_VIDEO_URL)
```

---

## 📋 Recommended Screenshot Sequence

1. **dashboard.png** - Show the main landing page with streak, stats, and widgets
2. **pomodoro.png** - Show the timer in action
3. **subjects.png** - Show subject management with PDF uploads
4. **dates.png** - Show deadline tracking
5. **goals.png** - Show weekly goals
6. **statistics.png** - Show analytics and date range filtering
7. **streak.png** - Show the study streak feature and longest record

---

## 🎨 Screenshot Tips

- **Use full screen**: 1920x1080 or similar
- **Show diversity**: Display mobile view too
- **Add captions**: Use tools like:
  - Snagit (Premium)
  - ShareX (Free)
  - Built-in screenshot tools + paint
  
- **Optimize**: Compress images using:
  - TinyPNG (tinypng.com)
  - ImageOptim
  - Online compressors

---

## 🎬 Video Recording Tools

### Free Options
- **OBS Studio** (obsproject.com) - Professional, free
- **ShareX** - Simple screen recording
- **Snagit Trial** - 30-day trial
- **Built-in tools**:
  - Windows 11: Win+G for Xbox Game Bar
  - macOS: Cmd+Shift+5
  - Linux: SimpleScreenRecorder

### Paid Options
- **Snagit** - ~$50
- **Camtasia** - ~$100
- **Adobe Premiere** - Professional

---

## 📝 Demo Script (Optional)

Here's what to cover in your demo:

1. **Intro** (10 sec)
   - "Semester Manager 2.0"
   - "A complete study management system"

2. **Dashboard** (30 sec)
   - Show stats cards
   - Show study streak with flame
   - Show recent subjects

3. **Pomodoro Timer** (45 sec)
   - Start a timer
   - Show countdown
   - Complete session (can be sped up)
   - Show hours added to dashboard

4. **Subjects** (30 sec)
   - Add a new subject
   - Upload a PDF
   - Edit and download PDF

5. **Deadlines** (30 sec)
   - Add a new deadline
   - Show different deadline types
   - Show sorting

6. **Weekly Goals** (15 sec)
   - Add goals
   - Show priority levels

7. **Statistics** (30 sec)
   - Select date range
   - Show daily log
   - Show subject breakdown

8. **Responsive Design** (30 sec)
   - Resize browser
   - Show mobile layout

9. **Outro** (10 sec)
   - "All data stored locally"
   - "Try it now on GitHub"

---

## ✅ Checklist

After adding screenshots and video:

- [ ] Created `screenshots/` folder
- [ ] Added 7+ screenshots
- [ ] Updated README with image links
- [ ] Recorded demo video
- [ ] Uploaded video to YouTube
- [ ] Updated README with video link
- [ ] Tested all links in README
- [ ] Committed and pushed to GitHub
- [ ] Verified on GitHub.com

---

## 🚀 Commands to Update Repository

```bash
# Add new screenshots
git add screenshots/
git commit -m "Add screenshots for all features"
git push origin main

# After updating README with video
git add README.md
git commit -m "Add demo video link"
git push origin main
```

---

## 🎉 You're All Set!

Your README will now be much more engaging and visitors can:
- See exactly what the app looks like
- Watch a demo before using
- Understand features visually
- Feel confident about trying it

Great job! 🎊
