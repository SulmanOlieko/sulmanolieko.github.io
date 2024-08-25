let users = JSON.parse(localStorage.getItem('users')) || []; // Retrieve users from localStorage or initialize empty array
let jobs = [
    { id: 1, title: "Consultation for Project A", assignedTo: null, status: "Open" },
    { id: 2, title: "Consultation for Project B", assignedTo: null, status: "Open" },
    { id: 3, title: "Market Analysis for Project C", assignedTo: null, status: "Open" }
];

const LOGIN_TIMEOUT = 3600000; // 1 hour in milliseconds

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    // Add event listeners to prevent copy-paste in password fields
    const passwordFields = document.querySelectorAll('input[type="password"]');
    passwordFields.forEach(field => {
        field.onpaste = e => e.preventDefault();
        field.oncopy = e => e.preventDefault();
    });

    // Check if passwords match
    const newPasswordField = document.getElementById('new-password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const passwordMatchMessage = document.getElementById('password-match-message');

    confirmPasswordField.addEventListener('input', () => {
        if (newPasswordField.value !== confirmPasswordField.value) {
            passwordMatchMessage.textContent = 'Passwords do not match.';
        } else {
            passwordMatchMessage.textContent = '';
        }
    });
});

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const passwordHash = await hashPassword(password); // Hash the password

    const user = users.find(u => u.username === username && u.passwordHash === passwordHash);
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
    const loginData = JSON.parse(localStorage.getItem('loginData'));
    if (loginData && confirm(`Are you sure you want to apply for the job: ${job.title}?`)) {
        job.status = 'Pending Approval';
        job.assignedTo = loginData.userId; // Assign job to the current user
        loadAvailableJobs();
        loadUserJobs(loginData.userId);
    }
}

function logout() {
    localStorage.removeItem('loginData');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

async function createAccount() {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        alert('Username already exists. Please choose a different username.');
        return;
    }

    const newUserId = users.length + 1;
    const newUserName = username; // Assume username is also the user's name for simplicity
    const newPasswordHash = await hashPassword(password);
    const newUser = {
        id: newUserId,
        username: username,
        passwordHash: newPasswordHash,
        name: newUserName
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Account created successfully. You can now log in with your new account.');
    document.getElementById('create-account-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

async function resetPasswordHandler() {
    const newPassword = document.getElementById('reset-password').value;
    const username = document.getElementById('username').value;
    const user = users.find(u => u.username === username);
    if (!user) {
        alert('Username does not exist. Please create an account first.');
        return;
    }

    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    localStorage.setItem('users', JSON.stringify(users));
    alert('Password reset successfully. You can now log in with your new password.');
    document.getElementById('reset-password-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

function showCreateAccountSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('create-account-section').style.display = 'block';
}

function showResetPasswordSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('reset-password-section').style.display = 'block';
}

// Function to hide the construction popup
function hidePopup() {
    document.getElementById('construction-popup').style.display = 'none';
}
