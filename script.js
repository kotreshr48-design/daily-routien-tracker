/* =========================================================
   DAILY ROUTINE TRACKER
   Frontend ↔ Flask API ↔ MySQL
   ========================================================= */

const API_URL = "http://127.0.0.1:5000/api";

let currentUser = null;


/* =========================================================
   PAGE FUNCTIONS
   ========================================================= */

function showLogin() {
    document.getElementById("loginPage").style.display = "flex";
    document.getElementById("registerPage").style.display = "none";
    document.getElementById("dashboard").style.display = "none";
}


function showRegister() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("registerPage").style.display = "block";
    document.getElementById("dashboard").style.display = "none";
}


/* =========================================================
   REGISTER
   ========================================================= */

async function register(event) {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;


    if (!name || !email || !password) {
        alert("Please fill all fields.");
        return;
    }


    try {

        const response = await fetch(
            API_URL + "/register",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.message || "Registration failed.");

            return;
        }


        alert("Registration successful! Please login.");

        document.getElementById("registerName").value = "";
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";

        showLogin();

    } catch (error) {

        console.error("Registration error:", error);

        alert(
            "Cannot connect to Flask server.\n" +
            "Make sure app.py is running."
        );
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        alert("Please enter email and password.");

        return;
    }


    try {

        const response = await fetch(
            API_URL + "/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(data.message || "Login failed.");

            return;
        }


        currentUser = data.user;


        /*
         * Store user temporarily in browser.
         * The actual user data is stored in MySQL.
         */

        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );


        document.getElementById("loginPage").style.display = "none";

        document.getElementById("registerPage").style.display = "none";

        document.getElementById("dashboard").style.display = "block";


        document.getElementById("userName").innerText =
            currentUser.name;


        setDate();

        await loadTasks();

        await loadProgress();

    } catch (error) {

        console.error("Login error:", error);

        alert(
            "Cannot connect to Flask server.\n" +
            "Make sure app.py is running."
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    currentUser = null;

    localStorage.removeItem("currentUser");

    document.getElementById("dashboard").style.display = "none";

    document.getElementById("loginPage").style.display = "flex";

    document.getElementById("email").value = "";

    document.getElementById("password").value = "";
}


/* =========================================================
   DATE
   ========================================================= */

function getTodayDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const day =
        String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function setDate() {

    const today = new Date();


    const dateText =
        today.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const todayElement =
        document.getElementById("todayDate");


    if (todayElement) {

        todayElement.innerText = dateText;
    }


    const monthText =
        today.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    const monthElement =
        document.getElementById("monthName");


    if (monthElement) {

        monthElement.innerText = monthText;
    }
}


/* =========================================================
   LOAD TASKS FROM MYSQL
   ========================================================= */

async function loadTasks() {

    try {

        const response =
            await fetch(API_URL + "/tasks");


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load tasks."
            );

            return;
        }


        console.log(
            "Tasks loaded from MySQL:",
            data.tasks
        );


    } catch (error) {

        console.error(
            "Task loading error:",
            error
        );

        alert(
            "Could not load routines from database."
        );
    }
}


/* =========================================================
   LOAD DAILY PROGRESS
   ========================================================= */

async function loadProgress() {
    if (!currentUser) return;

    const date = getTodayDate();

    try {
        const response = await fetch(
            API_URL + "/progress/" + currentUser.user_id + "/" + date
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            console.error("Daily progress API error:", data);
            alert(data.message || "Unable to load daily progress.");
            return;
        }

        console.log("Daily progress:", data);

        const totalTasks = data.tasks ? data.tasks.length : 0;

        updateCheckboxes(data.tasks || []);

        updateProgressDisplay(
            data.completed_count || 0,
            totalTasks,
            data.percentage || 0
        );

    } catch (error) {
        console.error("Load progress error:", error);
        alert("Could not load daily progress.");
    }
}

/* =========================================================
   UPDATE CHECKBOXES
   ========================================================= */

function updateCheckboxes(tasks) {

    const checkboxes =
        document.querySelectorAll(
            ".routine-check"
        );


    checkboxes.forEach(
        function (checkbox, index) {

            if (!tasks[index]) {
                return;
            }


            checkbox.checked =
                Boolean(tasks[index].completed);


            const routine =
                checkbox.closest(
                    ".routine-item"
                );


            if (
                checkbox.checked &&
                routine
            ) {

                routine.classList.add(
                    "completed"
                );

            } else if (routine) {

                routine.classList.remove(
                    "completed"
                );
            }
        }
    );
}


/* =========================================================
   UPDATE PROGRESS DISPLAY
   ========================================================= */

function updateProgressDisplay(
    completed,
    total,
    percentage
) {

    const progressNumber =
        document.getElementById(
            "progressNumber"
        );


    const progressText =
        document.getElementById(
            "progressText"
        );


    const progressBar =
        document.getElementById(
            "progressBar"
        );


    const completedCount =
        document.getElementById(
            "completedCount"
        );


    if (progressNumber) {

        progressNumber.innerText =
            percentage;
    }


    if (progressText) {

        progressText.innerText =
            percentage + "%";
    }


    if (progressBar) {

        progressBar.style.width =
            percentage + "%";
    }


    if (completedCount) {

        completedCount.innerText =
            completed;
    }
}


/* =========================================================
   SAVE ONE ROUTINE
   ========================================================= */

async function saveRoutine(taskId, completed) {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    try {

        const response =
            await fetch(
                API_URL + "/progress",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id:
                            currentUser.user_id,

                        task_id:
                            taskId,

                        progress_date:
                            getTodayDate(),

                        completed:
                            completed

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Could not save progress."
            );

            return false;
        }


        return true;


    } catch (error) {

        console.error(
            "Save routine error:",
            error
        );

        alert(
            "Could not connect to Flask server."
        );

        return false;
    }
}


/* =========================================================
   CHECKBOX HANDLER
   ========================================================= */

async function routineChanged(
    checkbox,
    taskId
) {

    const item =
        checkbox.closest(
            ".routine-item"
        );


    if (checkbox.checked) {

        if (item) {

            item.classList.add(
                "completed"
            );
        }

    } else {

        if (item) {

            item.classList.remove(
                "completed"
            );
        }
    }


    const success =
        await saveRoutine(
            taskId,
            checkbox.checked
        );


    if (success) {

        await loadProgress();
    }
}


/* =========================================================
   CONNECT EXISTING CHECKBOXES
   ========================================================= */

function setupCheckboxes() {

    const checkboxes =
        document.querySelectorAll(
            ".routine-check"
        );


    checkboxes.forEach(
        function (checkbox, index) {

            checkbox.addEventListener(
                "change",
                function () {

                    /*
                     * Database task IDs are 1 to 8
                     * because our SQL inserted them
                     * in that order.
                     */

                    const taskId =
                        index + 1;


                    routineChanged(
                        checkbox,
                        taskId
                    );
                }
            );
        }
    );
}


/* =========================================================
   RESTORE LOGIN AFTER REFRESH
   ========================================================= */

async function restoreLogin() {

    const savedUser =
        localStorage.getItem(
            "currentUser"
        );


    if (!savedUser) {

        return;
    }


    try {

        currentUser =
            JSON.parse(savedUser);

    } catch (error) {

        localStorage.removeItem(
            "currentUser"
        );

        return;
    }


    if (!currentUser.user_id) {

        localStorage.removeItem(
            "currentUser"
        );

        currentUser = null;

        return;
    }


    document.getElementById(
        "loginPage"
    ).style.display = "none";


    document.getElementById(
        "registerPage"
    ).style.display = "none";


    document.getElementById(
        "dashboard"
    ).style.display = "block";


    document.getElementById(
        "userName"
    ).innerText =
        currentUser.name;


    setDate();

    await loadTasks();

    await loadProgress();
}


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        setDate();

        setupCheckboxes();

        await restoreLogin();

        restoreLogin();

    }
);
// ==========================================
// CALENDAR FEATURE
// ==========================================

let calendarDate = new Date();

async function renderCalendar() {

    const calendarGrid = document.getElementById("calendarGrid");
    const calendarMonth = document.getElementById("calendarMonth");

    if (!calendarGrid || !calendarMonth) {
        return;
    }

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const monthName = calendarDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    calendarMonth.innerText = monthName;

    calendarGrid.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Empty boxes before first day
    for (let i = 0; i < firstDay; i++) {

        const emptyDay = document.createElement("div");

        emptyDay.className = "calendar-day empty";

        calendarGrid.appendChild(emptyDay);
    }

    // Create days
    for (let day = 1; day <= totalDays; day++) {

        const dayElement = document.createElement("div");

        dayElement.className = "calendar-day";

        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const today = getTodayDate();

        if (date === today) {
            dayElement.classList.add("today");
        }

        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-progress">Loading...</div>
        `;

        calendarGrid.appendChild(dayElement);

        loadCalendarDay(date, dayElement);
    }
}


async function loadCalendarDay(date, dayElement) {

    if (!currentUser) {
        return;
    }

    try {

        const response = await fetch(
            API_URL +
            "/progress/" +
            currentUser.user_id +
            "/" +
            date
        );

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        const completed = Number(data.completed_count || 0);
        const total = Number(data.total_tasks || 8);

        const percentage = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        const progressElement =
            dayElement.querySelector(".day-progress");

        if (percentage === 100) {

            dayElement.classList.add("completed");

            progressElement.innerText = "✓ 100%";

        } else if (percentage > 0) {

            dayElement.classList.add("partial");

            progressElement.innerText =
                completed + "/" + total + " (" + percentage + "%)";

        } else {

            dayElement.classList.add("pending");

            progressElement.innerText = "0/8";
        }

    } catch (error) {

        console.error(
            "Calendar loading error:",
            error
        );

        const progressElement =
            dayElement.querySelector(".day-progress");

        if (progressElement) {
            progressElement.innerText = "—";
        }
    }
}


// Previous month
document.getElementById("prevMonth")?.addEventListener(
    "click",
    function () {

        calendarDate.setMonth(
            calendarDate.getMonth() - 1
        );

        renderCalendar();
    }
);


// Next month
document.getElementById("nextMonth")?.addEventListener(
    "click",
    function () {

        calendarDate.setMonth(
            calendarDate.getMonth() + 1
        );

        renderCalendar();
    }
);
/* ==========================================
   CALENDAR FEATURE
========================================== */

async function loadCalendar() {
    const calendarGrid = document.querySelector(".calendar-grid");

    if (!calendarGrid) {
        console.log("Calendar grid not found.");
        return;
    }

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    // Load monthly progress from MySQL
let monthlyProgress = {};

if (currentUser) {
    try {
        const response = await fetch(
            `${API_URL}/monthly-progress/${currentUser.user_id}/${year}/${month + 1}`
        );

        const data = await response.json();

        if (response.ok && data.success) {
            data.progress.forEach(function (item) {
                monthlyProgress[item.progress_date] = item;
            });
        }
    } catch (error) {
        console.error("Calendar progress error:", error);
    }
}

    // Update month title
    const monthTitle = document.querySelector(".calendar-header h2");

    if (monthTitle) {
        const monthName = calendarDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

        monthTitle.innerText = monthName;
    }

    // Clear old dates
    calendarGrid.innerHTML = "";

    // First day of month
    const firstDay = new Date(year, month, 1);

    // Number of days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Sunday = 0
    const startingDay = firstDay.getDay();

    // Empty boxes before day 1
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day empty";
        calendarGrid.appendChild(emptyDay);
    }

    // Create dates
    for (let day = 1; day <= totalDays; day++) {

        const dateBox = document.createElement("div");
        dateBox.className = "calendar-day";

        const dateNumber = document.createElement("div");
        dateNumber.className = "day-number";
        dateNumber.innerText = day;

        dateBox.appendChild(dateNumber);

        // Get progress for this date
const dateKey =
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const dayProgress = monthlyProgress[dateKey];

if (dayProgress) {
    if (dayProgress.status === "completed") {
        dateBox.classList.add("completed-day");
    } else if (dayProgress.status === "partial") {
        dateBox.classList.add("partial-day");
    } else {
        dateBox.classList.add("pending-day");
    }
}

        // Check today's date
        const today = new Date();

        if (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        ) {
            dateBox.classList.add("today");
        }
// Click calendar date to show daily details
dateBox.style.cursor = "pointer";

dateBox.addEventListener("click", async function () {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const selectedDate =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    try {
        const response = await fetch(
            `${API_URL}/progress/${currentUser.user_id}/${selectedDate}`
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Could not load daily progress.");
            return;
        }

        showDailyDetails(selectedDate, data);

    } catch (error) {
        console.error("Daily details error:", error);
        alert("Could not load daily progress.");
    }
});
        calendarGrid.appendChild(dateBox);
    }

    // Previous month button
    const previousButton = document.getElementById("previousMonth");

    if (previousButton) {
        previousButton.onclick = function () {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            loadCalendar();
        };
    }

    // Next month button
    const nextButton = document.getElementById("nextMonth");

    if (nextButton) {
        nextButton.onclick = function () {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            loadCalendar();
        };
    }
}


// Start calendar
document.addEventListener("DOMContentLoaded", function () {
    loadCalendar();
});
// =====================================================
// SHOW DAILY DETAILS
// =====================================================

// =====================================================
// SHOW DAILY ROUTINE DETAILS
// =====================================================

function showDailyDetails(selectedDate, data) {

    const modal = document.getElementById("dailyDetailsModal");
    const modalDate = document.getElementById("dailyModalDate");
    const routineList = document.getElementById("dailyRoutineList");
    const completedCount = document.getElementById("dailyCompletedCount");

    if (!modal || !modalDate || !routineList || !completedCount) {
        console.error("Daily details modal elements not found.");
        return;
    }

    if (!data || !data.tasks) {
        alert("No routine data available for " + selectedDate);
        return;
    }

    modalDate.innerText = selectedDate;

    routineList.innerHTML = "";

    let completed = 0;

    data.tasks.forEach(function(task) {

        const isCompleted = Number(task.completed) === 1;

        if (isCompleted) {
            completed++;
        }

        const row = document.createElement("div");

        row.className = isCompleted
            ? "daily-routine-row completed"
            : "daily-routine-row pending";

        const name = document.createElement("span");
        name.className = "daily-routine-name";
        name.innerText = task.task_name;

        const status = document.createElement("span");
        status.className = "daily-routine-status";

        if (isCompleted) {
            status.innerText = "✓ Completed";
        } else {
            status.innerText = "✗ Pending";
        }

        row.appendChild(name);
        row.appendChild(status);

        routineList.appendChild(row);
    });

    completedCount.innerText =
        "Completed: " + completed + " / " + data.tasks.length;

    modal.classList.add("show");
}
// =====================================================
// CLOSE DAILY DETAILS MODAL
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const modal = document.getElementById("dailyDetailsModal");
    const closeButton = document.getElementById("closeDailyModal");

    if (!modal || !closeButton) {
        return;
    }

    closeButton.addEventListener("click", function () {
        modal.classList.remove("show");
    });

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});