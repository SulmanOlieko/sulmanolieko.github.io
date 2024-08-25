let users = [];
let jobs = [
    { id: 1, title: "Consultation for Project A", assignedTo: 1, status: "In Progress" },
    { id: 2, title: "Consultation for Project B", assignedTo: null, status: "Open" },
    { id: 3, title: "Market Analysis for Project C", assignedTo: null, status: "Open" }
];

const LOGIN_TIMEOUT = 3600000; // 1 hour in milliseconds

document.addEventListener('DOMContentLoaded', () => {
    fetch('users.json')
        .then(response => response.json())
        .then(data => {
            users = data;
            checkLoginStatus();
        })
        .catch(error => console.error('Error fetching users:', error));
});

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const passwordHash = await hashPassword(password); // Hash the password

    const user = users.find(u => u.username === username && getStoredPasswordHash(u.id) === passwordHash);
    if (user) {
        setLoginStatus(user);
        showDashboard(user);
    } else {
        alert('Invalid credentials!');
    }
}

async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password); // Encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // Hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex string
    return hashHex;
}

function setLoginStatus(user) {
    const loginData = {
        userId: user.id,
        loginTime: Date.now()
    };
    localStorage.setItem('loginData', JSON.stringify(loginData));
}

function checkLoginStatus() {
    const loginData = JSON.parse(localStorage.getItem('loginData'));

    if (loginData) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - loginData.loginTime;

        if (elapsedTime < LOGIN_TIMEOUT) {
            const user = users.find(u => u.id === loginData.userId);
            if (user) {
                showDashboard(user);
                updateLoginTime();
            } else {
                logout();
            }
        } else {
            logout();
        }
    }
}

function updateLoginTime() {
    const loginData = JSON.parse(localStorage.getItem('loginData'));
    if (loginData) {
        loginData.loginTime = Date.now();
        localStorage.setItem('loginData', JSON.stringify(loginData));
    }
}

function showDashboard(user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-name').innerText = user.name;
    loadUserJobs(user.id);
    loadAvailableJobs();
}

function loadUserJobs(userId) {
    const assignedJobs = jobs.filter(job => job.assignedTo === userId);
    const jobContainer = document.getElementById('assigned-jobs');
    jobContainer.innerHTML = '';
    if (assignedJobs.length > 0) {
        assignedJobs.forEach(job => {
            jobContainer.innerHTML += `<li>${job.title} - Status: ${job.status}</li>`;
        });
    } else {
        jobContainer.innerHTML = '<li>No jobs assigned</li>';
    }
}

function loadAvailableJobs() {
    const availableJobs = jobs.filter(job => !job.assignedTo);
    const jobContainer = document.getElementById('available-jobs');
    jobContainer.innerHTML = '';
    if (availableJobs.length > 0) {
        availableJobs.forEach(job => {
            jobContainer.innerHTML += `<li>${job.title} <button onclick="applyJob(${job.id})">Apply</button></li>`;
        });
    } else {
        jobContainer.innerHTML = '<li>No available jobs</li>';
    }
}

function applyJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (confirm(`Are you sure you want to apply for the job: ${job.title}?`)) {
        job.status = 'Pending Approval';
        job.assignedTo = null; // or set this to the user's ID if they immediately get assigned
        loadAvailableJobs();
    }
}

function logout() {
    localStorage.removeItem('loginData');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

function getStoredPasswordHash(userId) {
    return localStorage.getItem(`user-${userId}-passwordHash`);
}

async function setPassword() {
    const newPassword = document.getElementById('new-password').value;
    const userId = JSON.parse(localStorage.getItem('loginData')).userId;
    const newPasswordHash = await hashPassword(newPassword);
    localStorage.setItem(`user-${userId}-passwordHash`, newPasswordHash);
    alert('Password set successfully.');
    document.getElementById('set-password-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

async function resetPasswordHandler() {
    const newPassword = document.getElementById('reset-password').value;
    const userId = JSON.parse(localStorage.getItem('loginData')).userId;
    const newPasswordHash = await hashPassword(newPassword);
    localStorage.setItem(`user-${userId}-passwordHash`, newPasswordHash);
    alert('Password reset successfully.');
    document.getElementById('reset-password-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

// Show and hide sections for setting and resetting passwords
function showSetPasswordSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('set-password-section').style.display = 'block';
}

function showResetPasswordSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('reset-password-section').style.display = 'block';
}
