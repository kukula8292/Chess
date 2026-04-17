document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startAnalysis');
    const stopBtn = document.getElementById('stopAnalysis');
    const status = document.getElementById('status');
    const depthSlider = document.getElementById('depthSlider');
    const depthValue = document.getElementById('depthValue');
    const showArrows = document.getElementById('showArrows');
    const showEval = document.getElementById('showEval');

    // Load saved settings
    chrome.storage.sync.get(['depth', 'showArrows', 'showEval', 'isActive'], function(result) {
        depthSlider.value = result.depth || 15;
        depthValue.textContent = result.depth || 15;
        showArrows.checked = result.showArrows !== false;
        showEval.checked = result.showEval !== false;
        updateStatus(result.isActive || false);
    });

    // Depth slider
    depthSlider.addEventListener('input', function() {
        depthValue.textContent = this.value;
        chrome.storage.sync.set({depth: parseInt(this.value)});
    });

    // Checkboxes
    showArrows.addEventListener('change', function() {
        chrome.storage.sync.set({showArrows: this.checked});
    });

    showEval.addEventListener('change', function() {
        chrome.storage.sync.set({showEval: this.checked});
    });

    // Start analysis
    startBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'startAnalysis'});
            chrome.storage.sync.set({isActive: true});
            updateStatus(true);
        });
    });

    // Stop analysis
    stopBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'stopAnalysis'});
            chrome.storage.sync.set({isActive: false});
            updateStatus(false);
        });
    });

    function updateStatus(isActive) {
        if (isActive) {
            status.textContent = 'Analysis Active';
            status.className = 'status active';
        } else {
            status.textContent = 'Analysis Inactive';
            status.className = 'status inactive';
        }
    }
});
