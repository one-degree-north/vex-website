// ============================================
// Lesson progress tracking (per signed-in user)
// Stores completion at  users/${uid}/progress/${course}/${topic}/${lesson} = true
// in the Realtime Database. Mirrors a lightweight localStorage cache so
// checkmarks can paint instantly before Firebase resolves (same idea as the
// "auth hint" in auth.js).
// ============================================

import { auth, db, onAuthStateChanged } from '/js/auth.js';
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const CACHE_KEY = 'sasProgress';

// ---- localStorage cache: { [course]: { [topic]: { [lesson]: true } } } ----
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function writeCache(obj) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) { /* ignore */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch (e) { /* ignore */ }
}

// Instant (possibly stale) read of one course's progress map.
export function getCachedCourseProgress(course) {
  const all = readCache();
  return (all && all[course]) || {};
}

// Instant check for a single lesson.
export function isLessonDoneCached(course, topic, lesson) {
  const c = getCachedCourseProgress(course);
  return !!(c[topic] && c[topic][lesson]);
}

// Subscribe to the signed-in @sas.edu.sg user (or null when signed out).
// Clears the cache on sign-out so one student's checkmarks never linger for
// the next person on a shared computer.
export function onUser(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user && user.email && user.email.endsWith('@sas.edu.sg')) {
      callback(user);
    } else {
      clearCache();
      callback(null);
    }
  });
}

// One-shot read of a course's progress from the database; refreshes the cache.
export async function fetchCourseProgress(uid, course) {
  const snap = await get(ref(db, `users/${uid}/progress/${course}`));
  const val = snap.exists() ? snap.val() : {};
  const all = readCache();
  all[course] = val;
  writeCache(all);
  return val;
}

// Write (done=true) or erase (done=false) a single lesson's completion.
export async function setLessonDone(uid, course, topic, lesson, done) {
  const path = `users/${uid}/progress/${course}/${topic}/${lesson}`;
  if (done) {
    await set(ref(db, path), true);
  } else {
    await remove(ref(db, path));
  }
  const all = readCache();
  all[course] = all[course] || {};
  all[course][topic] = all[course][topic] || {};
  if (done) {
    all[course][topic][lesson] = true;
  } else {
    delete all[course][topic][lesson];
  }
  writeCache(all);
}
