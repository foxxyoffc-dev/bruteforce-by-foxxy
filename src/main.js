// ==================== GLOBAL VARIABLES ====================
let passwordDatabase = [];
let currentTheme = 'dark';
let bruteForceActive = false;
const MAX_COMBINATIONS_LIMIT = 200000000;

// ==================== LOAD DATABASE ====================
async function loadDatabase() {
    try {
        const response = await fetch('public/api/passwords.json');
        passwordDatabase = await response.json();
        document.getElementById('totalPasswords').textContent = passwordDatabase.length.toLocaleString();
        document.getElementById('worstPassword').textContent = passwordDatabase[0] || '123456';
        
        const avgTime = localStorage.getItem('avgCrackTime');
        if (avgTime) {
            document.getElementById('avgTime').textContent = `${parseFloat(avgTime).toFixed(3)} detik`;
        }
    } catch (error) {
        console.error('Error loading database:', error);
        document.getElementById('totalPasswords').textContent = 'Error';
    }
}

// ==================== PASSWORD STRENGTH ====================
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

// ==================== SLEEP FUNCTION ====================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        themeBtn.addEventListener('click', () => {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            currentTheme = newTheme;
            themeBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }
}

// ==================== PASSWORD CRACKER ====================
async function crackPassword() {
    const password = document.getElementById('passwordInput').value.trim();
    const mode = document.querySelector('input[name="crackMode"]:checked').value;
    
    if (!password) {
        alert('Masukkan password dulu!');
        return;
    }
    
    const crackBtn = document.getElementById('crackBtn');
    const btnText = document.querySelector('#crackBtn .btn-text');
    const btnLoading = document.querySelector('#crackBtn .btn-loading');
    const resultSection = document.getElementById('resultSection');
    
    crackBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    if (resultSection) resultSection.style.display = 'none';
    
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
            if (i % 1000 === 0 && btnLoading) {
                btnLoading.textContent = `⏳ ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    } else if (mode === 'hash') {
        const md5Hash = CryptoJS.MD5(password).toString();
        for (let i = 0; i < passwordDatabase.length; i++) {
            attempts++;
            const testMd5 = CryptoJS.MD5(passwordDatabase[i]).toString();
            if (testMd5 === md5Hash) {
                found = true;
                foundPassword = passwordDatabase[i];
                break;
            }
            if (i % 1000 === 0 && btnLoading) {
                btnLoading.textContent = `⏳ ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    }
    
    const endTime = performance.now();
    const crackTime = (endTime - startTime) / 1000;
    const strength = checkStrength(password);
    
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const crackTimeEl = document.getElementById('crackTime');
    const attemptsEl = document.getElementById('attempts');
    const strengthEl = document.getElementById('strength');
    const suggestionsEl = document.getElementById('suggestions');
    
    if (resultIcon) resultIcon.textContent = found ? '⚠️' : '✅';
    if (resultTitle) {
        resultTitle.innerHTML = found ? `PASSWORD DITEMUKAN! "${foundPassword}"` : 'PASSWORD AMAN! Tidak ditemukan!';
        resultTitle.style.color = found ? '#ff4444' : '#00ff00';
    }
    if (crackTimeEl) crackTimeEl.textContent = `${crackTime.toFixed(3)} detik`;
    if (attemptsEl) attemptsEl.textContent = attempts.toLocaleString();
    if (strengthEl) strengthEl.innerHTML = found ? `🔴 ${strength.text}` : `🟢 ${strength.text}`;
    if (suggestionsEl) {
        suggestionsEl.innerHTML = found ? 'Ganti password yang lebih unik dan panjang!' : 'Password cukup kuat, tetap waspada terhadap phishing!';
    }
    
    if (resultSection) resultSection.style.display = 'block';
    
    crackBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
}

// ==================== PASSWORD GENERATOR ====================
function generatePassword() {
    const length = parseInt(document.getElementById('passLength')?.value || 16);
    const useUpper = document.getElementById('genUpper')?.checked || true;
    const useLower = document.getElementById('genLower')?.checked || true;
    const useNumbers = document.getElementById('genNumbers')?.checked || true;
    const useSymbols = document.getElementById('genSymbols')?.checked || true;
    
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()';
    
    if (!chars) {
        alert('Pilih minimal satu karakter!');
        return;
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const generatedField = document.getElementById('generatedPassword');
    if (generatedField) generatedField.value = password;
}

function copyToClipboard() {
    const pwdField = document.getElementById('generatedPassword');
    if (pwdField) {
        pwdField.select();
        document.execCommand('copy');
        alert('Password copied!');
    }
}

function exportPasswords() {
    const count = 100;
    const length = 16;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const passwords = [];
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
    const hashInput = document.getElementById('hashInput')?.value.trim();
    const hashType = document.getElementById('hashType')?.value || 'md5';
    const resultDiv = document.getElementById('hashResult');
    
    if (!hashInput) {
        alert('Masukkan hash!');
        return;
    }
    
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="result-card">⏳ Mencari hash di database...</div>';
    }
    
    for (let i = 0; i < passwordDatabase.length; i++) {
        let computedHash;
        if (hashType === 'md5') {
            computedHash = CryptoJS.MD5(passwordDatabase[i]).toString();
        } else {
            computedHash = CryptoJS.SHA1(passwordDatabase[i]).toString();
        }
        
        if (computedHash === hashInput.toLowerCase()) {
            if (resultDiv) {
                resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ff4444;">
                    <strong>✅ HASH DITEMUKAN!</strong><br>
                    Password: <span style="color: #00ff00;">${passwordDatabase[i]}</span>
                </div>`;
            }
            return;
        }
        
        if (i % 1000 === 0 && resultDiv) {
            resultDiv.innerHTML = `<div class="result-card">⏳ ${Math.round((i/passwordDatabase.length)*100)}%</div>`;
            await sleep(0);
        }
    }
    
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="result-card">❌ Hash tidak ditemukan di database!</div>';
    }
}

// ==================== BRUTE FORCE ====================
function generateKeywordDatabaseCombinations(keywords) {
    const combinations = new Set();
    const symbols = ['!', '@', '#', '$', '%', '&', '*', '?'];
    const useNumbers = document.getElementById('useNumbersKeyword')?.checked || true;
    const useSymbols = document.getElementById('useSymbolsKeyword')?.checked || true;
    const useCaseVar = document.getElementById('useCaseVariation')?.checked || true;
    const useDatabase = document.getElementById('useDatabaseCombo')?.checked || true;
    
    const activeKeywords = keywords.filter(k => k && k.trim() !== '');
    if (activeKeywords.length === 0) return { combinations: [], estimatedTotal: 0 };
    
    let estimatedTotal = 0;
    
    for (let kw of activeKeywords) {
        let kwVariations = [kw.toLowerCase(), kw.toUpperCase()];
        if (useCaseVar) {
            kwVariations.push(kw.charAt(0).toUpperCase() + kw.slice(1).toLowerCase());
        }
        
        for (let kwVar of kwVariations) {
            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
            
            combinations.add(kwVar);
            estimatedTotal++;
            
            if (useNumbers) {
                for (let i = 1; i <= 99; i++) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + i);
                    combinations.add(i + kwVar);
                    estimatedTotal += 2;
                }
            }
            
            if (useSymbols) {
                for (let sym of symbols.slice(0, 4)) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + sym);
                    combinations.add(sym + kwVar);
                    estimatedTotal += 2;
                }
            }
            
            if (useDatabase && passwordDatabase.length > 0) {
                for (let dbPass of passwordDatabase.slice(0, 2000)) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + dbPass);
                    combinations.add(dbPass + kwVar);
                    estimatedTotal += 2;
                }
            }
        }
    }
    
    return { 
        combinations: Array.from(combinations), 
        estimatedTotal,
        exceeded: estimatedTotal >= MAX_COMBINATIONS_LIMIT 
    };
}

function* generateCombinations(length, prefix = '', chars = 'abcdefghijklmnopqrstuvwxyz0123456789') {
    if (length === 0) { yield prefix; return; }
    for (let i = 0; i < chars.length; i++) {
        if (!bruteForceActive) return;
        yield* generateCombinations(length - 1, prefix + chars[i], chars);
    }
}

async function simulateBruteForce() {
    const targetPassword = document.getElementById('brutePassword')?.value || '';
    const maxLength = document.getElementById('bruteMaxLength')?.value || 'keyword';
    const resultDiv = document.getElementById('bruteResult');
    const progressDiv = document.getElementById('bruteProgress');
    const progressFill = document.querySelector('#bruteProgress .progress-fill');
    const keywordProgressDiv = document.getElementById('keywordProgress');
    const bruteBtn = document.getElementById('bruteBtn');
    const stopBtn = document.getElementById('stopBruteBtn');
    
    const keyword1 = document.getElementById('keyword1')?.value || '';
    const keyword2 = document.getElementById('keyword2')?.value || '';
    const keyword3 = document.getElementById('keyword3')?.value || '';
    const keywords = [keyword1, keyword2, keyword3];
    const isKeywordMode = maxLength === 'keyword';
    
    if (!targetPassword) {
        alert('Masukkan password target!');
        return;
    }
    
    if (bruteForceActive) {
        bruteForceActive = false;
        await sleep(500);
    }
    
    if (isKeywordMode) {
        const activeKeywords = keywords.filter(k => k.trim() !== '');
        if (activeKeywords.length === 0) {
            alert('Isi minimal 1 kata kunci untuk mode Keyword + Database Combo!');
            return;
        }
        
        const { estimatedTotal, exceeded } = generateKeywordDatabaseCombinations(keywords);
        
        if (exceeded || estimatedTotal > MAX_COMBINATIONS_LIMIT) {
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00; background: rgba(0,255,0,0.1);">
                    <strong>✅✅✅ PASSWORD ANDA 100% AMAN! ✅✅✅</strong><br><br>
                    🔒 Total kombinasi: <strong>${estimatedTotal.toLocaleString()}</strong><br>
                    📊 Melebihi batas aman: <strong>${MAX_COMBINATIONS_LIMIT.toLocaleString()} kombinasi</strong>
                </div>`;
            }
            return;
        }
    }
    
    bruteForceActive = true;
    if (bruteBtn) bruteBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="result-card">⏳ Memulai simulasi...</div>';
    }
    
    const startTime = performance.now();
    let attempts = 0;
    let found = false;
    let foundPassword = '';
    
    if (isKeywordMode) {
        if (progressDiv) progressDiv.style.display = 'block';
        if (keywordProgressDiv) keywordProgressDiv.style.display = 'block';
        
        const { combinations } = generateKeywordDatabaseCombinations(keywords);
        const totalCombos = combinations.length;
        
        if (keywordProgressDiv) {
            keywordProgressDiv.innerHTML = `🔑 Total kombinasi: ${totalCombos.toLocaleString()}`;
        }
        
        for (let i = 0; i < totalCombos && bruteForceActive; i++) {
            attempts++;
            if (combinations[i] === targetPassword) {
                found = true;
                foundPassword = combinations[i];
                break;
            }
            if (i % 100 === 0 && progressFill) {
                const percent = (i / totalCombos) * 100;
                progressFill.style.width = `${percent}%`;
                if (keywordProgressDiv) {
                    keywordProgressDiv.innerHTML = `🔑 ${percent.toFixed(1)}% (${i.toLocaleString()}/${totalCombos.toLocaleString()})<br>🔍 ${combinations[i]?.substring(0, 40) || ''}`;
                }
                await sleep(0);
            }
        }
    } else {
        const maxLen = parseInt(maxLength);
        if (targetPassword.length > maxLen) {
            if (resultDiv) {
                resultDiv.innerHTML = `<div class="result-card">⚠️ Password lebih panjang dari ${maxLen} karakter!</div>`;
            }
            bruteForceActive = false;
            if (bruteBtn) bruteBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            return;
        }
        
        if (progressDiv) progressDiv.style.display = 'block';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        for (let len = 1; len <= maxLen && bruteForceActive; len++) {
            const totalCombos = Math.pow(chars.length, len);
            let comboCount = 0;
            
            for (const combo of generateCombinations(len, '', chars)) {
                if (!bruteForceActive) break;
                attempts++;
                comboCount++;
                if (comboCount % 5000 === 0 && progressFill && resultDiv) {
                    const percent = (comboCount / totalCombos) * 100;
                    progressFill.style.width = `${percent}%`;
                    resultDiv.innerHTML = `<div class="result-card">⏳ Panjang ${len}... ${Math.round(percent)}%<br>📊 ${attempts.toLocaleString()} percobaan</div>`;
                    await sleep(0);
                }
                if (combo === targetPassword) {
                    found = true;
                    foundPassword = combo;
                    bruteForceActive = false;
                    break;
                }
            }
            if (found || !bruteForceActive) break;
        }
    }
    
    const endTime = performance.now();
    const timeTaken = (endTime - startTime) / 1000;
    
    if (resultDiv) {
        if (!bruteForceActive && !found) {
            resultDiv.innerHTML = `<div class="result-card">🛑 DIHENTIKAN! ${attempts.toLocaleString()} percobaan, ${timeTaken.toFixed(2)} detik</div>`;
        } else if (found) {
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ff4444;">
                <strong>⚠️ PASSWORD BERHASIL DI-CRACK!</strong><br>
                Password: <span style="color: #00ff00;">${foundPassword}</span><br>
                Waktu: ${timeTaken.toFixed(2)} detik<br>
                Percobaan: ${attempts.toLocaleString()}
            </div>`;
        } else {
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00;">
                <strong>✅ Password aman!</strong><br>
                Tidak ditemukan. Waktu: ${timeTaken.toFixed(2)} detik
            </div>`;
        }
    }
    
    bruteForceActive = false;
    if (bruteBtn) bruteBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    setTimeout(() => {
        if (progressDiv) progressDiv.style.display = 'none';
        if (keywordProgressDiv) keywordProgressDiv.style.display = 'none';
    }, 1000);
}

function stopBruteForce() {
    if (bruteForceActive) {
        bruteForceActive = false;
        const resultDiv = document.getElementById('bruteResult');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="result-card">🛑 Menghentikan simulasi...</div>';
        }
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    setupTabs();
    setupTheme();
    
    const crackBtn = document.getElementById('crackBtn');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyPasswordBtn');
    const exportBtn = document.getElementById('exportPasswordsBtn');
    const hashBtn = document.getElementById('hashCrackBtn');
    const bruteBtn = document.getElementById('bruteBtn');
    const stopBruteBtn = document.getElementById('stopBruteBtn');
    const toggleBtn = document.getElementById('toggleVisibility');
    const passwordInput = document.getElementById('passwordInput');
    
    if (crackBtn) crackBtn.addEventListener('click', crackPassword);
    if (generateBtn) generateBtn.addEventListener('click', generatePassword);
    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
    if (exportBtn) exportBtn.addEventListener('click', exportPasswords);
    if (hashBtn) hashBtn.addEventListener('click', crackHash);
    if (bruteBtn) bruteBtn.addEventListener('click', simulateBruteForce);
    if (stopBruteBtn) stopBruteBtn.addEventListener('click', stopBruteForce);
    
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const strength = checkStrength(e.target.value);
            let indicator = document.querySelector('.strength-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'strength-indicator';
                indicator.style.cssText = 'margin-top: 8px; font-size: 11px;';
                e.target.parentNode.appendChild(indicator);
            }
            indicator.innerHTML = `Kekuatan: <span style="color: ${strength.color};">${strength.text}</span>`;
        });
    }
});
