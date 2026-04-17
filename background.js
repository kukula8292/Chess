// Background script for handling extension lifecycle
chrome.runtime.onInstalled.addListener(() => {
    console.log('Chess Helper AI installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open popup (this is handled automatically by manifest)
});
