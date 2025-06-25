/**
 * Background.js - Service worker for Secure Password Manager extension
 * 
 * This file handles:
 * - Background tasks and processes for the extension
 * - Communication with the GitHub API for syncing and automation
 * - Auto-locking functionality for security
 */

// Initialize settings
let extensionSettings = {
  autoLockTime: 5, // minutes
  requireMasterPassword: true,
  lastActivity: Date.now(),
  isLocked: false
};

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Password Manager Extension installed');
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    settings: extensionSettings,
    passwords: [],
    masterPasswordHash: null // Will be set during first use
  });
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkLockStatus') {
    checkLockStatus().then(isLocked => {
      sendResponse({ isLocked });
    });
    return true; // Required for async response
  }
  
  if (message.action === 'unlockWithMasterPassword') {
    validateMasterPassword(message.masterPassword)
      .then(isValid => {
        if (isValid) {
          extensionSettings.isLocked = false;
          extensionSettings.lastActivity = Date.now();
          updateSettings();
        }
        sendResponse({ success: isValid });
      });
    return true;
  }
  
  if (message.action === 'lockExtension') {
    lockExtension();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'updateActivity') {
    extensionSettings.lastActivity = Date.now();
    updateSettings();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'syncWithGitHub') {
    syncWithGitHub(message.token, message.repo)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'triggerGitHubAction') {
    triggerGitHubAction(message.token, message.repo, message.workflow)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});

// Check if extension should be locked based on inactivity
async function checkLockStatus() {
  // If master password is not required, never lock
  if (!extensionSettings.requireMasterPassword) {
    return false;
  }
  
  // If already locked, stay locked
  if (extensionSettings.isLocked) {
    return true;
  }
  
  // Check time since last activity
  const currentTime = Date.now();
  const timeSinceActivity = (currentTime - extensionSettings.lastActivity) / (1000 * 60); // in minutes
  
  if (timeSinceActivity >= extensionSettings.autoLockTime) {
    lockExtension();
    return true;
  }
  
  return false;
}

// Lock the extension
function lockExtension() {
  extensionSettings.isLocked = true;
  updateSettings();
}

// Update settings in storage
function updateSettings() {
  chrome.storage.local.set({ settings: extensionSettings });
}

// Validate the master password
async function validateMasterPassword(password) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['masterPasswordHash'], (result) => {
      if (!result.masterPasswordHash) {
        // First time setup - store the hash
        const passwordHash = hashPassword(password);
        chrome.storage.local.set({ masterPasswordHash: passwordHash });
        resolve(true);
      } else {
        // Validate against stored hash
        const inputHash = hashPassword(password);
        resolve(inputHash === result.masterPasswordHash);
      }
    });
  });
}

// Simple hash function (in a real extension, use a stronger crypto function)
function hashPassword(password) {
  // This is a placeholder - in a real extension, use a proper crypto library
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// GitHub integration functions
async function syncWithGitHub(token, repo) {
  if (!token || !repo) {
    return { success: false, error: 'GitHub token and repository are required' };
  }
  
  try {
    // This would contain actual GitHub API calls in a real extension
    // For now, we'll just return a success message
    return { success: true, message: 'Synced with GitHub repository' };
  } catch (error) {
    console.error('GitHub sync error:', error);
    return { success: false, error: error.message };
  }
}

async function triggerGitHubAction(token, repo, workflow) {
  if (!token || !repo || !workflow) {
    return { success: false, error: 'GitHub token, repository, and workflow name are required' };
  }
  
  try {
    // This would be an actual GitHub Actions API call in a real extension
    // For now, we'll just simulate success
    console.log(`Triggered GitHub Action: ${workflow} in repository ${repo}`);
    return { 
      success: true, 
      message: `GitHub Action "${workflow}" triggered successfully`,
      run_id: Math.floor(Math.random() * 1000000) // Simulate a run ID
    };
  } catch (error) {
    console.error('GitHub Action error:', error);
    return { success: false, error: error.message };
  }
}

// Set up periodic lock check (every minute)
setInterval(checkLockStatus, 60 * 1000);
