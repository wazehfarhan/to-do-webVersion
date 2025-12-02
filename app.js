/**
 * NexusTasks - Modern To-Do List Application v2.0
 * Added: Footer, Excel Export/Import, Fixed Calendar
 */

// ===== Application State & Configuration =====
const AppState = {
    tasks: [],
    currentFilter: 'all',
    currentSort: 'priority',
    notificationsEnabled: false,
    soundEnabled: true,
    theme: 'light',
    accentColor: 'blue',
    draggingTask: null,
    dragOverTask: null,
    lastNotificationDate: null,
    isEditing: false,
    editTaskId: null,
    calendarOffset: 0 // For calendar navigation
};

// ===== DOM Elements =====
const DOM = {
    // Inputs & Forms
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    taskPriority: document.getElementById('taskPriority'),
    taskDueDate: document.getElementById('taskDueDate'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    
    // Task List
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    
    // Stats & Progress
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    progressPercent: document.getElementById('progressPercent'),
    progressFill: document.getElementById('progressFill'),
    visibleTasksCount: document.getElementById('visibleTasksCount'),
    
    // Footer Stats
    footerTotalTasks: document.getElementById('footerTotalTasks'),
    footerCompletedTasks: document.getElementById('footerCompletedTasks'),
    footerPendingTasks: document.getElementById('footerPendingTasks'),
    
    // Calendar
    calendarWeek: document.getElementById('calendarWeek'),
    calendarMonth: document.getElementById('calendarMonth'),
    prevWeekBtn: document.getElementById('prevWeekBtn'),
    nextWeekBtn: document.getElementById('nextWeekBtn'),
    
    // Controls
    filterButtons: document.querySelectorAll('.filter-btn'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    colorOptions: document.querySelectorAll('.color-option'),
    soundToggle: document.getElementById('soundToggle'),
    notificationToggle: document.getElementById('notificationToggle'),
    voiceSearchBtn: document.getElementById('voiceSearchBtn'),
    
    // Export/Import Buttons
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    exportExcelBtn: document.getElementById('exportExcelBtn'),
    importJsonBtn: document.getElementById('importJsonBtn'),
    importExcelBtn: document.getElementById('importExcelBtn'),
    footerExportBtn: document.getElementById('footerExportBtn'),
    footerImportBtn: document.getElementById('footerImportBtn'),
    
    // Export Modal
    exportModal: document.getElementById('exportModal'),
    exportJsonModalBtn: document.getElementById('exportJsonModalBtn'),
    exportExcelModalBtn: document.getElementById('exportExcelModalBtn'),
    exportCsvModalBtn: document.getElementById('exportCsvModalBtn'),
    cancelExportBtn: document.getElementById('cancelExportBtn'),
    
    // Clear buttons
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    floatingAddBtn: document.getElementById('floatingAddBtn'),
    toggleFormBtn: document.getElementById('toggleFormBtn'),
    formContent: document.getElementById('formContent'),
    
    // Modals
    editModal: document.getElementById('editModal'),
    confirmModal: document.getElementById('confirmModal'),
    editForm: document.getElementById('editForm'),
    editTitle: document.getElementById('editTitle'),
    editDescription: document.getElementById('editDescription'),
    editPriority: document.getElementById('editPriority'),
    editDueDate: document.getElementById('editDueDate'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    confirmActionBtn: document.getElementById('confirmActionBtn'),
    cancelActionBtn: document.getElementById('cancelActionBtn'),
    confirmMessage: document.getElementById('confirmMessage'),
    
    // File Inputs
    fileImportJson: document.getElementById('fileImportJson'),
    fileImportExcel: document.getElementById('fileImportExcel'),
    
    // Toast Container
    toastContainer: document.getElementById('toastContainer')
};

// ===== Audio Elements =====
const Audio = {
    add: document.getElementById('addSound'),
    complete: document.getElementById('completeSound'),
    delete: document.getElementById('deleteSound')
};

// ===== Utility Functions =====
const Utils = {
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Format date for display
    formatDate: (dateString) => {
        if (!dateString) return 'No due date';
        
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        };
        
        let formatted = date.toLocaleDateString('en-US', options);
        
        // Add overdue indicator
        if (date < today) {
            formatted += ' (Overdue)';
        } else if (date.getDate() === today.getDate() && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear()) {
            formatted += ' (Today)';
        } else if (date.getDate() === today.getDate() + 1 && 
                   date.getMonth() === today.getMonth() && 
                   date.getFullYear() === today.getFullYear()) {
            formatted += ' (Tomorrow)';
        }
        
        return formatted;
    },
    
    // Format creation date
    formatCreationDate: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    },
    
    // Check if date is overdue
    isOverdue: (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },
    
    // Escape HTML to prevent XSS
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Truncate text with ellipsis
    truncateText: (text, maxLength) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // Play sound effect
    playSound: (type) => {
        if (!AppState.soundEnabled) return;
        
        try {
            const audio = Audio[type];
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        } catch (error) {
            console.log('Sound error:', error);
        }
    },
    
    // Show toast notification
    showToast: (message, type = 'info', title = '') => {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<h4>${Utils.escapeHtml(title)}</h4>` : ''}
                <p>${Utils.escapeHtml(message)}</p>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        // Add close event
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    },
    
    // Show confirmation modal
    showConfirm: (message, callback) => {
        DOM.confirmMessage.textContent = message;
        DOM.confirmModal.classList.remove('hidden');
        
        const handleConfirm = () => {
            DOM.confirmModal.classList.add('hidden');
            DOM.confirmActionBtn.removeEventListener('click', handleConfirm);
            DOM.cancelActionBtn.removeEventListener('click', handleCancel);
            callback(true);
        };
        
        const handleCancel = () => {
            DOM.confirmModal.classList.add('hidden');
            DOM.confirmActionBtn.removeEventListener('click', handleConfirm);
            DOM.cancelActionBtn.removeEventListener('click', handleCancel);
            callback(false);
        };
        
        DOM.confirmActionBtn.addEventListener('click', handleConfirm);
        DOM.cancelActionBtn.addEventListener('click', handleCancel);
    },
    
    // Validate task data
    validateTask: (task) => {
        const errors = [];
        
        if (!task.title || task.title.trim() === '') {
            errors.push('Task title is required');
        }
        
        if (task.title && task.title.length > 200) {
            errors.push('Task title must be less than 200 characters');
        }
        
        if (task.description && task.description.length > 1000) {
            errors.push('Description must be less than 1000 characters');
        }
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            if (isNaN(dueDate.getTime())) {
                errors.push('Invalid due date');
            }
        }
        
        return errors;
    },
    
    // Format date for Excel (YYYY-MM-DD)
    formatDateForExcel: (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },
    
    // Convert priority to numeric value for sorting
    priorityToNumber: (priority) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[priority] || 2;
    },
    
    // Convert number back to priority
    numberToPriority: (num) => {
        const priorities = { 3: 'high', 2: 'medium', 1: 'low' };
        return priorities[num] || 'medium';
    }
};

// ===== Data Management Functions =====
const DataManager = {
    // Save tasks to localStorage
    saveTasks: () => {
        try {
            localStorage.setItem('nexusTasks', JSON.stringify(AppState.tasks));
            TaskManager.updateFooterStats();
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            Utils.showToast('Error saving tasks', 'error');
            return false;
        }
    },
    
    // Load tasks from localStorage
    loadTasks: () => {
        try {
            const stored = localStorage.getItem('nexusTasks');
            if (stored) {
                AppState.tasks = JSON.parse(stored);
                
                // Ensure all tasks have required fields
                AppState.tasks = AppState.tasks.map(task => ({
                    id: task.id || Utils.generateId(),
                    title: task.title || '',
                    description: task.description || '',
                    priority: task.priority || 'medium',
                    dueDate: task.dueDate || null,
                    createdAt: task.createdAt || new Date().toISOString(),
                    completed: task.completed || false,
                    order: task.order || AppState.tasks.length
                }));
                
                // Sort by order
                AppState.tasks.sort((a, b) => a.order - b.order);
            }
            TaskManager.updateFooterStats();
        } catch (error) {
            console.error('Error loading tasks:', error);
            AppState.tasks = [];
        }
    },
    
    // Save settings to localStorage
    saveSettings: () => {
        try {
            const settings = {
                theme: AppState.theme,
                accentColor: AppState.accentColor,
                notificationsEnabled: AppState.notificationsEnabled,
                soundEnabled: AppState.soundEnabled,
                lastNotificationDate: AppState.lastNotificationDate
            };
            localStorage.setItem('nexusSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    },
    
    // Load settings from localStorage
    loadSettings: () => {
        try {
            const stored = localStorage.getItem('nexusSettings');
            if (stored) {
                const settings = JSON.parse(stored);
                AppState.theme = settings.theme || 'light';
                AppState.accentColor = settings.accentColor || 'blue';
                AppState.notificationsEnabled = settings.notificationsEnabled || false;
                AppState.soundEnabled = settings.soundEnabled !== undefined ? settings.soundEnabled : true;
                AppState.lastNotificationDate = settings.lastNotificationDate || null;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },
    
    // Export tasks as JSON file
    exportToJSON: () => {
        try {
            const data = {
                tasks: AppState.tasks,
                exportedAt: new Date().toISOString(),
                version: '2.0',
                totalTasks: AppState.tasks.length,
                completedTasks: AppState.tasks.filter(t => t.completed).length,
                pendingTasks: AppState.tasks.filter(t => !t.completed).length
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexus-tasks-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showToast('Tasks exported to JSON successfully', 'success', 'Export Complete');
            return true;
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            Utils.showToast('Error exporting tasks to JSON', 'error', 'Export Failed');
            return false;
        }
    },
    
    // Export tasks to Excel
    exportToExcel: () => {
        try {
            // Prepare data for Excel
            const excelData = AppState.tasks.map(task => ({
                'Task ID': task.id,
                'Title': task.title,
                'Description': task.description || '',
                'Priority': task.priority.toUpperCase(),
                'Priority Value': Utils.priorityToNumber(task.priority),
                'Due Date': Utils.formatDateForExcel(task.dueDate),
                'Created Date': Utils.formatDateForExcel(task.createdAt),
                'Status': task.completed ? 'Completed' : 'Pending',
                'Completed': task.completed ? 'Yes' : 'No',
                'Order': task.order
            }));
            
            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Set column widths
            const wscols = [
                { wch: 15 }, // Task ID
                { wch: 30 }, // Title
                { wch: 50 }, // Description
                { wch: 10 }, // Priority
                { wch: 15 }, // Priority Value
                { wch: 12 }, // Due Date
                { wch: 12 }, // Created Date
                { wch: 10 }, // Status
                { wch: 10 }, // Completed
                { wch: 8 }   // Order
            ];
            ws['!cols'] = wscols;
            
            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
            
            // Add summary sheet
            const summaryData = [{
                'Total Tasks': AppState.tasks.length,
                'Completed Tasks': AppState.tasks.filter(t => t.completed).length,
                'Pending Tasks': AppState.tasks.filter(t => !t.completed).length,
                'Completion Rate': `${Math.round((AppState.tasks.filter(t => t.completed).length / AppState.tasks.length) * 100) || 0}%`,
                'Export Date': new Date().toLocaleDateString(),
                'Export Time': new Date().toLocaleTimeString()
            }];
            
            const ws2 = XLSX.utils.json_to_sheet(summaryData);
            ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
            
            // Generate Excel file
            const fileName = `nexus-tasks-${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            Utils.showToast('Tasks exported to Excel successfully', 'success', 'Export Complete');
            return true;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            Utils.showToast('Error exporting tasks to Excel', 'error', 'Export Failed');
            return false;
        }
    },
    
    // Export tasks to CSV
    exportToCSV: () => {
        try {
            // Prepare CSV data
            const headers = ['Title', 'Description', 'Priority', 'Due Date', 'Status', 'Created Date'];
            const csvData = AppState.tasks.map(task => [
                `"${task.title.replace(/"/g, '""')}"`,
                `"${(task.description || '').replace(/"/g, '""')}"`,
                task.priority,
                Utils.formatDateForExcel(task.dueDate) || '',
                task.completed ? 'Completed' : 'Pending',
                Utils.formatDateForExcel(task.createdAt)
            ]);
            
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexus-tasks-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showToast('Tasks exported to CSV successfully', 'success', 'Export Complete');
            return true;
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            Utils.showToast('Error exporting tasks to CSV', 'error', 'Export Failed');
            return false;
        }
    },
    
    // Import tasks from JSON file
    importFromJSON: (file) => {
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate imported data
                    if (!data.tasks || !Array.isArray(data.tasks)) {
                        throw new Error('Invalid file format: No tasks array found');
                    }
                    
                    // Merge with existing tasks
                    const newTasks = data.tasks.map(task => ({
                        id: Utils.generateId(), // Generate new IDs to avoid conflicts
                        title: task.title || '',
                        description: task.description || '',
                        priority: task.priority || 'medium',
                        dueDate: task.dueDate || null,
                        createdAt: task.createdAt || new Date().toISOString(),
                        completed: task.completed || false,
                        order: AppState.tasks.length + data.tasks.indexOf(task)
                    }));
                    
                    AppState.tasks.push(...newTasks);
                    DataManager.saveTasks();
                    TaskManager.renderTasks();
                    
                    Utils.showToast(`${newTasks.length} tasks imported from JSON`, 'success', 'Import Complete');
                } catch (error) {
                    console.error('Error parsing JSON file:', error);
                    Utils.showToast('Invalid JSON file format', 'error', 'Import Failed');
                }
            };
            
            reader.onerror = () => {
                Utils.showToast('Error reading JSON file', 'error', 'Import Failed');
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Error importing JSON:', error);
            Utils.showToast('Error importing tasks from JSON', 'error', 'Import Failed');
        }
    },
    
    // Import tasks from Excel/CSV file
    importFromExcel: (file) => {
        try {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (!jsonData.length) {
                        throw new Error('No data found in Excel file');
                    }
                    
                    // Convert Excel data to task format
                    const newTasks = jsonData.map((row, index) => {
                        // Handle different column names
                        const title = row.Title || row['Task Title'] || row.title || '';
                        const description = row.Description || row['Task Description'] || row.description || '';
                        const priority = (row.Priority || row.priority || 'medium').toLowerCase();
                        const dueDate = row['Due Date'] || row.dueDate || row['Due Date'] || null;
                        const completed = row.Completed === 'Yes' || row.Status === 'Completed' || row.completed === true || row.completed === 'true';
                        
                        return {
                            id: Utils.generateId(),
                            title: title.toString(),
                            description: description.toString(),
                            priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
                            dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
                            createdAt: new Date().toISOString(),
                            completed: completed,
                            order: AppState.tasks.length + index
                        };
                    }).filter(task => task.title.trim() !== ''); // Filter out empty titles
                    
                    if (newTasks.length === 0) {
                        throw new Error('No valid tasks found in Excel file');
                    }
                    
                    AppState.tasks.push(...newTasks);
                    DataManager.saveTasks();
                    TaskManager.renderTasks();
                    
                    Utils.showToast(`${newTasks.length} tasks imported from Excel`, 'success', 'Import Complete');
                } catch (error) {
                    console.error('Error parsing Excel file:', error);
                    Utils.showToast('Invalid Excel file format', 'error', 'Import Failed');
                }
            };
            
            reader.onerror = () => {
                Utils.showToast('Error reading Excel file', 'error', 'Import Failed');
            };
            
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error importing Excel:', error);
            Utils.showToast('Error importing tasks from Excel', 'error', 'Import Failed');
        }
    },
    
    // Show export modal
    showExportModal: () => {
        DOM.exportModal.classList.remove('hidden');
    },
    
    // Hide export modal
    hideExportModal: () => {
        DOM.exportModal.classList.add('hidden');
    }
};

// ===== Task Management Functions =====
const TaskManager = {
    // Add a new task
    addTask: () => {
        const title = DOM.taskTitle.value.trim();
        const description = DOM.taskDescription.value.trim();
        const priority = DOM.taskPriority.value;
        const dueDate = DOM.taskDueDate.value || null;
        
        // Validate
        if (!title) {
            Utils.showToast('Please enter a task title', 'error', 'Validation Error');
            DOM.taskTitle.focus();
            return;
        }
        
        const newTask = {
            id: Utils.generateId(),
            title,
            description,
            priority,
            dueDate,
            createdAt: new Date().toISOString(),
            completed: false,
            order: AppState.tasks.length
        };
        
        // Validate task data
        const errors = Utils.validateTask(newTask);
        if (errors.length > 0) {
            Utils.showToast(errors[0], 'error', 'Validation Error');
            return;
        }
        
        AppState.tasks.unshift(newTask);
        DataManager.saveTasks();
        TaskManager.renderTasks();
        
        // Clear form
        DOM.taskTitle.value = '';
        DOM.taskDescription.value = '';
        DOM.taskDueDate.value = '';
        DOM.taskPriority.value = 'medium';
        
        // Play sound
        Utils.playSound('add');
        
        // Show success message
        Utils.showToast('Task added successfully', 'success', 'Task Added');
        
        // Focus back to title
        DOM.taskTitle.focus();
    },
    
    // Update a task
    updateTask: (taskId, updates) => {
        const index = AppState.tasks.findIndex(task => task.id === taskId);
        if (index === -1) return false;
        
        // Validate updates
        const updatedTask = { ...AppState.tasks[index], ...updates };
        const errors = Utils.validateTask(updatedTask);
        if (errors.length > 0) {
            Utils.showToast(errors[0], 'error', 'Validation Error');
            return false;
        }
        
        AppState.tasks[index] = updatedTask;
        DataManager.saveTasks();
        TaskManager.renderTasks();
        
        Utils.showToast('Task updated successfully', 'success', 'Task Updated');
        return true;
    },
    
    // Delete a task
    deleteTask: (taskId) => {
        Utils.showConfirm('Are you sure you want to delete this task? This action cannot be undone.', (confirmed) => {
            if (confirmed) {
                AppState.tasks = AppState.tasks.filter(task => task.id !== taskId);
                DataManager.saveTasks();
                TaskManager.renderTasks();
                
                Utils.playSound('delete');
                Utils.showToast('Task deleted', 'info', 'Task Deleted');
            }
        });
    },
    
    // Toggle task completion
    toggleTaskCompletion: (taskId) => {
        const index = AppState.tasks.findIndex(task => task.id === taskId);
        if (index === -1) return;
        
        AppState.tasks[index].completed = !AppState.tasks[index].completed;
        DataManager.saveTasks();
        TaskManager.renderTasks();
        
        Utils.playSound('complete');
        const action = AppState.tasks[index].completed ? 'completed' : 'marked as pending';
        Utils.showToast(`Task ${action}`, 'success', 'Task Updated');
    },
    
    // Clear all tasks
    clearAllTasks: () => {
        Utils.showConfirm('Are you sure you want to delete ALL tasks? This action cannot be undone.', (confirmed) => {
            if (confirmed) {
                AppState.tasks = [];
                DataManager.saveTasks();
                TaskManager.renderTasks();
                
                Utils.showToast('All tasks cleared', 'info', 'Tasks Cleared');
            }
        });
    },
    
    // Clear completed tasks
    clearCompletedTasks: () => {
        const completedCount = AppState.tasks.filter(task => task.completed).length;
        
        if (completedCount === 0) {
            Utils.showToast('No completed tasks to clear', 'info', 'No Action');
            return;
        }
        
        Utils.showConfirm(`Are you sure you want to delete ${completedCount} completed task${completedCount > 1 ? 's' : ''}?`, (confirmed) => {
            if (confirmed) {
                AppState.tasks = AppState.tasks.filter(task => !task.completed);
                DataManager.saveTasks();
                TaskManager.renderTasks();
                
                Utils.showToast(`${completedCount} completed task${completedCount > 1 ? 's' : ''} cleared`, 'info', 'Tasks Cleared');
            }
        });
    },
    
    // Render tasks based on filter and sort
    renderTasks: () => {
        // Update stats first
        TaskManager.updateStats();
        TaskManager.updateFooterStats();
        
        // Filter tasks
        let filteredTasks = [...AppState.tasks];
        
        // Apply search filter
        const searchTerm = DOM.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchTerm) ||
                task.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (AppState.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (AppState.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        }
        
        // Sort tasks
        filteredTasks = TaskManager.sortTasks(filteredTasks, AppState.currentSort);
        
        // Update visible tasks count
        DOM.visibleTasksCount.textContent = filteredTasks.length;
        
        // Render tasks or empty state
        if (filteredTasks.length === 0) {
            DOM.taskList.innerHTML = DOM.emptyState.outerHTML;
            return;
        }
        
        // Generate task HTML
        let tasksHTML = '';
        filteredTasks.forEach(task => {
            tasksHTML += TaskManager.createTaskHTML(task);
        });
        
        DOM.taskList.innerHTML = tasksHTML;
        
        // Attach event listeners to rendered tasks
        TaskManager.attachTaskListeners();
        
        // Initialize drag and drop
        TaskManager.initDragAndDrop();
    },
    
    // Create HTML for a task
    createTaskHTML: (task) => {
        const isOverdue = Utils.isOverdue(task.dueDate);
        const creationDate = Utils.formatCreationDate(task.createdAt);
        const dueDate = Utils.formatDate(task.dueDate);
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" 
                 data-id="${task.id}" 
                 draggable="true"
                 aria-label="${task.title}, ${task.priority} priority, ${task.completed ? 'completed' : 'pending'}">
                <div class="task-checkbox">
                    <div class="custom-checkbox ${task.completed ? 'checked' : ''}" 
                         role="checkbox" 
                         aria-checked="${task.completed}"
                         tabindex="0"
                         aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}">
                    </div>
                </div>
                <div class="task-content">
                    <h3 class="task-title">${Utils.escapeHtml(task.title)}</h3>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">
                            <i class="fas fa-flag"></i> ${task.priority}
                        </span>
                        <span class="task-date ${isOverdue && !task.completed ? 'overdue' : ''}">
                            <i class="far fa-calendar-alt"></i> ${dueDate}
                        </span>
                        <span class="task-date">
                            <i class="far fa-clock"></i> Created ${creationDate}
                        </span>
                    </div>
                    ${task.description ? `
                        <p class="task-description">${Utils.escapeHtml(Utils.truncateText(task.description, 150))}</p>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="action-btn view" aria-label="View task details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" aria-label="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" aria-label="Delete task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    // Sort tasks based on criteria
    sortTasks: (tasks, sortBy) => {
        const sorted = [...tasks];
        
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                sorted.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
                break;
                
            case 'date':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
                
            case 'dueDate':
                sorted.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
                
            case 'alphabetical':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        return sorted;
    },
    
    // Update statistics
    updateStats: () => {
        const total = AppState.tasks.length;
        const completed = AppState.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        DOM.totalTasks.textContent = total;
        DOM.completedTasks.textContent = completed;
        DOM.pendingTasks.textContent = pending;
        DOM.progressPercent.textContent = `${progress}%`;
        DOM.progressFill.style.width = `${progress}%`;
    },
    
    // Update footer statistics
    updateFooterStats: () => {
        const total = AppState.tasks.length;
        const completed = AppState.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        DOM.footerTotalTasks.textContent = total;
        DOM.footerCompletedTasks.textContent = completed;
        DOM.footerPendingTasks.textContent = pending;
    },
    
    // Attach event listeners to tasks
    attachTaskListeners: () => {
        // Checkbox toggle
        document.querySelectorAll('.custom-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                TaskManager.toggleTaskCompletion(taskId);
            });
            
            // Add keyboard support
            checkbox.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const taskId = e.target.closest('.task-item').dataset.id;
                    TaskManager.toggleTaskCompletion(taskId);
                }
            });
        });
        
        // View task details
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                TaskManager.showTaskDetails(taskId);
            });
        });
        
        // Edit task
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                TaskManager.openEditModal(taskId);
            });
        });
        
        // Delete task
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                TaskManager.deleteTask(taskId);
            });
        });
        
        // Task title click (view details)
        document.querySelectorAll('.task-title').forEach(title => {
            title.addEventListener('click', (e) => {
                const taskId = e.target.closest('.task-item').dataset.id;
                TaskManager.showTaskDetails(taskId);
            });
        });
    },
    
    // Show task details (simplified view)
    showTaskDetails: (taskId) => {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const isOverdue = Utils.isOverdue(task.dueDate);
        const dueDate = Utils.formatDate(task.dueDate);
        const creationDate = Utils.formatCreationDate(task.createdAt);
        
        const details = `
            <strong>Title:</strong> ${Utils.escapeHtml(task.title)}<br><br>
            <strong>Priority:</strong> <span class="task-priority ${task.priority}">${task.priority}</span><br><br>
            <strong>Status:</strong> ${task.completed ? 'Completed' : 'Pending'}<br><br>
            <strong>Created:</strong> ${creationDate}<br><br>
            <strong>Due Date:</strong> <span class="${isOverdue && !task.completed ? 'overdue' : ''}">${dueDate}</span><br><br>
            <strong>Description:</strong><br>
            ${task.description ? Utils.escapeHtml(task.description) : '<em>No description provided</em>'}
        `;
        
        Utils.showToast(details, 'info', 'Task Details');
    },
    
    // Open edit modal
    openEditModal: (taskId) => {
        const task = AppState.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        AppState.isEditing = true;
        AppState.editTaskId = taskId;
        
        // Populate form
        DOM.editTitle.value = task.title;
        DOM.editDescription.value = task.description || '';
        DOM.editPriority.value = task.priority;
        DOM.editDueDate.value = task.dueDate || '';
        
        // Show modal
        DOM.editModal.classList.remove('hidden');
        DOM.editTitle.focus();
    },
    
    // Close edit modal
    closeEditModal: () => {
        AppState.isEditing = false;
        AppState.editTaskId = null;
        DOM.editModal.classList.add('hidden');
        DOM.editForm.reset();
    },
    
    // Handle edit form submission
    handleEditSubmit: (e) => {
        e.preventDefault();
        
        if (!AppState.isEditing || !AppState.editTaskId) return;
        
        const updates = {
            title: DOM.editTitle.value.trim(),
            description: DOM.editDescription.value.trim(),
            priority: DOM.editPriority.value,
            dueDate: DOM.editDueDate.value || null
        };
        
        if (TaskManager.updateTask(AppState.editTaskId, updates)) {
            TaskManager.closeEditModal();
        }
    },
    
    // Initialize drag and drop
    initDragAndDrop: () => {
        const taskItems = document.querySelectorAll('.task-item');
        
        taskItems.forEach(item => {
            // Drag start
            item.addEventListener('dragstart', (e) => {
                AppState.draggingTask = item;
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            
            // Drag end
            item.addEventListener('dragend', () => {
                AppState.draggingTask = null;
                item.classList.remove('dragging');
                document.querySelectorAll('.task-item').forEach(i => {
                    i.classList.remove('over');
                });
            });
            
            // Drag over
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (AppState.draggingTask && AppState.draggingTask !== item) {
                    item.classList.add('over');
                }
            });
            
            // Drag leave
            item.addEventListener('dragleave', () => {
                item.classList.remove('over');
            });
            
            // Drop
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('over');
                
                if (AppState.draggingTask && AppState.draggingTask !== item) {
                    const draggedId = AppState.draggingTask.dataset.id;
                    const targetId = item.dataset.id;
                    
                    TaskManager.reorderTasks(draggedId, targetId);
                }
            });
        });
    },
    
    // Reorder tasks after drag and drop
    reorderTasks: (draggedId, targetId) => {
        const draggedIndex = AppState.tasks.findIndex(t => t.id === draggedId);
        const targetIndex = AppState.tasks.findIndex(t => t.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Remove dragged task
        const [draggedTask] = AppState.tasks.splice(draggedIndex, 1);
        
        // Insert at target position
        AppState.tasks.splice(targetIndex, 0, draggedTask);
        
        // Update order property
        AppState.tasks.forEach((task, index) => {
            task.order = index;
        });
        
        DataManager.saveTasks();
        TaskManager.renderTasks();
        
        Utils.showToast('Task reordered', 'success', 'Order Updated');
    },
    
    // Update calendar view
    updateCalendar: () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() + (AppState.calendarOffset * 7));
        
        let calendarHTML = '';
        
        // Update month display
        const displayDate = new Date(startDate);
        DOM.calendarMonth.textContent = `${months[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
        
        // Show 7 days starting from the calculated date
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const dayName = days[date.getDay()];
            const dayNumber = date.getDate();
            const dateString = date.toISOString().split('T')[0];
            
            // Check if this is today
            const isToday = date.toDateString() === today.toDateString();
            
            // Count tasks for this day
            const tasksForDay = AppState.tasks.filter(task => 
                task.dueDate === dateString
            ).length;
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'active' : ''}" 
                     title="${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}: ${tasksForDay} task${tasksForDay !== 1 ? 's' : ''}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-number">${dayNumber}</div>
                    ${tasksForDay > 0 ? `<div class="day-tasks">${tasksForDay}</div>` : ''}
                </div>
            `;
        }
        
        DOM.calendarWeek.innerHTML = calendarHTML;
    },
    
    // Navigate calendar weeks
    navigateCalendar: (direction) => {
        AppState.calendarOffset += direction;
        TaskManager.updateCalendar();
    },
    
    // Reset calendar to current week
    resetCalendar: () => {
        AppState.calendarOffset = 0;
        TaskManager.updateCalendar();
    }
};

// ===== Theme & UI Management =====
const UIManager = {
    // Apply theme
    applyTheme: (theme) => {
        AppState.theme = theme;
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);
        
        // Update theme buttons
        DOM.themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        DataManager.saveSettings();
    },
    
    // Apply accent color
    applyAccentColor: (color) => {
        AppState.accentColor = color;
        document.body.classList.remove('color-blue', 'color-purple', 'color-green', 'color-orange');
        document.body.classList.add(`color-${color}`);
        
        // Update color picker
        DOM.colorOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.color === color);
        });
        
        DataManager.saveSettings();
    },
    
    // Toggle sound
    toggleSound: (enabled) => {
        AppState.soundEnabled = enabled;
        DOM.soundToggle.checked = enabled;
        DataManager.saveSettings();
    },
    
    // Toggle notifications
    toggleNotifications: (enabled) => {
        AppState.notificationsEnabled = enabled;
        DOM.notificationToggle.checked = enabled;
        DataManager.saveSettings();
        
        if (enabled && Notification.permission === 'default') {
            NotificationManager.requestPermission();
        }
    },
    
    // Initialize UI from settings
    initUI: () => {
        // Apply theme
        UIManager.applyTheme(AppState.theme);
        
        // Apply accent color
        UIManager.applyAccentColor(AppState.accentColor);
        
        // Apply sound setting
        UIManager.toggleSound(AppState.soundEnabled);
        
        // Apply notification setting
        UIManager.toggleNotifications(AppState.notificationsEnabled);
        
        // Update calendar
        TaskManager.updateCalendar();
    }
};

// ===== Notification Manager =====
const NotificationManager = {
    // Request notification permission
    requestPermission: () => {
        if (!('Notification' in window)) {
            Utils.showToast('Notifications not supported in this browser', 'warning', 'Notifications');
            return;
        }
        
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    Utils.showToast('Notifications enabled! You will receive daily reminders.', 'success', 'Notifications');
                } else {
                    AppState.notificationsEnabled = false;
                    DOM.notificationToggle.checked = false;
                    DataManager.saveSettings();
                    Utils.showToast('Notifications disabled. You can enable them in settings.', 'info', 'Notifications');
                }
            });
        }
    },
    
    // Check and send daily notification
    checkDailyNotification: () => {
        if (!AppState.notificationsEnabled || Notification.permission !== 'granted') {
            return;
        }
        
        const today = new Date().toDateString();
        
        // Check if notification already sent today
        if (AppState.lastNotificationDate === today) {
            return;
        }
        
        // Send notification
        const notification = new Notification('NexusTasks Reminder', {
            body: 'Don\'t forget to update your tasks today!',
            icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✅</text></svg>',
            tag: 'daily-reminder',
            requireInteraction: true
        });
        
        // Update last notification date
        AppState.lastNotificationDate = today;
        DataManager.saveSettings();
        
        // Close notification after 10 seconds
        setTimeout(() => notification.close(), 10000);
    },
    
    // Setup daily notification check
    setupNotifications: () => {
        // Check immediately
        NotificationManager.checkDailyNotification();
        
        // Check every hour
        setInterval(NotificationManager.checkDailyNotification, 60 * 60 * 1000);
    }
};

// ===== Voice Search =====
const VoiceSearch = {
    isListening: false,
    recognition: null,
    
    // Initialize voice recognition
    init: () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            VoiceSearch.recognition = new SpeechRecognition();
            VoiceSearch.recognition.continuous = false;
            VoiceSearch.recognition.interimResults = false;
            
            VoiceSearch.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                DOM.searchInput.value = transcript;
                TaskManager.renderTasks();
                
                Utils.showToast(`Searching for: "${transcript}"`, 'info', 'Voice Search');
            };
            
            VoiceSearch.recognition.onerror = (event) => {
                Utils.showToast('Voice recognition error', 'error', 'Voice Search');
            };
            
            VoiceSearch.recognition.onend = () => {
                VoiceSearch.isListening = false;
                DOM.voiceSearchBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            };
        }
    },
    
    // Toggle voice search
    toggle: () => {
        if (!VoiceSearch.recognition) {
            Utils.showToast('Voice search not supported in this browser', 'warning', 'Voice Search');
            return;
        }
        
        if (VoiceSearch.isListening) {
            VoiceSearch.recognition.stop();
        } else {
            VoiceSearch.recognition.start();
            VoiceSearch.isListening = true;
            DOM.voiceSearchBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            Utils.showToast('Listening... Speak now', 'info', 'Voice Search');
        }
    }
};

// ===== Event Listeners Setup =====
const EventManager = {
    // Initialize all event listeners
    init: () => {
        // Add task
        DOM.addTaskBtn.addEventListener('click', TaskManager.addTask);
        DOM.taskTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') TaskManager.addTask();
        });
        
        // Floating add button
        DOM.floatingAddBtn.addEventListener('click', () => {
            DOM.taskTitle.focus();
            DOM.formContent.classList.remove('hidden');
            DOM.toggleFormBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        });
        
        // Toggle form
        DOM.toggleFormBtn.addEventListener('click', () => {
            DOM.formContent.classList.toggle('hidden');
            DOM.toggleFormBtn.innerHTML = DOM.formContent.classList.contains('hidden') 
                ? '<i class="fas fa-chevron-down"></i>'
                : '<i class="fas fa-chevron-up"></i>';
        });
        
        // Search
        DOM.searchInput.addEventListener('input', () => {
            TaskManager.renderTasks();
        });
        
        // Filter buttons
        DOM.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.currentFilter = btn.dataset.filter;
                TaskManager.renderTasks();
            });
        });
        
        // Sort select
        DOM.sortSelect.addEventListener('change', () => {
            AppState.currentSort = DOM.sortSelect.value;
            TaskManager.renderTasks();
        });
        
        // Theme buttons
        DOM.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                UIManager.applyTheme(btn.dataset.theme);
            });
        });
        
        // Color options
        DOM.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                UIManager.applyAccentColor(option.dataset.color);
            });
        });
        
        // Sound toggle
        DOM.soundToggle.addEventListener('change', () => {
            UIManager.toggleSound(DOM.soundToggle.checked);
        });
        
        // Notification toggle
        DOM.notificationToggle.addEventListener('change', () => {
            UIManager.toggleNotifications(DOM.notificationToggle.checked);
        });
        
        // Voice search
        DOM.voiceSearchBtn.addEventListener('click', VoiceSearch.toggle);
        
        // Calendar navigation
        DOM.prevWeekBtn.addEventListener('click', () => TaskManager.navigateCalendar(-1));
        DOM.nextWeekBtn.addEventListener('click', () => TaskManager.navigateCalendar(1));
        
        // Export buttons
        DOM.exportJsonBtn.addEventListener('click', DataManager.exportToJSON);
        DOM.exportExcelBtn.addEventListener('click', DataManager.exportToExcel);
        DOM.footerExportBtn.addEventListener('click', DataManager.showExportModal);
        
        // Export modal buttons
        DOM.exportJsonModalBtn.addEventListener('click', () => {
            DataManager.hideExportModal();
            DataManager.exportToJSON();
        });
        
        DOM.exportExcelModalBtn.addEventListener('click', () => {
            DataManager.hideExportModal();
            DataManager.exportToExcel();
        });
        
        DOM.exportCsvModalBtn.addEventListener('click', () => {
            DataManager.hideExportModal();
            DataManager.exportToCSV();
        });
        
        DOM.cancelExportBtn.addEventListener('click', DataManager.hideExportModal);
        
        // Import buttons
        DOM.importJsonBtn.addEventListener('click', () => DOM.fileImportJson.click());
        DOM.importExcelBtn.addEventListener('click', () => DOM.fileImportExcel.click());
        DOM.footerImportBtn.addEventListener('click', () => {
            // Show import options
            Utils.showConfirm('Choose import format:', (choice) => {
                if (choice) {
                    DOM.fileImportJson.click();
                } else {
                    DOM.fileImportExcel.click();
                }
            });
        });
        
        // File import handlers
        DOM.fileImportJson.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                DataManager.importFromJSON(e.target.files[0]);
                e.target.value = ''; // Reset file input
            }
        });
        
        DOM.fileImportExcel.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                DataManager.importFromExcel(e.target.files[0]);
                e.target.value = ''; // Reset file input
            }
        });
        
        // Clear buttons
        DOM.clearCompletedBtn.addEventListener('click', TaskManager.clearCompletedTasks);
        DOM.clearAllBtn.addEventListener('click', TaskManager.clearAllTasks);
        
        // Edit modal
        DOM.editForm.addEventListener('submit', TaskManager.handleEditSubmit);
        DOM.cancelEditBtn.addEventListener('click', TaskManager.closeEditModal);
        
        // Close modal when clicking outside
        [DOM.editModal, DOM.confirmModal, DOM.exportModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                DOM.taskTitle.focus();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                if (!DOM.editModal.classList.contains('hidden')) {
                    TaskManager.closeEditModal();
                }
                if (!DOM.confirmModal.classList.contains('hidden')) {
                    DOM.confirmModal.classList.add('hidden');
                }
                if (!DOM.exportModal.classList.contains('hidden')) {
                    DataManager.hideExportModal();
                }
            }
            
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                DOM.searchInput.focus();
            }
            
            // Ctrl/Cmd + E: Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                DataManager.showExportModal();
            }
            
            // Ctrl/Cmd + I: Import
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                DOM.fileImportJson.click();
            }
        });
        
        // Initialize voice search
        VoiceSearch.init();
        
        // Reset calendar when clicking on month title
        DOM.calendarMonth.addEventListener('click', TaskManager.resetCalendar);
    }
};

// ===== Application Initialization =====
const App = {
    // Initialize the application
    init: () => {
        console.log('NexusTasks v2.0 Initializing...');
        
        // Load data
        DataManager.loadSettings();
        DataManager.loadTasks();
        
        // Initialize UI
        UIManager.initUI();
        
        // Initialize event listeners
        EventManager.init();
        
        // Render tasks
        TaskManager.renderTasks();
        
        // Setup notifications
        NotificationManager.setupNotifications();
        
        // Show welcome message
        setTimeout(() => {
            if (AppState.tasks.length === 0) {
                Utils.showToast(
                    'Welcome to NexusTasks v2.0! Now with Excel export/import and enhanced calendar.',
                    'info',
                    'Welcome 👋'
                );
            }
        }, 1000);
        
        console.log('NexusTasks v2.0 Ready!');
    }
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', App.init);

// Export for debugging (optional)
window.NexusTasks = {
    AppState,
    TaskManager,
    DataManager,
    UIManager,
    Utils
};