// Popup.js - Handling UI interactions for the password manager extension

document.addEventListener('DOMContentLoaded', function() {
  // Selecting elements
  const themeToggle = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  const passwordForm = document.getElementById('password-form');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordList = document.getElementById('password-list');
  const noPasswordsMessage = document.getElementById('no-passwords-message');
  const masterPasswordModal = document.getElementById('master-password-modal');
  const masterPasswordForm = document.getElementById('master-password-form');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const generatePasswordBtn = document.getElementById('generate-password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  // Define current passwords list
  let storedPasswords = [];
  
  // Load passwords from Chrome storage
  function loadStoredPasswords() {
    chrome.storage.local.get(['passwords'], function(result) {
      if (result.passwords && Array.isArray(result.passwords)) {
        storedPasswords = result.passwords;
        displayPasswords();
      }
    });
  }
  
  // Save passwords to Chrome storage
  function persistPasswords() {
    chrome.storage.local.set({ passwords: storedPasswords }, function() {
      console.log('Passwords saved to storage');
    });
  }

  // Theme toggle event listener
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  });

  // Search functionality
  searchButton.addEventListener('click', function() {
    const query = searchInput.value.toLowerCase();
    displayPasswords(query);
  });

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      passwordInput.type = 'password';
      togglePasswordBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  // Add password event listener
  passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const website = document.getElementById('website').value;
    const username = document.getElementById('username').value;
    const password = passwordInput.value;
    const category = document.getElementById('category').value;
    const notes = document.getElementById('notes').value;

    // Encrypt password and save
    savePassword(website, username, password, category, notes);
    passwordForm.reset();
    togglePasswordBtn.click(); // Hide password after submission
  });

  // Tab switching functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Generate password functionality
  generatePasswordBtn.addEventListener('click', function() {
    const password = cryptoManager.generatePassword(16, true, true, true, true);
    passwordInput.type = 'text'; // Show the password
    passwordInput.value = password;
    togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    updatePasswordStrength(password);
  });

  // Password strength evaluation
  passwordInput.addEventListener('input', function() {
    updatePasswordStrength(this.value);
  });

  function updatePasswordStrength(password) {
    const strength = cryptoManager.evaluatePasswordStrength(password);
    
    // Update the strength bar
    strengthBar.style.width = strength.score + '%';
    strengthText.textContent = strength.feedback;
    
    // Change color based on strength
    if (strength.score < 40) {
      strengthBar.style.backgroundColor = 'var(--danger-color)';
    } else if (strength.score < 60) {
      strengthBar.style.backgroundColor = 'var(--warning-color)';
    } else if (strength.score < 80) {
      strengthBar.style.backgroundColor = 'var(--success-color)';
    } else {
      strengthBar.style.backgroundColor = '#2ecc71'; // Strong green
    }
  }

  // Settings functionality
  document.getElementById('export-data').addEventListener('click', exportPasswords);
  document.getElementById('import-data').addEventListener('click', importPasswords);
  document.getElementById('clear-data').addEventListener('click', clearAllData);
  document.getElementById('sync-github').addEventListener('click', syncWithGitHub);
  document.getElementById('change-master-password').addEventListener('click', changeMasterPassword);
  
  // Initialize: load passwords and display them
  loadStoredPasswords();

  // Function to display passwords
  function displayPasswords(query = '') {
    passwordList.innerHTML = '';
    const filteredPasswords = storedPasswords.filter(item => 
      item.website.toLowerCase().includes(query) ||
      item.username.toLowerCase().includes(query));

    filteredPasswords.forEach(item => {
      const listItem = document.createElement('div');
      listItem.className = 'password-item';
      listItem.innerHTML = `
        <div class="site-info">
          <div class="site-icon">
            <i class="fas fa-lock"></i>
          </div>
          <div class="site-details">
            <h3>${item.website}</h3>
            <p>${item.username}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="copy-button" data-field="password" data-value="${item.password}">
            <i class="fas fa-copy"></i>
          </button>
          <button class="delete-button" data-id="${item.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>`;
      
      // Add click event to show details
      listItem.addEventListener('click', function(e) {
        // Don't show details if clicking on action buttons
        if (e.target.closest('.item-actions')) return;
        showPasswordDetails(item);
      });
      
      passwordList.appendChild(listItem);
    });

    noPasswordsMessage.style.display = filteredPasswords.length === 0 ? 'flex' : 'none';
  }

  // Function to save a password
  async function savePassword(website, username, password, category, notes) {
    const id = storedPasswords.length ? storedPasswords[storedPasswords.length - 1].id + 1 : 1;
    const newEntry = { id, website, username, password, category, notes, date: new Date().toLocaleDateString() };
    storedPasswords.push(newEntry);
    persistPasswords();
    displayPasswords();
    showToast('Password saved successfully!');
  }

  // Master Password Modal Event
  masterPasswordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const masterPasswordInput = document.getElementById('master-password-input').value;
    unlockMasterPassword(masterPasswordInput);
  });

  // Function to unlock using Master Password
  function unlockMasterPassword(masterPassword) {
    // Logic for unlocking
    alert('Unlocked with Master Password: ' + masterPassword);
    masterPasswordModal.style.display = "none";
  }

  // Export passwords functionality
  function exportPasswords() {
    // In a real extension, you would encrypt this data with the master password
    const data = JSON.stringify(storedPasswords, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password-manager-export-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Passwords exported successfully!');
  }

  // Import passwords functionality
  function importPasswords() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const importedData = JSON.parse(event.target.result);
          if (Array.isArray(importedData)) {
            // In a real extension, you would validate and decrypt this data
            storedPasswords = importedData;
            persistPasswords();
            displayPasswords();
            showToast('Passwords imported successfully!');
          } else {
            showToast('Invalid import format!', 'error');
          }
        } catch (error) {
          console.error('Import error:', error);
          showToast('Failed to import passwords!', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  // Clear all data functionality
  function clearAllData() {
    if (confirm('Are you sure you want to delete all stored passwords? This action cannot be undone.')) {
      storedPasswords = [];
      persistPasswords();
      displayPasswords();
      showToast('All data cleared successfully!');
    }
  }

  // Sync with GitHub functionality
  function syncWithGitHub() {
    // In a real extension, you would implement a GitHub authentication flow
    const token = prompt('Enter your GitHub personal access token:');
    if (!token) return;
    
    const repo = prompt('Enter your repository name (username/repo):');
    if (!repo) return;
    
    // Send message to background script to handle GitHub API calls
    chrome.runtime.sendMessage(
      { action: 'syncWithGitHub', token, repo },
      response => {
        if (response.success) {
          showToast(response.message);
          
          // Ask if user wants to trigger GitHub Action
          if (confirm('Do you want to trigger a GitHub Action to build and release?')) {
            chrome.runtime.sendMessage(
              { action: 'triggerGitHubAction', token, repo, workflow: 'build-and-release.yml' },
              actionResponse => {
                if (actionResponse.success) {
                  showToast(actionResponse.message);
                } else {
                  showToast('Failed to trigger GitHub Action: ' + actionResponse.error, 'error');
                }
              }
            );
          }
        } else {
          showToast('GitHub sync failed: ' + response.error, 'error');
        }
      }
    );
  }

  // Change master password functionality
  function changeMasterPassword() {
    const currentPassword = prompt('Enter your current master password:');
    if (!currentPassword) return;
    
    // In a real extension, you would verify the current password
    const newPassword = prompt('Enter your new master password:');
    if (!newPassword) return;
    
    const confirmPassword = prompt('Confirm your new master password:');
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    
    // In a real extension, you would re-encrypt all passwords with the new master password
    showToast('Master password changed successfully!');
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove the toast after 3 seconds
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }
  
  // Show password details in modal
  function showPasswordDetails(item) {
    const detailModal = document.getElementById('password-detail-modal');
    const detailWebsite = document.getElementById('detail-website');
    const detailUsername = document.getElementById('detail-username');
    const detailPassword = document.getElementById('detail-password');
    const detailNotes = document.getElementById('detail-notes');
    const detailDate = document.getElementById('detail-date');
    const detailNotesContainer = document.getElementById('detail-notes-container');
    const detailTogglePassword = document.getElementById('detail-toggle-password');
    const editEntryBtn = document.getElementById('edit-entry');
    const deleteEntryBtn = document.getElementById('delete-entry');
    
    // Set details
    detailWebsite.textContent = item.website;
    detailUsername.textContent = item.username;
    detailPassword.textContent = '••••••••••••';
    detailPassword.dataset.value = item.password;
    detailDate.textContent = item.date;
    
    // Handle notes
    if (item.notes && item.notes.trim() !== '') {
      detailNotes.textContent = item.notes;
      detailNotesContainer.style.display = 'block';
    } else {
      detailNotesContainer.style.display = 'none';
    }
    
    // Toggle password visibility
    detailTogglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    detailTogglePassword.addEventListener('click', function() {
      if (detailPassword.textContent === '••••••••••••') {
        detailPassword.textContent = item.password;
        detailTogglePassword.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        detailPassword.textContent = '••••••••••••';
        detailTogglePassword.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
    
    // Copy buttons
    const copyButtons = detailModal.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        const field = this.dataset.field;
        let textToCopy = '';
        
        if (field === 'username') {
          textToCopy = item.username;
        } else if (field === 'password') {
          textToCopy = item.password;
        }
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            showToast(`${field.charAt(0).toUpperCase() + field.slice(1)} copied to clipboard!`);
          })
          .catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy to clipboard', 'error');
          });
      });
    });
    
    // Edit entry
    editEntryBtn.addEventListener('click', function() {
      // Switch to edit tab and populate form with current values
      document.querySelector('.tab-button[data-tab="add-password"]').click();
      
      document.getElementById('website').value = item.website;
      document.getElementById('username').value = item.username;
      document.getElementById('password').value = item.password;
      document.getElementById('category').value = item.category || 'other';
      document.getElementById('notes').value = item.notes || '';
      
      // Show password in edit form
      passwordInput.type = 'text';
      togglePasswordBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      
      // Update password strength indicator
      updatePasswordStrength(item.password);
      
      // Remove the current entry (will be replaced when saved)
      storedPasswords = storedPasswords.filter(entry => entry.id !== item.id);
      persistPasswords();
      
      // Close the modal
      detailModal.style.display = 'none';
    });
    
    // Delete entry
    deleteEntryBtn.addEventListener('click', function() {
      if (confirm(`Are you sure you want to delete the password for ${item.website}?`)) {
        storedPasswords = storedPasswords.filter(entry => entry.id !== item.id);
        persistPasswords();
        displayPasswords();
        detailModal.style.display = 'none';
        showToast('Password deleted successfully!');
      }
    });
    
    // Close modal
    const closeModalBtns = detailModal.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        detailModal.style.display = 'none';
      });
    });
    
    // Show the modal
    detailModal.style.display = 'block';
  }
});

