// ============================================
// Paints completion checkmarks + "X/Y done" badges on the topic/lesson list
// pages (cad.html, programming.html, mechanics.html). Course is derived from
// the `topics-rendered` event that content-loader.js fires after rendering.
// ============================================

import { onUser, getCachedCourseProgress, fetchCourseProgress } from '/js/progress.js';

let course = null;
let uid = null;
let latestMap = {};

function apply() {
  if (!course) return;
  const items = document.querySelectorAll('.lesson-item[data-lesson]');
  if (!items.length) return;

  items.forEach((item) => {
    const t = item.dataset.topic;
    const l = item.dataset.lesson;
    item.classList.toggle('completed', !!(latestMap[t] && latestMap[t][l]));
  });

  document.querySelectorAll('.topic-card').forEach((card) => {
    const total = card.querySelectorAll('.lesson-item[data-lesson]').length;
    const done = card.querySelectorAll('.lesson-item.completed').length;
    const badge = card.querySelector('.topic-progress');
    if (badge) badge.textContent = (done > 0 && total > 0) ? `${done}/${total} done` : '';
  });
}

async function refresh() {
  if (!course) return;
  if (!uid) { latestMap = {}; apply(); return; }
  latestMap = getCachedCourseProgress(course);      // optimistic paint
  apply();
  latestMap = await fetchCourseProgress(uid, course); // reconcile with database
  apply();
}

document.addEventListener('topics-rendered', (e) => {
  course = e.detail.course;
  latestMap = getCachedCourseProgress(course);
  apply();
  refresh();
});

onUser((user) => {
  uid = user ? user.uid : null;
  refresh();
});
