/* ==========================================================================
   ARCHD LAB — main.js
   Mobile nav, accordions, reveal-on-scroll, enquiry wizard.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LEAD_ENDPOINT = "https://superagent-f8dac91d.base44.app/functions/captureArchdLead";

  /* ---------- Mobile navigation ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var mobileNav = document.getElementById("mobileNav");

  function closeMenu() {
    menuBtn.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function openMenu() {
    menuBtn.setAttribute("aria-expanded", "true");
    mobileNav.classList.add("open");
    mobileNav.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  menuBtn.addEventListener("click", function () {
    if (menuBtn.getAttribute("aria-expanded") === "true") closeMenu(); else openMenu();
  });
  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") {
      closeMenu(); menuBtn.focus();
    }
  });

  /* ---------- Accordions (services + FAQ) ---------- */
  function initAccordion(container) {
    var heads = container.querySelectorAll(".svc-head");
    heads.forEach(function (head) {
      var panel = document.getElementById(head.getAttribute("aria-controls"));
      if (!panel) return;
      head.addEventListener("click", function () {
        var open = head.getAttribute("aria-expanded") === "true";
        if (open) {
          panel.style.maxHeight = "0px";
          head.setAttribute("aria-expanded", "false");
        } else {
          panel.style.maxHeight = panel.scrollHeight + "px";
          head.setAttribute("aria-expanded", "true");
          panel.addEventListener("transitionend", function fix() {
            if (head.getAttribute("aria-expanded") === "true") panel.style.maxHeight = "none";
            panel.removeEventListener("transitionend", fix);
          });
        }
      });
    });
  }
  initAccordion(document.getElementById("svcList"));
  initAccordion(document.getElementById("faqList"));

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".sec-head, .about-grid, .svc, .sector-index li, .j-step, .phil-content, .principles li, .tech-list, .gal-item, .contact-card, .wizard, .faq, .hero-fig");
  if (!REDUCED && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ==========================================================================
     ENQUIRY WIZARD
     ========================================================================== */
  var form = document.getElementById("enquiryForm");
  if (!form) return;

  var steps = form.querySelectorAll(".wz-step");
  var bar = document.getElementById("wzBar");
  var ind = document.getElementById("wzInd");
  var backBtn = document.getElementById("wzBack");
  var nextBtn = document.getElementById("wzNext");
  var errBox = document.getElementById("wzErr");
  var controls = document.getElementById("wzControls");
  var TOTAL = 8;

  var state = {
    service: "", projectType: "", method: "",
    date: "", time: "",
    name: "", phone: "", email: "", message: ""
  };
  var current = 1;
  var submitting = false;

  var chipGroups = {
    service: { root: document.getElementById("fService"), key: "service" },
    projectType: { root: document.getElementById("fType"), key: "projectType" },
    method: { root: document.getElementById("fMethod"), key: "method" },
    time: { root: document.getElementById("fTime"), key: "time" }
  };

  Object.keys(chipGroups).forEach(function (g) {
    var group = chipGroups[g];
    group.root.querySelectorAll(".chip").forEach(function (chip) {
      chip.setAttribute("role", "radio");
      chip.setAttribute("aria-checked", "false");
      chip.addEventListener("click", function () {
        group.root.querySelectorAll(".chip").forEach(function (c) {
          c.classList.remove("is-sel");
          c.setAttribute("aria-checked", "false");
        });
        chip.classList.add("is-sel");
        chip.setAttribute("aria-checked", "true");
        state[group.key] = chip.dataset.value;
        clearHints();
        if (current < 7) go(current + 1); // auto-advance on selection
      });
    });
  });

  /* Date field setup */
  var dateInput = document.getElementById("fDate");
  (function () {
    var d = new Date();
    var iso = function (x) { return x.toISOString().slice(0, 10); };
    dateInput.min = iso(d);
    var max = new Date(d.getTime() + 90 * 24 * 60 * 60 * 1000);
    dateInput.max = iso(max);
  })();
  dateInput.addEventListener("change", function () {
    state.date = dateInput.value || "";
    clearHints();
  });

  /* Detail inputs */
  var f = {
    name: document.getElementById("fName"),
    phone: document.getElementById("fPhone"),
    email: document.getElementById("fEmail"),
    message: document.getElementById("fMsg")
  };
  f.name.addEventListener("input", function () { state.name = f.name.value.trim(); });
  f.phone.addEventListener("input", function () { state.phone = f.phone.value.trim(); });
  f.email.addEventListener("input", function () { state.email = f.email.value.trim(); });
  f.message.addEventListener("input", function () { state.message = f.message.value.trim(); });

  function clearHints() {
    document.querySelectorAll(".wz-hint").forEach(function (h) { h.style.visibility = "hidden"; });
  }
  function showHint(id) {
    var h = document.getElementById(id);
    if (h) h.style.visibility = "visible";
  }

  function validate(step) {
    var ok = true;
    if (step === 1 && !state.service) { showHint("fServiceHint"); ok = false; }
    if (step === 2 && !state.projectType) { showHint("fTypeHint"); ok = false; }
    if (step === 3 && !state.method) { showHint("fMethodHint"); ok = false; }
    if (step === 4 && !state.date) { showHint("fDateHint"); ok = false; }
    if (step === 5 && !state.time) { showHint("fTimeHint"); ok = false; }
    if (step === 6) {
      var bad = false;
      if (!state.name) { f.name.classList.add("is-err"); showHint("fNameHint"); bad = true; } else f.name.classList.remove("is-err");
      if (!/^[+0-9() \-]{7,20}$/.test(state.phone)) { f.phone.classList.add("is-err"); showHint("fPhoneHint"); bad = true; } else f.phone.classList.remove("is-err");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) { f.email.classList.add("is-err"); showHint("fEmailHint"); bad = true; } else f.email.classList.remove("is-err");
      ok = !bad;
    }
    return ok;
  }

  function buildReview() {
    var r = document.getElementById("review");
    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    };
    var fmtDate = function (iso) {
      if (!iso) return "";
      var d = new Date(iso + "T00:00:00");
      if (isNaN(d)) return iso;
      try {
        return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
      } catch (e) { return iso; }
    };
    var rows = [
      ["Service / Area", state.service, 1],
      ["Project Type", state.projectType, 2],
      ["Contact Method", state.method, 3],
      ["Preferred Date", fmtDate(state.date), 4],
      ["Preferred Time", state.time, 5],
      ["Name", state.name, 6],
      ["Phone", state.phone, 6],
      ["Email", state.email, 6],
      ["Additional Info", state.message || "None", 6]
    ];
    r.innerHTML = "";
    rows.forEach(function (row) {
      var div = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = row[0];
      var dd = document.createElement("dd"); dd.textContent = row[1];
      var edit = document.createElement("button");
      edit.type = "button"; edit.className = "r-edit"; edit.textContent = "Edit";
      edit.setAttribute("aria-label", "Edit " + row[0]);
      edit.addEventListener("click", function () { go(row[2]); });
      div.appendChild(dt); div.appendChild(dd); div.appendChild(edit);
      r.appendChild(div);
    });
  }

  function go(step) {
    current = step;
    steps.forEach(function (s) {
      s.classList.toggle("is-active", Number(s.dataset.step) === step);
    });
    bar.style.width = (step / TOTAL * 100) + "%";
    ind.textContent = step === TOTAL ? "Complete" : "Step " + step + " of " + TOTAL;
    backBtn.style.visibility = step <= 1 || step === TOTAL ? "hidden" : "visible";
    nextBtn.textContent = step === 7 ? "Submit Enquiry" : "Continue";
    nextBtn.classList.toggle("btn-loading", false);
    errBox.hidden = true;
    if (step === 7) buildReview();
    if (step < TOTAL) {
      controls.style.display = "";
    }
    clearHints();
    // keep the wizard card in view on step change (without scrolling the whole page on mobile)
    if (window.innerWidth < 900) {
      var rect = document.getElementById("wizard").getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        document.getElementById("wizard").scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
      }
    }
  }

  backBtn.addEventListener("click", function () {
    if (current > 1 && current < TOTAL) go(current - 1);
  });

  nextBtn.addEventListener("click", function () {
    if (submitting) return;
    errBox.hidden = true;
    if (current === TOTAL) return; // done state: nothing further
    if (!validate(current)) return;
    if (current < 7) { go(current + 1); return; }
    if (current === 7) submit();
  });

  function submit() {
    submitting = true;
    nextBtn.disabled = true;
    nextBtn.textContent = "Sending…";
    errBox.hidden = true;

    var payload = {
      service: state.service,
      project_type: state.projectType,
      contact_method: state.method,
      preferred_date: state.date,
      preferred_time: state.time,
      name: state.name,
      phone: state.phone,
      email: state.email,
      message: state.message,
      source: "archdlab-website"
    };

    fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
      .then(function (res) {
        if (!res.ok || res.json.ok !== true) {
          throw new Error(res.json && res.json.error ? res.json.error : "Network problem.");
        }
        // Success — show step 8 with a contextual WhatsApp continuation
        var wa = document.getElementById("wzWaLink");
        var msg = "Hi, I found Architectural Design Lab through your website and would like to discuss my project."
          + " (Enquiry: " + state.service + " / " + state.projectType + ")";
        wa.href = "https://wa.me/27796188759?text=" + encodeURIComponent(msg);
        controls.style.display = "none";
        go(8);
        nextBtn.disabled = false;
        nextBtn.textContent = "Continue";
        submitting = false;
      })
      .catch(function () {
        // Error state with retry
        errBox.textContent = "Something went wrong while sending your enquiry. Please check your connection and try again — or contact us directly on 079 618 8759.";
        errBox.hidden = false;
        nextBtn.disabled = false;
        nextBtn.textContent = "Retry Submission";
        submitting = false;
      });
  }

  go(1);
})();
