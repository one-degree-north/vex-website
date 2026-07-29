# SAS VEX Robotics Website

The website for our VEX team (6546). It has tutorials for CAD, programming, and competition stuff, plus a members page.

**Live site:** https://sasvexrobotics.web.app

## How it works

It's just HTML, CSS, and JavaScript — no framework or build step. Firebase does the hosting, the Google sign-in (only `@sas.edu.sg` accounts), and saves things like lesson progress.

## Where stuff is

Everything on the site lives in `public/`:

- `public/data/*.json` — all the lessons and quizzes. **Want to add a lesson? Just edit the JSON, no coding needed.**
- `public/js/` — the JavaScript
- `public/css/style.css` — the styles
- `public/images/` — pictures and diagrams

To add a YouTube video inside a lesson, put this in its `content`:

```html
<div class="video-container"><iframe width="100%" height="400" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe></div>
```

## Run it on your computer

```
cd public
python3 -m http.server 8000
```

Then open http://localhost:8000. (Sign-in only works on the real site, but everything else works locally.)

## Putting changes online

Just push to `main` and it deploys by itself. That's it.

If you change `database.rules.json`, someone with Firebase access has to run `firebase deploy --only database` once.

## One thing to know

The Firebase keys in the code aren't secret — they're supposed to be public and are already in the live site. Just **never** add a file ending in `-adminsdk-*.json` or a `.env` file; those are the actual secrets.

---

Made by Dan Honda & Kaisei Terami.
