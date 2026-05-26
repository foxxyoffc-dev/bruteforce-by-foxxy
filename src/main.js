// ==================== GLOBAL VARIABLES ====================
let passwordDatabase = [];
let currentTheme = 'dark';

// ==================== LOAD DATABASE ====================
async function loadDatabase() {
    try {
        const response = await fetch('public/api/passwords.json');
        passwordDatabase = await response.json();
        document.getElementById('totalPasswords').textContent = passwordDatabase.length.toLocaleString();
        document.getElementById('worstPassword').textContent = passwordDatabase[0] || '123456';
        
        const avgTime = localStorage.getItem('avgCrackTime');
        if (avgTime) document.getElementById('avgTime').textContent = `${parseFloat(avgTime).toFixed(3)} detik`;
    } catch (error) {
        console.error('Error loading database:', error);
    }
}

// ==================== PASSWORD STRENGTH METER ====================
function checkStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { text: 'Lemah', color: '#ff4444' };
    if (strength <= 4) return { text: 'Sedang', color: '#ffa500' };
    return { text: 'Kuat', color: '#00ff00' };
}

// ==================== TAB NAVIGATION ====================
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

// ==================== DARK MODE ====================
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    currentTheme = savedTheme;
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    themeBtn.addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        currentTheme = newTheme;
        themeBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    });
}

// ==================== PASSWORD CRACKER (Dictionary + Hash) ====================
async function crackPassword() {
    const password = document.getElementById('passwordInput').value.trim();
    const mode = document.querySelector('input[name="crackMode"]:checked').value;
    
    if (!password) { alert('Masukkan password dulu!'); return; }
    
    const crackBtn = document.getElementById('crackBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const resultSection = document.getElementById('resultSection');
    
    crackBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    resultSection.style.display = 'none';
    
    const startTime = performance.now();
    let found = false;
    let attempts = 0;
    let foundPassword = null;
    
    if (mode === 'dictionary') {
        for (let i = 0; i < passwordDatabase.length; i++) {
            attempts++;
            if (passwordDatabase[i].toLowerCase() === password.toLowerCase()) {
                found = true;
                foundPassword = passwordDatabase[i];
                break;
            }
            if (i % 1000 === 0) {
                btnLoading.textContent = `⏳ MENCARI... ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    } else if (mode === 'hash') {
        const md5Hash = CryptoJS.MD5(password).toString();
        const sha1Hash = CryptoJS.SHA1(password).toString();
        for (let i = 0; i < passwordDatabase.length; i++) {
            attempts++;
            const testMd5 = CryptoJS.MD5(passwordDatabase[i]).toString();
            const testSha1 = CryptoJS.SHA1(passwordDatabase[i]).toString();
            if (testMd5 === md5Hash || testSha1 === sha1Hash) {
                found = true;
                foundPassword = passwordDatabase[i];
                break;
            }
            if (i % 1000 === 0) {
                btnLoading.textContent = `⏳ HASH MATCHING... ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    }
    
    const endTime = performance.now();
    const crackTime = (endTime - startTime) / 1000;
    
    displayResult(found, foundPassword, attempts, crackTime, password);
    
    crackBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
}

function displayResult(found, foundPassword, attempts, crackTime, originalPassword) {
    const strength = checkStrength(originalPassword);
    document.getElementById('resultIcon').textContent = found ? '⚠️' : '✅';
    document.getElementById('resultTitle').innerHTML = found ? `PASSWORD DITEMUKAN! "${foundPassword}" ada di database!` : 'PASSWORD AMAN! Tidak ditemukan!';
    document.getElementById('resultTitle').style.color = found ? '#ff4444' : '#00ff00';
    document.getElementById('crackTime').textContent = `${crackTime.toFixed(3)} detik`;
    document.getElementById('attempts').textContent = attempts.toLocaleString();
    document.getElementById('strength').innerHTML = found ? `🔴 <strong>${strength.text.toUpperCase()}</strong> - Password ini umum!` : `🟢 <strong>${strength.text.toUpperCase()}</strong> - Password tidak ada di database!`;
    
    const suggestions = document.getElementById('suggestions');
    if (found) {
        suggestions.innerHTML = `<strong>💡 Saran:</strong><br>• Password "${foundPassword}" terlalu umum<br>• Gunakan 12+ karakter dengan huruf besar, angka, simbol<br>• Contoh: "KucingLompat123!@#"`;
    } else {
        suggestions.innerHTML = `<strong>🎉 Selamat!</strong><br>• Password cukup kuat<br>• Aktifkan 2FA untuk keamanan ekstra`;
    }
    
    document.getElementById('resultSection').style.display = 'block';
    
    const currentAvg = localStorage.getItem('avgCrackTime');
    if (currentAvg) localStorage.setItem('avgCrackTime', (parseFloat(currentAvg) + crackTime) / 2);
    else localStorage.setItem('avgCrackTime', crackTime);
}

// ==================== PASSWORD GENERATOR ====================
function generatePassword() {
    const length = parseInt(document.getElementById('passLength').value);
    const useUpper = document.getElementById('useUpper').checked;
    const useLower = document.getElementById('useLower').checked;
    const useNumbers = document.getElementById('useNumbers').checked;
    const useSymbols = document.getElementById('useSymbols').checked;
    
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (!chars) { alert('Pilih minimal satu karakter!'); return; }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    document.getElementById('generatedPassword').value = password;
}

function exportPasswords() {
    const count = 100;
    const length = 16;
    const passwords = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    
    for (let i = 0; i < count; i++) {
        let pwd = '';
        for (let j = 0; j < length; j++) {
            pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        passwords.push(pwd);
    }
    
    const csv = passwords.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== HASH CRACKER ====================
async function crackHash() {
    const hashInput = document.getElementById('hashInput').value.trim();
    const hashType = document.getElementById('hashType').value;
    const resultDiv = document.getElementById('hashResult');
    
    if (!hashInput) { alert('Masukkan hash!'); return; }
    
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="result-card">⏳ Mencocokkan hash dengan database...</div>';
    
    for (let i = 0; i < passwordDatabase.length; i++) {
        let computedHash;
        if (hashType === 'md5') computedHash = CryptoJS.MD5(passwordDatabase[i]).toString();
        else computedHash = CryptoJS.SHA1(passwordDatabase[i]).toString();
        
        if (computedHash === hashInput.toLowerCase()) {
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ff4444;">
                <strong>✅ HASH DICRACK!</strong><br>
                Password: <span style="color: #00ff00;">${passwordDatabase[i]}</span><br>
                Hash (${hashType.toUpperCase()}): ${computedHash}
            </div>`;
            return;
        }
        
        if (i % 1000 === 0) {
            resultDiv.innerHTML = `<div class="result-card">⏳ Mencoba... ${Math.round((i/passwordDatabase.length)*100)}%</div>`;
            await sleep(0);
        }
    }
    
    resultDiv.innerHTML = '<div class="result-card" style="border-left: 3px solid #ffa500;">❌ Hash tidak ditemukan di database!</div>';
}

// ==================== BRUTE FORCE SIMULATOR ====================
async function simulateBruteForce() {
    const targetPassword = document.getElementById('brutePassword').value;
    const maxLength = parseInt(document.getElementById('bruteMaxLength').value);
    const resultDiv = document.getElementById('bruteResult');
    const progressDiv = document.getElementById('bruteProgress');
    const progressFill = document.querySelector('#bruteProgress .progress-fill');
    
    if (!targetPassword) { alert('Masukkan password target!'); return; }
    if (targetPassword.length > maxLength) {
        alert(`Password lebih panjang dari ${maxLength} karakter! Perpanjang max length.`);
        return;
    }
    
    resultDiv.style.display = 'block';
    progressDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="result-card">⏳ Memulai brute force simulation...</div>';
    
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const startTime = performance.now();
    let attempts = 0;
    let found = false;
    
    function* generateCombinations(length, prefix = '') {
        if (length === 0) { yield prefix; return; }
        for (let i = 0; i < chars.length; i++) {
            yield* generateCombinations(length - 1, prefix + chars[i]);
        }
    }
    
    for (let len = 1; len <= maxLength; len++) {
        const totalCombos = Math.pow(chars.length, len);
        let comboCount = 0;
        
        for (const combo of generateCombinations(len)) {
            attempts++;
            comboCount++;
            
            if (comboCount % 10000 === 0) {
                const percent = (comboCount / totalCombos) * 100;
                progressFill.style.width = `${percent}%`;
                resultDiv.innerHTML = `<div class="result-card">⏳ Mencoba panjang ${len}... ${Math.round(percent)}% (${attempts.toLocaleString()} percobaan)</div>`;
                await sleep(0);
            }
            
            if (combo === targetPassword) {
                found = true;
                break;
            }
        }
        if (found) break;
    }
    
    const endTime = performance.now();
    const timeTaken = (endTime - startTime) / 1000;
    
    if (found) {
        resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ff4444;">
            <strong>⚠️ PASSWORD BERHASIL DI BRUTE FORCE!</strong><br>
            Password: ${targetPassword}<br>
            Waktu: ${timeTaken.toFixed(2)} detik<br>
            Percobaan: ${attempts.toLocaleString()}<br>
            <span style="color: #ffa500;">💡 Rekomendasi: Gunakan password minimal 8 karakter dengan simbol!</span>
        </div>`;
    } else {
        resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00;">
            <strong>✅ Password aman dari brute force (dalam batasan ini)!</strong><br>
            Tidak berhasil dicrack dalam ${maxLength} karakter.<br>
            Waktu simulasi: ${timeTaken.toFixed(2)} detik
        </div>`;
    }
    
    setTimeout(() => { progressDiv.style.display = 'none'; }, 1000);
}

// ==================== UTILITIES ====================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function copyToClipboard() {
    const pwdField = document.getElementById('generatedPassword');
    pwdField.select();
    document.execCommand('copy');
    alert('Password copied!');
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    setupTabs();
    setupTheme();
    
    document.getElementById('crackBtn').addEventListener('click', crackPassword);
    document.getElementById('generateBtn').addEventListener('click', generatePassword);
    document.getElementById('copyPasswordBtn').addEventListener('click', copyToClipboard);
    document.getElementById('exportPasswordsBtn').addEventListener('click', exportPasswords);
    document.getElementById('hashCrackBtn').addEventListener('click', crackHash);
    document.getElementById('bruteBtn').addEventListener('click', simulateBruteForce);
    document.getElementById('toggleVisibility').addEventListener('click', () => {
        const pwdInput = document.getElementById('passwordInput');
        const type = pwdInput.type === 'password' ? 'text' : 'password';
        pwdInput.type = type;
    });
    
    // Live strength meter
    document.getElementById('passwordInput').addEventListener('input', (e) => {
        const strength = checkStrength(e.target.value);
        let indicator = document.querySelector('.strength-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'strength-indicator';
            indicator.style.cssText = 'margin-top: 10px; font-size: 12px;';
            e.target.parentNode.appendChild(indicator);
        }
        indicator.innerHTML = `Kekuatan Password: <span style="color: ${strength.color};">${strength.text}</span>`;
    });
});
