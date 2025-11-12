# ESL Speaking Club Web App

A modern, minimalistic web application for managing ESL (English as a Second Language) speaking club sessions with notes, exercises, and links.

## Features

- 📅 **Session Management**: Display all past Saturday sessions with dates
- 📝 **Bulk Notes Entry**: Paste all your notes at once - automatic parsing!
- ✏️ **Interactive Exercises**: Fill-in-the-blank, multiple choice, and text instructions
- 🔗 **Resource Links**: Share articles, videos, and other learning materials
- 💬 **Comments**: Students can comment on each section (notes, exercises, links)
- 🔒 **Password Protection**: Secure admin access
- 👨‍💼 **Admin Panel**: Easy-to-use interface for adding new sessions
- 📱 **Mobile Responsive**: Works great on phones and tablets
- 🎨 **Modern Design**: Sleek black and yellow theme with smooth animations

## How to Use

### For Students

1. Open the website
2. Click on a date box to view that session's content
3. Browse through Notes, Exercises, and Links
4. Try the interactive exercises
5. Leave comments with your name in any section

### For Admin (Teacher)

1. Click the **Admin** button in the top right
2. **Enter password**: Default is `esl2025` (change this in script.js!)
3. Fill in the form to add a new session:
   - Select the Saturday date
   - **Paste all notes** in the text area (see format below)
   - Add exercises (fill-in-blank, multiple choice, or text instructions)
   - Add links with descriptions
4. Click **Save Session**
5. Click **Export Data** to download a JSON file
6. Commit the JSON file to your GitHub repository

### 🔐 Changing the Admin Password

**IMPORTANT**: Change the default password before deploying!

1. Open `script.js`
2. Find this line near the top:
   ```javascript
   const ADMIN_PASSWORD = "esl2025"; // Change this password!
   ```
3. Change `esl2025` to your own secure password
4. Save and commit the file

### Bulk Notes Format

Simply paste all your notes in this format:

```
MEME /miːm/
🔊 Pronunciation: https://youglish.com/pronounce/meme/english
====
an image, video, or text that is humorous and copied/shared rapidly by internet users
====
That cat meme made me laugh so hard!
Did you see the latest meme about coffee?

TAKE A CHILL PILL!
🔊 Pronunciation: https://youglish.com/pronounce/chill%20pill/english
====
(slang) relax! calm down! don't stress or overreact
====
You're too nervous, take a chill pill!
It's just a game, take a chill pill.
```

**Format rules:**
- Title on first line
- Pronunciation link on second line (optional)
- `====` separator before definition
- Definition text
- `====` separator before examples
- Each example on a new line
- Blank line between notes

The parser automatically extracts everything!

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
   - `data.json`
   - `.gitignore`
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

## Security Note

This is a client-side only application. The password protection is basic and stored in the JavaScript file. For better security:
- Change the default password immediately
- Don't share your password
- Consider using GitHub's private repository feature if you want to keep admin access more restricted
- Export your data regularly as backup

## Tips

- Always export your data after adding sessions
- Commit the exported JSON to GitHub as backup
- Students' comments are saved in their browsers
- Use clear, descriptive titles for exercises and links
- Test exercises before publishing
- The bulk note parser works best when you follow the format exactly

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
