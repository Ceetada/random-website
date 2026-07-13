/* ============================================================
   Lumi — interactions
   - self-typing companion conversation (loops)
   - live "listening" timer
   - blur-in scroll reveals
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- scroll reveals ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target;
            // slight stagger for siblings
            const delay = Math.min(
              [...el.parentElement.children].indexOf(el) * 80,
              320
            );
            setTimeout(() => el.classList.add("in"), delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.16 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- live "listening" timer ---------- */
  const timeEl = document.getElementById("listenTime");
  let seconds = 0;
  function tick() {
    seconds = (seconds + 1) % (60 * 60);
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    if (timeEl) timeEl.textContent = `${m}:${s}`;
  }
  setInterval(tick, 1000);

  /* ---------- self-playing conversation ---------- */
  const body = document.getElementById("chatBody");
  if (!body) return;

  // a warm, playful "bored & spiraling" exchange
  const script = [
    { who: "them", text: "hey. what's on your mind tonight? 🌙" },
    { who: "me", text: "idk i'm just bored and kinda spiraling lol" },
    { who: "them", text: "classic combo 😌 wanna unpack the spiral, or vibe first?" },
    { who: "me", text: "vibe first pls" },
    { who: "them", text: "say less. what's the last song stuck in your head?" },
    { who: "me", text: "some sad indie thing on repeat since like 2am" },
    { who: "them", text: "2am + sad indie… we've all been there. wanna talk about the thing behind the replays?" },
    { who: "me", text: "…yeah okay maybe" },
    { who: "them", text: "i'm right here. no rush, no judgment 🫶" },
  ];

  const TYPE_MS = 1100; // how long the typing dots show
  const READ_MS = 1600; // pause after a message appears
  const LOOP_GAP = 3200; // pause before restarting

  function makeMsg(who, text) {
    const el = document.createElement("div");
    el.className = "msg msg--" + (who === "me" ? "me" : "them");
    el.textContent = text;
    return el;
  }

  function makeTyping() {
    const el = document.createElement("div");
    el.className = "msg msg--them msg--typing";
    el.innerHTML = "<i></i><i></i><i></i>";
    return el;
  }

  // keep only the last N bubbles visible so the card doesn't overflow
  const MAX_VISIBLE = 4;
  function trim() {
    while (body.children.length > MAX_VISIBLE) {
      body.removeChild(body.firstChild);
    }
  }

  let idx = 0;

  function next() {
    if (idx >= script.length) {
      // brief pause, then clear and loop
      setTimeout(() => {
        body.innerHTML = "";
        idx = 0;
        next();
      }, LOOP_GAP);
      return;
    }

    const step = script[idx];

    // "them" messages get a typing indicator first
    if (step.who === "them" && !reduceMotion) {
      const typing = makeTyping();
      body.appendChild(typing);
      trim();
      setTimeout(() => {
        typing.remove();
        body.appendChild(makeMsg(step.who, step.text));
        trim();
        idx++;
        setTimeout(next, READ_MS);
      }, TYPE_MS);
    } else {
      body.appendChild(makeMsg(step.who, step.text));
      trim();
      idx++;
      setTimeout(next, reduceMotion ? 900 : READ_MS);
    }
  }

  // kick it off after the card has animated in
  setTimeout(next, reduceMotion ? 200 : 1400);

  /* ---------- vibe cards: swap the demo mood on click ---------- */
  const vibeLines = {
    "The Listener": "take your time. i'm right here.",
    "The Hype Friend": "wait — you did WHAT? okay legend 🔥",
    "The Deep Diver": "okay but what's really bugging you?",
    "The Goofball": "new plan: we overthink this together 🤪",
  };
  document.querySelectorAll(".vibe").forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.querySelector("h3")?.textContent?.trim();
      const line = vibeLines[name];
      if (!line) return;
      // pop a bubble into the live chat as a fun preview
      const el = makeMsg("them", line);
      body.appendChild(el);
      trim();
      card.animate(
        [{ transform: "scale(0.97)" }, { transform: "scale(1)" }],
        { duration: 260, easing: "cubic-bezier(.2,.8,.3,1)" }
      );
    });
  });
})();
