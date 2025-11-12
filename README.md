# ESL Speaking Club Web App

A minimalistic web application for managing ESL (English as a Second Language) speaking club sessions with notes, exercises, and links.

## Features

- 📅 **Session Management**: Display all past Saturday sessions with dates
- 📝 **Notes**: Formatted vocabulary and grammar notes with pronunciation links
- ✏️ **Interactive Exercises**: Fill-in-the-blank, multiple choice, and text instructions
- 🔗 **Resource Links**: Share articles, videos, and other learning materials
- 💬 **Comments**: Students can comment on each section (notes, exercises, links)
- 👨‍💼 **Admin Panel**: Easy-to-use interface for adding new sessions
- 📱 **Mobile Responsive**: Works great on phones and tablets
- 🎨 **Clean Design**: Black and yellow minimalistic theme

## How to Use

### For Students

1. Open the website
2. Click on a date box to view that session's content
3. Browse through Notes, Exercises, and Links
4. Try the interactive exercises
5. Leave comments with your name in any section

### For Admin (Teacher)

1. Click the **Admin** button in the top right
2. Fill in the form to add a new session:
   - Select the Saturday date
   - Add notes (title, pronunciation, definition, examples)
   - Add exercises (fill-in-blank, multiple choice, or text instructions)
   - Add links with descriptions
3. Click **Save Session**
4. Click **Export Data** to download a JSON file
5. Commit the JSON file to your GitHub repository

### Exercise Types

**Fill in the Blank**
- Question with a blank space
- Students type their answer
- Instant feedback

**Multiple Choice**
- Question with multiple options
- Mark the correct answer with `*` when creating
- Example:
  ```
  Option 1
  *Correct Answer
  Option 3
  ```

**Text Instructions**
- Just provide instructions for students to follow
- No automatic checking

## Setup on GitHub Pages

1. Create a new repository on GitHub
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. Go to repository Settings → Pages
4. Select the main branch as source
5. Your site will be live at: `https://yourusername.github.io/repository-name`

## Data Management

### Export Data
- Click **Export Data** in the admin panel
- Downloads a JSON file with all sessions and comments
- Commit this file to GitHub for backup

### Import Data
- Click **Import Data** in the admin panel
- Select a previously exported JSON file
- All sessions and comments will be restored

### Local Storage
- Data is stored in browser's localStorage
- Each browser/device has its own storage
- Export regularly to not lose data
- Comments are also stored locally per user

## Example Note Format

```
TAKE A CHILL PILL!
🔊 Pronunciation: https://youglish.com/pronounce/chill%20pill/english
====
(slang) relax! calm down! don't stress or overreact
====
You're too nervous, take a chill pill!
It's just a game, take a chill pill.
```

When adding in admin:
- **Title**: TAKE A CHILL PILL!
- **Pronunciation URL**: https://youglish.com/pronounce/chill%20pill/english
- **Definition**: (slang) relax! calm down! don't stress or overreact
- **Examples** (one per line):
  ```
  You're too nervous, take a chill pill!
  It's just a game, take a chill pill.
  ```

## Tips

- Always export your data after adding sessions
- Commit the exported JSON to GitHub as backup
- Students' comments are saved in their browsers
- Use clear, descriptive titles for exercises and links
- Test exercises before publishing

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge
- Firefox
- Safari
- Mobile browsers

## Support

If you need help or want to suggest features, create an issue on GitHub.

---

Made with 💛 for ESL learners
