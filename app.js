// To-Do List Application with Glass UI and Dark Mode

// Application State
let tasks = [];
let currentFilter = 'all';
let currentSort = 'priority';
let notificationsEnabled = false;
let lastNotificationDate = null;

// DOM Elements
const taskInput = document.getElementById('taskInput');
const taskDescription = document.getElementById('taskDescription');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const totalTasksElement = document.getElementById('totalTasks');
const completedTasksElement = document.getElementById('completedTasks');
const pendingTasksElement = document.getElementById('pendingTasks');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sortSelect');
const clearAllBtn = document.getElementById('clearAllBtn');
const themeToggle = document.getElementById('themeToggle');
const notificationToggle = document.getElementById('notificationToggle');
const toggleDescriptionBtn = document.getElementById('toggleDescriptionBtn');
const descriptionContainer = document.getElementById('descriptionContainer');
const prioritySelect = document.getElementById('prioritySelect');
const dueDateInput = document.getElementById('dueDate');
const notificationBanner = document.getElementById('notificationBanner');
const closeNotificationBtn = document.querySelector('.close-notification');
const confirmationModal = document.getElementById('confirmationModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const taskDetailModal = document.getElementById('taskDetailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');

// Initialize the application
function init() {
    loadTasks();
    loadTheme();
    loadNotificationSettings();
    setupEventListeners();
    updateStats();
    renderTasks();
    setupDailyNotification();
    
    // Set minimum date for due date to today
    const today = new Date().toISOString().split('T')[0];
    dueDateInput.min = today;
}

// Load tasks from localStorage
function loadTasks() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
        // Ensure all tasks have required fields
        tasks = tasks.map(task => ({
            id: task.id || generateId(),
            title: task.title || '',
            description: task.description || '',
            priority: task.priority || 'medium',
            dueDate: task.dueDate || null,
            completed: task.completed || false,
            createdAt: task.createdAt || new Date().toISOString()
        }));
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
}

// Load theme from localStorage
function loadTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    }
}

// Load notification settings from localStorage
function loadNotificationSettings() {
    const notifications = localStorage.getItem('notificationsEnabled');
    notificationsEnabled = notifications === 'true';
    notificationToggle.checked = notificationsEnabled;
    
    lastNotificationDate = localStorage.getItem('lastNotificationDate');
    
    // Request notification permission if enabled
    if (notificationsEnabled && Notification.permission === 'default') {
        requestNotificationPermission();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Filter tasks
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            renderTasks();
        });
    });
    
    // Sort tasks
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderTasks();
    });
    
    // Clear all tasks
    clearAllBtn.addEventListener('click', () => {
        confirmationModal.classList.remove('hidden');
    });
    
    // Confirmation modal
    confirmDeleteBtn.addEventListener('click', clearAllTasks);
    cancelDeleteBtn.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Notification toggle
    notificationToggle.addEventListener('change', toggleNotifications);
    
    // Toggle description
    toggleDescriptionBtn.addEventListener('click', () => {
        descriptionContainer.classList.toggle('hidden');
        toggleDescriptionBtn.innerHTML = descriptionContainer.classList.contains('hidden') 
            ? '<i class="fas fa-align-left"></i> Add Description'
            : '<i class="fas fa-times"></i> Hide Description';
    });
    
    // Notification banner
    closeNotificationBtn.addEventListener('click', () => {
        notificationBanner.classList.add('hidden');
    });
    
    // Task detail modal
    closeDetailBtn.addEventListener('click', () => {
        taskDetailModal.classList.add('hidden');
    });
    
    // Close modals when clicking outside
    [confirmationModal, taskDetailModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// Generate a unique ID for tasks
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add a new task
function addTask() {
    const title = taskInput.value.trim();
    if (!title) {
        showNotification('Please enter a task title', 'error');
        taskInput.focus();
        return;
    }
    
    const description = taskDescription.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value || null;
    
    const newTask = {
        id: generateId(),
        title,
        description,
        priority,
        dueDate,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    
    // Clear input fields
    taskInput.value = '';
    taskDescription.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'medium';
    
    // Hide description if visible
    descriptionContainer.classList.add('hidden');
    toggleDescriptionBtn.innerHTML = '<i class="fas fa-align-left"></i> Add Description';
    
    // Show success notification
    showNotification('Task added successfully!');
    
    // Focus back to input
    taskInput.focus();
}

// Render tasks based on filter and sort
function renderTasks() {
    // Filter tasks
    let filteredTasks = tasks;
    if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(task => !task.completed);
    }
    
    // Sort tasks
    filteredTasks = sortTasks(filteredTasks, currentSort);
    
    // Render to DOM
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks found. ${currentFilter !== 'all' ? 'Try changing the filter.' : 'Add a task to get started!'}</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => createTaskElement(task)).join('');
    
    // Add event listeners to task elements
    attachTaskEventListeners();
}

// Sort tasks based on selected criteria
function sortTasks(taskArray, sortBy) {
    const sortedTasks = [...taskArray];
    
    switch(sortBy) {
        case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            sortedTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
            break;
            
        case 'date':
            sortedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
            
        case 'dueDate':
            // Tasks with due dates come first, then sorted by date
            sortedTasks.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            break;
            
        case 'alphabetical':
            sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    return sortedTasks;
}

// Create HTML for a task element
function createTaskElement(task) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dueDateClass = 'task-due-date';
    let dueDateText = 'No due date';
    
    if (dueDate) {
        dueDateText = formatDate(dueDate);
        
        if (dueDate < today && !task.completed) {
            dueDateClass += ' overdue';
        }
    }
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="checkbox-container">
                <input type="checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''}>
                <label for="check-${task.id}" class="checkmark"></label>
            </div>
            <div class="task-content">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                    <span class="${dueDateClass}">
                        <i class="far fa-calendar-alt"></i> ${dueDateText}
                    </span>
                </div>
                ${task.description ? `<p class="task-description">${escapeHtml(truncateText(task.description, 100))}</p>` : ''}
            </div>
            <div class="task-actions">
                <button class="action-btn view" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" title="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
}

// Attach event listeners to task elements
function attachTaskEventListeners() {
    // Toggle completion
    document.querySelectorAll('.checkbox-container input').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const taskId = e.target.closest('.task-item').dataset.id;
            toggleTaskCompletion(taskId);
        });
    });
    
    // View task details
    document.querySelectorAll('.task-title, .action-btn.view').forEach(element => {
        element.addEventListener('click', (e) => {
            const taskId = e.target.closest('.task-item').dataset.id;
            showTaskDetails(taskId);
        });
    });
    
    // Edit task
    document.querySelectorAll('.action-btn.edit').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.closest('.task-item').dataset.id;
            editTask(taskId);
        });
    });
    
    // Delete task
    document.querySelectorAll('.action-btn.delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.closest('.task-item').dataset.id;
            deleteTask(taskId);
        });
    });
}

// Toggle task completion status
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks();
        
        const action = tasks[taskIndex].completed ? 'completed' : 'marked as pending';
        showNotification(`Task ${action}!`);
    }
}

// Show task details in modal
function showTaskDetails(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    document.getElementById('detailTaskTitle').textContent = task.title;
    document.getElementById('detailPriority').textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    document.getElementById('detailPriority').className = task.priority;
    
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dueDateText = formatDate(dueDate);
        if (dueDate < today && !task.completed) {
            dueDateText += ' (Overdue)';
        }
        
        document.getElementById('detailDueDate').textContent = dueDateText;
    } else {
        document.getElementById('detailDueDate').textContent = 'Not set';
    }
    
    document.getElementById('detailDescription').textContent = task.description || 'No description provided.';
    
    taskDetailModal.classList.remove('hidden');
}

// Edit a task
function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    // For simplicity, we'll prompt for new title
    // In a more advanced version, you could create an edit form
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
        task.title = newTitle.trim();
        
        const newDescription = prompt('Edit task description (optional):', task.description);
        if (newDescription !== null) {
            task.description = newDescription.trim();
        }
        
        saveTasks();
        renderTasks();
        showNotification('Task updated!');
    }
}

// Delete a task
function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        showNotification('Task deleted!');
    }
}

// Clear all tasks
function clearAllTasks() {
    tasks = [];
    saveTasks();
    renderTasks();
    confirmationModal.classList.add('hidden');
    showNotification('All tasks cleared!');
}

// Update statistics
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    
    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    pendingTasksElement.textContent = pending;
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDarkMode);
}

// Toggle notifications
function toggleNotifications() {
    notificationsEnabled = notificationToggle.checked;
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    
    if (notificationsEnabled && Notification.permission === 'default') {
        requestNotificationPermission();
    }
    
    showNotification(`Notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`);
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Notifications enabled! You will receive daily reminders.');
            } else {
                notificationToggle.checked = false;
                notificationsEnabled = false;
                localStorage.setItem('notificationsEnabled', false);
                showNotification('Notification permission denied.', 'error');
            }
        });
    }
}

// Setup daily notification
function setupDailyNotification() {
    if (!notificationsEnabled || !('Notification' in window)) return;
    
    const today = new Date().toDateString();
    
    // Check if we've already shown notification today
    if (lastNotificationDate === today) return;
    
    // Show notification if permission is granted
    if (Notification.permission === 'granted') {
        showDailyNotification();
        lastNotificationDate = today;
        localStorage.setItem('lastNotificationDate', today);
    }
}

// Show daily notification
function showDailyNotification() {
    if (!notificationsEnabled) return;
    
    const notification = new Notification('GlassTask Reminder', {
        body: 'Don\'t forget to update your tasks today!',
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 fill=%22%234f46e5%22>✅</text></svg>',
        tag: 'daily-reminder'
    });
    
    // Close notification after 5 seconds
    setTimeout(() => notification.close(), 5000);
}

// Show temporary notification banner
function showNotification(message, type = 'success') {
    const banner = notificationBanner;
    const bannerText = banner.querySelector('p');
    
    bannerText.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        banner.style.backgroundColor = 'var(--danger-color)';
    } else if (type === 'warning') {
        banner.style.backgroundColor = 'var(--warning-color)';
    } else {
        banner.style.backgroundColor = 'var(--success-color)';
    }
    
    banner.classList.remove('hidden');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (!banner.classList.contains('hidden')) {
            banner.classList.add('hidden');
        }
    }, 3000);
}

// Utility function to format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);