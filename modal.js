/**
 * Weather PWA - Modal Dialog System
 * Replaces alert(), confirm(), and prompt() with accessible modals
 */

/**
 * Create and show a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.type - Modal type ('alert', 'confirm', 'prompt')
 * @param {Function} options.onConfirm - Callback for confirm action
 * @param {Function} options.onCancel - Callback for cancel action
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 */
function showModal(options = {}) {
    const {
        title = 'Notification',
        message = '',
        type = 'alert',
        onConfirm = null,
        onCancel = null,
        confirmText = 'OK',
        cancelText = 'Cancel',
        inputPlaceholder = ''
    } = options;

    // Remove existing modal if present
    const existingModal = document.getElementById('app-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'app-modal';
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal-container';

    // Create modal header
    const header = document.createElement('div');
    header.className = 'modal-header';
    const titleElement = document.createElement('h3');
    titleElement.id = 'modal-title';
    titleElement.textContent = title;
    header.appendChild(titleElement);

    // Create modal body
    const body = document.createElement('div');
    body.className = 'modal-body';
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    body.appendChild(messageElement);

    // Add input for prompt type
    let inputElement = null;
    if (type === 'prompt') {
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.className = 'modal-input';
        inputElement.placeholder = inputPlaceholder;
        inputElement.setAttribute('aria-label', 'Input value');
        body.appendChild(inputElement);
    }

    // Create modal footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    // Create confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'modal-btn modal-btn-primary';
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', () => {
        const value = inputElement ? inputElement.value : null;
        closeModal();
        if (onConfirm) {
            onConfirm(value);
        }
    });

    // Create cancel button (for confirm/prompt types)
    let cancelBtn = null;
    if (type === 'confirm' || type === 'prompt') {
        cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-secondary';
        cancelBtn.textContent = cancelText;
        cancelBtn.addEventListener('click', () => {
            closeModal();
            if (onCancel) {
                onCancel();
            }
        });
        footer.appendChild(cancelBtn);
    }

    footer.appendChild(confirmBtn);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Add to DOM
    document.body.appendChild(overlay);

    // Focus management
    if (inputElement) {
        setTimeout(() => inputElement.focus(), 100);
    } else {
        setTimeout(() => confirmBtn.focus(), 100);
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
            if (onCancel) {
                onCancel();
            }
        }
    });

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            if (onCancel) {
                onCancel();
            }
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    function closeModal() {
        overlay.remove();
        document.removeEventListener('keydown', escapeHandler);
    }

    // Store close function for external access
    overlay.closeModal = closeModal;
}

/**
 * Show alert modal (replaces alert())
 * @param {string} message - Alert message
 * @param {string} title - Alert title
 * @returns {Promise} - Promise that resolves when alert is closed
 */
function alertModal(message, title = 'Alert') {
    return new Promise((resolve) => {
        showModal({
            title,
            message,
            type: 'alert',
            confirmText: 'OK',
            onConfirm: () => resolve()
        });
    });
}

/**
 * Show confirm modal (replaces confirm())
 * @param {string} message - Confirm message
 * @param {string} title - Confirm title
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed
 */
function confirmModal(message, title = 'Confirm') {
    return new Promise((resolve) => {
        showModal({
            title,
            message,
            type: 'confirm',
            confirmText: 'OK',
            cancelText: 'Cancel',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
}

/**
 * Show prompt modal (replaces prompt())
 * @param {string} message - Prompt message
 * @param {string} title - Prompt title
 * @param {string} defaultValue - Default input value
 * @returns {Promise<string|null>} - Promise that resolves to input value or null
 */
function promptModal(message, title = 'Prompt', defaultValue = '') {
    return new Promise((resolve) => {
        showModal({
            title,
            message,
            type: 'prompt',
            confirmText: 'OK',
            cancelText: 'Cancel',
            inputPlaceholder: defaultValue,
            onConfirm: (value) => resolve(value || defaultValue),
            onCancel: () => resolve(null)
        });
    });
}

// Make functions available globally (replace native functions)
window.alertModal = alertModal;
window.confirmModal = confirmModal;
window.promptModal = promptModal;
window.showModal = showModal;

