/**
 * Smart Attendance Analysis & Recovery Simulator
 * -------------------------------------------------------------
 * Pure Vanilla JavaScript implementation.
 * All computations are rule-based mathematical formulas (linear algebra
 * threshold analysis). No machine learning, external libraries, or APIs.
 */

// =============================================================
// Realistic Sample Data (Demo Dataset)
// =============================================================
const DEMO_SUBJECTS = [
  {
    id: "sub-101",
    name: "Data Structures & Algorithms",
    attended: 28,
    total: 34,
    target: 75
  },
  {
    id: "sub-102",
    name: "Computer Networks",
    attended: 19,
    total: 28,
    target: 75
  },
  {
    id: "sub-103",
    name: "Operating Systems",
    attended: 32,
    total: 36,
    target: 80
  },
  {
    id: "sub-104",
    name: "Database Management Systems",
    attended: 16,
    total: 25,
    target: 75
  },
  {
    id: "sub-105",
    name: "Mathematics IV",
    attended: 38,
    total: 40,
    target: 75
  }
];

// Application State
const state = {
  subjects: [],
  selectedSubjectId: null,
  isFormOpen: false,
  editingSubjectId: null,
  simulation: {
    upcomingTotal: 10,
    upcomingAttended: 8
  }
};

// =============================================================
// Core Mathematical Calculations
// =============================================================

/**
 * Calculates attendance percentage rounded to one decimal place.
 */
function calculatePercentage(attended, total) {
  if (!total || total <= 0) return 0;
  const pct = (attended / total) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Determines academic attendance status based on target threshold.
 */
function getAttendanceStatus(percentage, target) {
  if (percentage >= target + 5) {
    return { label: "Safe Zone", className: "badge-safe", barClass: "safe" };
  } else if (percentage >= target) {
    return { label: "Threshold Met", className: "badge-safe", barClass: "safe" };
  } else if (percentage >= target - 10) {
    return { label: "At Risk / Warning", className: "badge-warning", barClass: "warning" };
  } else {
    return { label: "Critical Shortage", className: "badge-danger", barClass: "danger" };
  }
}

/**
 * Calculates consecutive classes required to reach target OR safe absences.
 *
 * Mathematical derivation for deficit:
 *   (attended + x) / (total + x) >= target / 100
 *   attended + x >= (target/100) * total + (target/100) * x
 *   x * (1 - target/100) >= (target/100) * total - attended
 *   x >= [(target/100) * total - attended] / [1 - target/100]
 *
 * Mathematical derivation for surplus:
 *   attended / (total + y) >= target / 100
 *   total + y <= attended / (target/100)
 *   y <= [attended / (target/100)] - total
 */
function calculateRecovery(attended, total, target) {
  const currentPct = calculatePercentage(attended, total);
  const targetFraction = target / 100;

  if (target >= 100) {
    if (attended === total) {
      return { type: "perfect", value: 0 };
    }
    return { type: "impossible", value: null };
  }

  if (currentPct < target) {
    const rawX = (targetFraction * total - attended) / (1 - targetFraction);
    const consecutiveNeeded = Math.ceil(Math.max(0, rawX));
    return {
      type: "deficit",
      value: consecutiveNeeded,
      targetPct: target
    };
  } else {
    const rawY = attended / targetFraction - total;
    const safeAbsences = Math.floor(Math.max(0, rawY));
    return {
      type: "surplus",
      value: safeAbsences,
      targetPct: target
    };
  }
}

/**
 * Evaluates recovery / margin requirements across common university benchmarks.
 */
function evaluateBenchmarks(attended, total) {
  const benchmarks = [65, 75, 80, 85, 90];
  return benchmarks.map((bm) => {
    const rec = calculateRecovery(attended, total, bm);
    const currentPct = calculatePercentage(attended, total);
    return {
      benchmark: bm,
      currentPct,
      recovery: rec
    };
  });
}

/**
 * Projects attendance trajectory for upcoming lectures.
 */
function simulateTrajectory(currentAttended, currentTotal, upcomingTotal, upcomingAttended, target) {
  const projectedAttended = currentAttended + upcomingAttended;
  const projectedTotal = currentTotal + upcomingTotal;
  const projectedPct = calculatePercentage(projectedAttended, projectedTotal);
  const currentPct = calculatePercentage(currentAttended, currentTotal);
  const delta = Math.round((projectedPct - currentPct) * 10) / 10;
  const status = getAttendanceStatus(projectedPct, target);

  return {
    projectedAttended,
    projectedTotal,
    projectedPct,
    currentPct,
    delta,
    status
  };
}

// =============================================================
// DOM Elements Cache
// =============================================================
const dom = {};

function cacheDOMElements() {
  dom.btnDemoData = document.getElementById("btn-demo-data");
  dom.btnClearAll = document.getElementById("btn-clear-all");
  dom.demoBanner = document.getElementById("demo-banner");
  dom.btnDismissBanner = document.getElementById("btn-dismiss-banner");

  // Overview KPIs
  dom.kpiOverallPct = document.getElementById("kpi-overall-pct");
  dom.kpiOverallStatus = document.getElementById("kpi-overall-status");
  dom.kpiProgressBar = document.getElementById("kpi-progress-bar");
  dom.kpiClassesCount = document.getElementById("kpi-classes-count");
  dom.kpiRiskCount = document.getElementById("kpi-risk-count");
  dom.kpiSafeCount = document.getElementById("kpi-safe-count");
  dom.kpiActiveTarget = document.getElementById("kpi-active-target");

  // Subject Panel & Form
  dom.btnToggleForm = document.getElementById("btn-toggle-form");
  dom.formToggleIcon = document.getElementById("form-toggle-icon");
  dom.subjectForm = document.getElementById("subject-form");
  dom.formTitle = document.getElementById("form-title");
  dom.formEditId = document.getElementById("form-edit-id");
  dom.inputSubjectName = document.getElementById("input-subject-name");
  dom.inputClassesAttended = document.getElementById("input-classes-attended");
  dom.inputClassesTotal = document.getElementById("input-classes-total");
  dom.inputTargetPct = document.getElementById("input-target-pct");
  dom.btnSaveSubject = document.getElementById("btn-save-subject");
  dom.btnCancelEdit = document.getElementById("btn-cancel-edit");
  dom.subjectList = document.getElementById("subject-list");

  // Error fields
  dom.errSubjectName = document.getElementById("err-subject-name");
  dom.errClassesAttended = document.getElementById("err-classes-attended");
  dom.errClassesTotal = document.getElementById("err-classes-total");
  dom.errTargetPct = document.getElementById("err-target-pct");

  // Analytics Content
  dom.analyticsContent = document.getElementById("analytics-content");
  dom.analyticsEmpty = document.getElementById("analytics-empty");
  dom.btnEmptyDemo = document.getElementById("btn-empty-demo");
  dom.selectedSubjectSubtitle = document.getElementById("selected-subject-subtitle");

  // Detail Card
  dom.detailSubjectName = document.getElementById("detail-subject-name");
  dom.detailStatusBadge = document.getElementById("detail-status-badge");
  dom.detailCurrentPct = document.getElementById("detail-current-pct");
  dom.detailTargetPct = document.getElementById("detail-target-pct");
  dom.detailAttendedFraction = document.getElementById("detail-attended-fraction");
  dom.detailDeltaPct = document.getElementById("detail-delta-pct");
  dom.detailProgressBar = document.getElementById("detail-progress-bar");
  dom.detailTargetMarker = document.getElementById("detail-target-marker");
  dom.markerLegendText = document.getElementById("marker-legend-text");

  // Recovery Card
  dom.recoveryResultBox = document.getElementById("recovery-result-box");
  dom.benchmarkCards = document.getElementById("benchmark-cards");

  // Simulator
  dom.simUpcomingTotal = document.getElementById("sim-upcoming-total");
  dom.simUpcomingAttended = document.getElementById("sim-upcoming-attended");
  dom.simAttendedDisplay = document.getElementById("sim-attended-display");
  dom.simHalfMarker = document.getElementById("sim-half-marker");
  dom.simMaxMarker = document.getElementById("sim-max-marker");
  dom.projClasses = document.getElementById("proj-classes");
  dom.projPercentage = document.getElementById("proj-percentage");
  dom.projChange = document.getElementById("proj-change");
  dom.projStatus = document.getElementById("proj-status");
  dom.projSummaryText = document.getElementById("proj-summary-text");
  dom.presetAttendAll = document.getElementById("preset-attend-all");
  dom.presetAttendTarget = document.getElementById("preset-attend-target");
  dom.presetMissAll = document.getElementById("preset-miss-all");

  // Advisory
  dom.advisoryContent = document.getElementById("advisory-content");
}

// =============================================================
// Validation & Form Handling
// =============================================================

function clearFormErrors() {
  dom.errSubjectName.textContent = "";
  dom.errClassesAttended.textContent = "";
  dom.errClassesTotal.textContent = "";
  dom.errTargetPct.textContent = "";
}

function validateForm(name, attended, total, target) {
  clearFormErrors();
  let isValid = true;

  if (!name.trim()) {
    dom.errSubjectName.textContent = "Subject name is required.";
    isValid = false;
  }

  if (isNaN(attended) || attended < 0) {
    dom.errClassesAttended.textContent = "Attended classes must be a valid non-negative number.";
    isValid = false;
  }

  if (isNaN(total) || total <= 0) {
    dom.errClassesTotal.textContent = "Total classes conducted must be greater than zero.";
    isValid = false;
  }

  if (!isNaN(attended) && !isNaN(total) && attended > total) {
    dom.errClassesAttended.textContent = "Attended classes cannot exceed total conducted classes.";
    isValid = false;
  }

  if (isNaN(target) || target < 1 || target > 100) {
    dom.errTargetPct.textContent = "Target percentage must be between 1% and 100%.";
    isValid = false;
  }

  return isValid;
}

function toggleForm(forceOpen = null) {
  state.isFormOpen = forceOpen !== null ? forceOpen : !state.isFormOpen;
  if (state.isFormOpen) {
    dom.subjectForm.classList.add("active");
    dom.btnToggleForm.classList.remove("btn-primary");
    dom.btnToggleForm.classList.add("btn-secondary");
    dom.formToggleIcon.textContent = "✕";
  } else {
    dom.subjectForm.classList.remove("active");
    dom.btnToggleForm.classList.remove("btn-secondary");
    dom.btnToggleForm.classList.add("btn-primary");
    dom.formToggleIcon.textContent = "+";
    resetForm();
  }
}

function resetForm() {
  dom.formEditId.value = "";
  dom.inputSubjectName.value = "";
  dom.inputClassesAttended.value = "";
  dom.inputClassesTotal.value = "";
  dom.inputTargetPct.value = "75";
  dom.formTitle.textContent = "Add New Subject";
  dom.btnSaveSubject.textContent = "Save Subject";
  clearFormErrors();
  updatePresetButtonHighlight(75);
}

function updatePresetButtonHighlight(targetValue) {
  document.querySelectorAll(".btn-preset").forEach((btn) => {
    if (parseInt(btn.dataset.preset, 10) === parseInt(targetValue, 10)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function startEditSubject(id) {
  const subject = state.subjects.find((s) => s.id === id);
  if (!subject) return;

  state.editingSubjectId = id;
  dom.formEditId.value = subject.id;
  dom.inputSubjectName.value = subject.name;
  dom.inputClassesAttended.value = subject.attended;
  dom.inputClassesTotal.value = subject.total;
  dom.inputTargetPct.value = subject.target;
  dom.formTitle.textContent = `Edit Subject: ${subject.name}`;
  dom.btnSaveSubject.textContent = "Update Subject";
  updatePresetButtonHighlight(subject.target);

  toggleForm(true);
  dom.inputSubjectName.focus();
}

function handleFormSubmit(e) {
  e.preventDefault();

  const id = dom.formEditId.value;
  const name = dom.inputSubjectName.value.trim();
  const attended = parseInt(dom.inputClassesAttended.value, 10);
  const total = parseInt(dom.inputClassesTotal.value, 10);
  const target = parseInt(dom.inputTargetPct.value, 10);

  if (!validateForm(name, attended, total, target)) {
    return;
  }

  if (id) {
    // Edit existing subject
    const index = state.subjects.findIndex((s) => s.id === id);
    if (index !== -1) {
      state.subjects[index] = { ...state.subjects[index], name, attended, total, target };
    }
  } else {
    // Create new subject
    const newSubject = {
      id: "sub-" + Date.now(),
      name,
      attended,
      total,
      target
    };
    state.subjects.push(newSubject);
    state.selectedSubjectId = newSubject.id;
  }

  toggleForm(false);
  renderAll();
}

function deleteSubject(id) {
  const targetSub = state.subjects.find((s) => s.id === id);
  const name = targetSub ? targetSub.name : "this subject";
  if (!confirm(`Are you sure you want to remove "${name}" from your analysis?`)) {
    return;
  }

  state.subjects = state.subjects.filter((s) => s.id !== id);
  if (state.selectedSubjectId === id) {
    state.selectedSubjectId = state.subjects.length > 0 ? state.subjects[0].id : null;
  }
  renderAll();
}

// =============================================================
// Rendering Engine
// =============================================================

function renderOverview() {
  if (state.subjects.length === 0) {
    dom.kpiOverallPct.textContent = "0.0%";
    dom.kpiOverallStatus.textContent = "No Data";
    dom.kpiOverallStatus.className = "badge";
    dom.kpiProgressBar.style.width = "0%";
    dom.kpiClassesCount.textContent = "0 / 0";
    dom.kpiRiskCount.textContent = "0";
    dom.kpiSafeCount.textContent = "0 subjects registered";
    dom.kpiActiveTarget.textContent = "--";
    return;
  }

  let totalAttended = 0;
  let totalConducted = 0;
  let riskCount = 0;
  let safeCount = 0;
  let targetSum = 0;

  state.subjects.forEach((s) => {
    totalAttended += s.attended;
    totalConducted += s.total;
    targetSum += s.target;
    const pct = calculatePercentage(s.attended, s.total);
    if (pct < s.target) {
      riskCount++;
    } else {
      safeCount++;
    }
  });

  const overallPct = calculatePercentage(totalAttended, totalConducted);
  const avgTarget = Math.round(targetSum / state.subjects.length);
  const status = getAttendanceStatus(overallPct, avgTarget);

  dom.kpiOverallPct.textContent = `${overallPct}%`;
  dom.kpiOverallStatus.textContent = status.label;
  dom.kpiOverallStatus.className = `badge ${status.className}`;
  dom.kpiProgressBar.style.width = `${Math.min(100, overallPct)}%`;
  dom.kpiProgressBar.className = `progress-bar-fill ${status.barClass}`;

  dom.kpiClassesCount.textContent = `${totalAttended} / ${totalConducted}`;
  dom.kpiRiskCount.textContent = riskCount;
  dom.kpiSafeCount.textContent = `${safeCount} of ${state.subjects.length} subjects on track`;
  dom.kpiActiveTarget.textContent = `${avgTarget}% avg`;
}

function renderSubjectList() {
  dom.subjectList.innerHTML = "";

  if (state.subjects.length === 0) {
    dom.subjectList.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--slate-500); font-size: 0.9rem;">
        No subjects registered.<br>Click <strong>+ Add Subject</strong> or <strong>Load Demo Data</strong>.
      </div>
    `;
    return;
  }

  state.subjects.forEach((subj) => {
    const pct = calculatePercentage(subj.attended, subj.total);
    const status = getAttendanceStatus(pct, subj.target);
    const isSelected = subj.id === state.selectedSubjectId;

    const itemEl = document.createElement("div");
    itemEl.className = `subject-item ${isSelected ? "selected" : ""}`;
    itemEl.setAttribute("role", "button");
    itemEl.setAttribute("tabindex", "0");
    itemEl.setAttribute("aria-label", `Select subject ${subj.name}`);

    itemEl.innerHTML = `
      <div class="subject-item-header">
        <h4 class="subject-item-title" title="${subj.name}">${subj.name}</h4>
        <span class="badge ${status.className}">${status.label}</span>
      </div>
      <div class="subject-item-stats">
        <span>Attended: <strong>${subj.attended}</strong> / ${subj.total}</span>
        <span class="subject-item-pct" style="color: ${pct >= subj.target ? "var(--success-text)" : "var(--danger-text)"};">
          ${pct}%
        </span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${status.barClass}" style="width: ${Math.min(100, pct)}%;"></div>
      </div>
      <div class="subject-item-actions">
        <button class="btn btn-xs btn-outline btn-edit-subj" data-id="${subj.id}" title="Edit subject">&#9998; Edit</button>
        <button class="btn-danger-icon btn-delete-subj" data-id="${subj.id}" title="Delete subject">&#128465;</button>
      </div>
    `;

    // Click to select
    itemEl.addEventListener("click", (e) => {
      // Don't select if user clicked an action button
      if (e.target.closest(".btn-edit-subj") || e.target.closest(".btn-delete-subj")) {
        return;
      }
      state.selectedSubjectId = subj.id;
      renderAll();
    });

    // Keyboard accessibility for card selection
    itemEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        if (!e.target.closest(".btn-edit-subj") && !e.target.closest(".btn-delete-subj")) {
          e.preventDefault();
          state.selectedSubjectId = subj.id;
          renderAll();
        }
      }
    });

    // Action buttons inside card
    const editBtn = itemEl.querySelector(".btn-edit-subj");
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      startEditSubject(subj.id);
    });

    const delBtn = itemEl.querySelector(".btn-delete-subj");
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteSubject(subj.id);
    });

    dom.subjectList.appendChild(itemEl);
  });
}

function renderAnalytics() {
  if (state.subjects.length === 0) {
    dom.analyticsContent.style.display = "none";
    dom.analyticsEmpty.style.display = "block";
    dom.selectedSubjectSubtitle.textContent = "Add a subject to inspect metrics.";
    return;
  }

  dom.analyticsContent.style.display = "flex";
  dom.analyticsEmpty.style.display = "none";

  // Select first subject if current selection is invalid
  let subject = state.subjects.find((s) => s.id === state.selectedSubjectId);
  if (!subject) {
    subject = state.subjects[0];
    state.selectedSubjectId = subject.id;
  }

  dom.selectedSubjectSubtitle.textContent = `Mathematical model and recovery simulator for ${subject.name}`;

  // 1. Standing Card
  const pct = calculatePercentage(subject.attended, subject.total);
  const status = getAttendanceStatus(pct, subject.target);
  const delta = Math.round((pct - subject.target) * 10) / 10;
  const deltaSign = delta > 0 ? "+" : "";

  dom.detailSubjectName.textContent = subject.name;
  dom.detailStatusBadge.textContent = status.label;
  dom.detailStatusBadge.className = `badge badge-lg ${status.className}`;

  dom.detailCurrentPct.textContent = `${pct}%`;
  dom.detailTargetPct.textContent = `${subject.target}%`;
  dom.detailAttendedFraction.textContent = `${subject.attended} / ${subject.total}`;

  dom.detailDeltaPct.textContent = `${deltaSign}${delta}%`;
  dom.detailDeltaPct.style.color = delta >= 0 ? "var(--success-text)" : "var(--danger)";

  dom.detailProgressBar.style.width = `${Math.min(100, pct)}%`;
  dom.detailProgressBar.className = `progress-bar-fill ${status.barClass}`;

  dom.detailTargetMarker.style.left = `${subject.target}%`;
  dom.markerLegendText.textContent = `Target Threshold: ${subject.target}%`;

  // 2. Recovery Calculation Box
  const recovery = calculateRecovery(subject.attended, subject.total, subject.target);
  renderRecoveryBox(recovery, subject, pct);

  // 3. Benchmarks Grid
  renderBenchmarkGrid(subject.attended, subject.total);

  // 4. Simulator Updates
  updateSimulatorControls(subject);
  runSimulation(subject);

  // 5. Rule-Based Advisory
  renderAdvisory(subject, pct, delta, recovery);
}

function renderRecoveryBox(recovery, subject, currentPct) {
  let html = "";

  if (recovery.type === "deficit") {
    html = `
      <div class="recovery-highlight text-danger">
        &#9888;&#65039; Recovery Required: Attend at least <strong>${recovery.value}</strong> consecutive classes.
      </div>
      <p class="recovery-subtext">
        Your current attendance is <strong>${currentPct}%</strong>, which is below the mandatory <strong>${subject.target}%</strong> threshold.
        Attending the next <strong>${recovery.value}</strong> classes consecutively (without missing any) will raise your standing to:
        <strong>${calculatePercentage(subject.attended + recovery.value, subject.total + recovery.value)}%</strong> (${subject.attended + recovery.value} / ${subject.total + recovery.value} classes).
      </p>
      <div class="recovery-math-formula">
        Formula: x = &lceil;(P &times; Total &minus; Attended) / (1 &minus; P)&rceil; = &lceil;(${subject.target / 100} &times; ${subject.total} &minus; ${subject.attended}) / (1 &minus; ${subject.target / 100})&rceil; = ${recovery.value} classes
      </div>
    `;
  } else if (recovery.type === "surplus") {
    if (recovery.value === 0) {
      html = `
        <div class="recovery-highlight" style="color: var(--warning-text);">
          &#9888;&#65039; Zero Miss Margin: Borderline Threshold Met
        </div>
        <p class="recovery-subtext">
          You currently satisfy the <strong>${subject.target}%</strong> target exactly or within 1 class margin.
          You cannot afford to miss any upcoming class, as even 1 missed lecture will immediately drop your standing below ${subject.target}%.
        </p>
      `;
    } else {
      const projectedIfMiss = calculatePercentage(subject.attended, subject.total + recovery.value);
      html = `
        <div class="recovery-highlight" style="color: var(--success-text);">
          &#10004;&#65039; Safe Absence Allowance: Up to <strong>${recovery.value}</strong> classes can be missed.
        </div>
        <p class="recovery-subtext">
          Your current attendance is <strong>${currentPct}%</strong>. You maintain a positive margin and can safely miss up to
          <strong>${recovery.value}</strong> upcoming lectures without breaching the <strong>${subject.target}%</strong> institutional requirement.
          After missing ${recovery.value} lectures, attendance will settle at <strong>${projectedIfMiss}%</strong> (${subject.attended} / ${subject.total + recovery.value} classes).
        </p>
        <div class="recovery-math-formula">
          Formula: y = &lfloor;Attended / P &minus; Total&rfloor; = &lfloor;${subject.attended} / ${subject.target / 100} &minus; ${subject.total}&rfloor; = ${recovery.value} classes
        </div>
      `;
    }
  } else if (recovery.type === "impossible") {
    html = `
      <div class="recovery-highlight text-danger">
        &#10060; Target 100% Unattainable
      </div>
      <p class="recovery-subtext">
        Because absences have already been recorded (${subject.total - subject.attended} class missed), 100.0% attendance is mathematically impossible.
        The maximum achievable attendance asymptotically approaches 100% with continued consecutive attendance.
      </p>
    `;
  } else {
    html = `
      <div class="recovery-highlight" style="color: var(--success-text);">
        &#10004;&#65039; Perfect 100% Record
      </div>
      <p class="recovery-subtext">Zero absences recorded so far. Flawless attendance history.</p>
    `;
  }

  dom.recoveryResultBox.innerHTML = html;
}

function renderBenchmarkGrid(attended, total) {
  const benchmarks = evaluateBenchmarks(attended, total);
  dom.benchmarkCards.innerHTML = "";

  benchmarks.forEach((item) => {
    const card = document.createElement("div");
    card.className = "benchmark-card";

    let neededText = "";
    let statusClass = "";

    if (item.recovery.type === "deficit") {
      neededText = `+${item.recovery.value} class${item.recovery.value === 1 ? "" : "es"}`;
      statusClass = "text-danger";
    } else if (item.recovery.type === "surplus") {
      neededText = item.recovery.value === 0 ? "0 buffer" : `${item.recovery.value} bunk buffer`;
      statusClass = "text-success";
    } else {
      neededText = "N/A";
      statusClass = "";
    }

    card.innerHTML = `
      <div class="benchmark-target">${item.benchmark}% Target</div>
      <div class="benchmark-needed ${statusClass}">${neededText}</div>
      <div class="benchmark-status" style="color: var(--slate-500);">
        ${item.currentPct >= item.benchmark ? "&#10004; Met" : "&#9650; Deficit"}
      </div>
    `;
    dom.benchmarkCards.appendChild(card);
  });
}

function updateSimulatorControls(subject) {
  const maxSim = parseInt(dom.simUpcomingTotal.value, 10) || 10;
  dom.simUpcomingAttended.max = maxSim;

  // Clamp current simulation attended if max changed
  if (parseInt(dom.simUpcomingAttended.value, 10) > maxSim) {
    dom.simUpcomingAttended.value = maxSim;
  }

  dom.simHalfMarker.textContent = Math.floor(maxSim / 2);
  dom.simMaxMarker.textContent = `${maxSim} (Attend All)`;
}

function runSimulation(subject) {
  const upcomingTotal = parseInt(dom.simUpcomingTotal.value, 10) || 10;
  const upcomingAttended = parseInt(dom.simUpcomingAttended.value, 10) || 0;
  const target = subject.target;

  const simResult = simulateTrajectory(
    subject.attended,
    subject.total,
    upcomingTotal,
    upcomingAttended,
    target
  );

  // Update slider badge text
  const simPct = calculatePercentage(upcomingAttended, upcomingTotal);
  dom.simAttendedDisplay.textContent = `${upcomingAttended} / ${upcomingTotal} (${simPct}%)`;

  // Update projected pills
  dom.projClasses.textContent = `${simResult.projectedAttended} / ${simResult.projectedTotal}`;
  dom.projPercentage.textContent = `${simResult.projectedPct}%`;

  const deltaSign = simResult.delta > 0 ? "+" : "";
  dom.projChange.textContent = `${deltaSign}${simResult.delta}%`;
  dom.projChange.style.color = simResult.delta >= 0 ? "var(--success-text)" : "var(--danger)";

  dom.projStatus.textContent = simResult.status.label;
  dom.projStatus.className = `badge ${simResult.status.className}`;

  // Summary narration
  let summary = "";
  if (simResult.projectedPct >= target) {
    summary = `If you attend <strong>${upcomingAttended}</strong> of the next <strong>${upcomingTotal}</strong> lectures, your attendance will rise/stay at <strong>${simResult.projectedPct}%</strong>, safely above your <strong>${target}%</strong> institutional cutoff.`;
  } else {
    const remainingDeficit = calculateRecovery(simResult.projectedAttended, simResult.projectedTotal, target);
    summary = `Attending only <strong>${upcomingAttended}</strong> of the next <strong>${upcomingTotal}</strong> lectures will result in <strong>${simResult.projectedPct}%</strong> attendance. You will remain in shortage and still require <strong>${remainingDeficit.value}</strong> further consecutive attendances to recover.`;
  }

  dom.projSummaryText.innerHTML = summary;
}

function renderAdvisory(subject, currentPct, delta, recovery) {
  const items = [];

  // Rule 1: Institutional eligibility threshold (Typically 75%)
  if (currentPct < 65) {
    items.push({
      type: "urgent",
      icon: "&#128680;",
      title: "Immediate Action Required &mdash; Serious Shortage (< 65%)",
      desc: "Attendance is critically low. In most universities, students below 65% are officially barred from semester examinations or laboratory assessments without condonation."
    });
  } else if (currentPct < subject.target) {
    items.push({
      type: "caution",
      icon: "&#9888;&#65039;",
      title: `Sub-Threshold Warning (${currentPct}% vs ${subject.target}% Target)`,
      desc: `You need to attend ${recovery.value} uninterrupted lectures to regain good academic standing. Prioritize this course during timetable scheduling.`
    });
  } else {
    items.push({
      type: "positive",
      icon: "&#9989;",
      title: "Eligibility Met & Compliant",
      desc: `Your current attendance (${currentPct}%) meets your target of ${subject.target}%. Keep attending regular sessions to protect your safety buffer.`
    });
  }

  // Rule 2: Margin buffer advisory
  if (recovery.type === "surplus" && recovery.value > 0) {
    items.push({
      type: "positive",
      icon: "&#128737;&#65039;",
      title: `Buffer Margin: ${recovery.value} Classes`,
      desc: `You have accumulated enough attendance to absorb up to ${recovery.value} emergency absences while remaining strictly above ${subject.target}%.`
    });
  } else if (recovery.type === "deficit") {
    items.push({
      type: "urgent",
      icon: "&#128201;",
      title: "Zero Absence Policy Recommended",
      desc: "Any single additional absence right now inflates your required recovery count non-linearly. Treat all upcoming sessions as mandatory."
    });
  }

  // Rule 3: Final examination eligibility standard
  items.push({
    type: "neutral",
    icon: "&#128214;",
    title: "University Compliance Rule",
    desc: "Attendance criteria are evaluated cumulatively at term end. Regular periodic monitoring prevents end-of-semester condonation penalties."
  });

  dom.advisoryContent.innerHTML = items
    .map(
      (item) => `
      <div class="advisory-item ${item.type}">
        <span class="advisory-icon">${item.icon}</span>
        <div class="advisory-text">
          <strong>${item.title}</strong>
          ${item.desc}
        </div>
      </div>
    `
    )
    .join("");
}

function renderAll() {
  renderOverview();
  renderSubjectList();
  renderAnalytics();
}

// =============================================================
// Event Handlers & Initialization
// =============================================================

function loadDemoData() {
  // Deep clone demo subjects so modifications don't mutate template
  state.subjects = JSON.parse(JSON.stringify(DEMO_SUBJECTS));
  state.selectedSubjectId = state.subjects[0].id;
  dom.demoBanner.style.display = "block";
  renderAll();
}

function clearAllData() {
  if (state.subjects.length === 0) return;
  if (!confirm("Are you sure you want to clear all subjects? This action resets your dashboard.")) {
    return;
  }
  state.subjects = [];
  state.selectedSubjectId = null;
  toggleForm(false);
  renderAll();
}

function setupEventListeners() {
  // Navigation & Top Actions
  dom.btnDemoData.addEventListener("click", loadDemoData);
  dom.btnClearAll.addEventListener("click", clearAllData);
  dom.btnDismissBanner.addEventListener("click", () => {
    dom.demoBanner.style.display = "none";
  });

  // Empty state button
  dom.btnEmptyDemo.addEventListener("click", loadDemoData);

  // Subject Form
  dom.btnToggleForm.addEventListener("click", () => toggleForm());
  dom.btnCancelEdit.addEventListener("click", () => toggleForm(false));
  dom.subjectForm.addEventListener("submit", handleFormSubmit);

  // Target Preset Buttons inside Subject Form
  document.querySelectorAll(".btn-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetVal = btn.dataset.preset;
      dom.inputTargetPct.value = presetVal;
      updatePresetButtonHighlight(presetVal);
    });
  });

  dom.inputTargetPct.addEventListener("input", (e) => {
    updatePresetButtonHighlight(e.target.value);
  });

  // Simulator Inputs
  dom.simUpcomingTotal.addEventListener("input", () => {
    let val = parseInt(dom.simUpcomingTotal.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
      dom.simUpcomingTotal.value = 1;
    } else if (val > 100) {
      val = 100;
      dom.simUpcomingTotal.value = 100;
    }

    const currentSub = state.subjects.find((s) => s.id === state.selectedSubjectId);
    if (currentSub) {
      updateSimulatorControls(currentSub);
      runSimulation(currentSub);
    }
  });

  dom.simUpcomingAttended.addEventListener("input", () => {
    const currentSub = state.subjects.find((s) => s.id === state.selectedSubjectId);
    if (currentSub) {
      runSimulation(currentSub);
    }
  });

  // Simulator Presets
  dom.presetAttendAll.addEventListener("click", () => {
    const total = parseInt(dom.simUpcomingTotal.value, 10) || 10;
    dom.simUpcomingAttended.value = total;
    const currentSub = state.subjects.find((s) => s.id === state.selectedSubjectId);
    if (currentSub) runSimulation(currentSub);
  });

  dom.presetMissAll.addEventListener("click", () => {
    dom.simUpcomingAttended.value = 0;
    const currentSub = state.subjects.find((s) => s.id === state.selectedSubjectId);
    if (currentSub) runSimulation(currentSub);
  });

  dom.presetAttendTarget.addEventListener("click", () => {
    const total = parseInt(dom.simUpcomingTotal.value, 10) || 10;
    const currentSub = state.subjects.find((s) => s.id === state.selectedSubjectId);
    if (currentSub) {
      const targetPace = Math.round((currentSub.target / 100) * total);
      dom.simUpcomingAttended.value = targetPace;
      runSimulation(currentSub);
    }
  });
}

// Initial Boot
document.addEventListener("DOMContentLoaded", () => {
  cacheDOMElements();
  setupEventListeners();
  loadDemoData(); // Pre-load realistic demo data as specified
});
