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
        if (avgTime) document.getElementById('avgTime').textContent = `${parseFloat(avgTime).toFixed(3)} detik`;
    } catch (error) {
        console.error('Error:', error);
    }
}

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

// ==================== KEYWORD + DATABASE COMBO ====================
function generateKeywordDatabaseCombinations(keywords) {
    const combinations = new Set();
    const symbols = ['!', '@', '#', '$', '%', '&', '*', '?'];
    const numbers = Array.from({length: 1000}, (_, i) => i.toString());
    const useNumbers = document.getElementById('useNumbersKeyword').checked;
    const useSymbols = document.getElementById('useSymbolsKeyword').checked;
    const useCaseVar = document.getElementById('useCaseVariation').checked;
    const useDatabase = document.getElementById('useDatabaseCombo').checked;
    
    const activeKeywords = keywords.filter(k => k.trim() !== '');
    if (activeKeywords.length === 0) return { combinations: [], estimatedTotal: 0 };
    
    let estimatedTotal = 0;
    let shouldStop = false;
    
    for (let kw of activeKeywords) {
        if (shouldStop) break;
        
        let kwVariations = [kw.toLowerCase(), kw.toUpperCase()];
        if (useCaseVar) {
            kwVariations.push(kw.charAt(0).toUpperCase() + kw.slice(1).toLowerCase());
        }
        
        for (let kwVar of kwVariations) {
            if (shouldStop) break;
            
            // Keyword saja
            combinations.add(kwVar);
            estimatedTotal++;
            
            // Keyword + Angka (0-99)
            if (useNumbers) {
                for (let i = 0; i <= 99; i++) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) {
                        shouldStop = true;
                        break;
                    }
                    combinations.add(kwVar + i);
                    combinations.add(i + kwVar);
                    estimatedTotal += 2;
                }
                // Angka 100-999 (lebih sedikit)
                for (let i = 100; i <= 999; i += 50) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) {
                        shouldStop = true;
                        break;
                    }
                    combinations.add(kwVar + i);
                    combinations.add(i + kwVar);
                    estimatedTotal += 2;
                }
            }
            
            // Keyword + Simbol
            if (useSymbols) {
                for (let sym of symbols.slice(0, 4)) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) {
                        shouldStop = true;
                        break;
                    }
                    combinations.add(kwVar + sym);
                    combinations.add(sym + kwVar);
                    estimatedTotal += 2;
                }
            }
            
            // ============ KEYWORD + DATABASE PASSWORD (TANPA BATAS 500!) ============
            if (useDatabase && passwordDatabase.length > 0) {
                for (let dbPass of passwordDatabase) {  // <-- SEKARANG PAKE SEMUA DATABASE
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) {
                        shouldStop = true;
                        break;
                    }
                    
                    // Keyword + Database
                    combinations.add(kwVar + dbPass);
                    combinations.add(dbPass + kwVar);
                    combinations.add(kwVar + '_' + dbPass);
                    combinations.add(dbPass + '_' + kwVar);
                    estimatedTotal += 4;
                    
                    // Keyword + Database + Angka (dikurangi biar cepet)
                    if (useNumbers && estimatedTotal < MAX_COMBINATIONS_LIMIT) {
                        for (let i of [1, 12, 123]) {
                            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                            combinations.add(kwVar + dbPass + i);
                            combinations.add(dbPass + kwVar + i);
                            combinations.add(kwVar + i + dbPass);
                            estimatedTotal += 3;
                        }
                    }
                    
                    // Keyword + Database + Simbol
                    if (useSymbols && estimatedTotal < MAX_COMBINATIONS_LIMIT) {
                        for (let sym of symbols.slice(0, 2)) {
                            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                            combinations.add(kwVar + dbPass + sym);
                            combinations.add(dbPass + kwVar + sym);
                            estimatedTotal += 2;
                        }
                    }
                    
                    // Biar gak terlalu lama, kasih delay kecil
                    await sleep(0);
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
    
    return { 
        combinations: Array.from(combinations), 
        estimatedTotal,
        exceeded: estimatedTotal >= MAX_COMBINATIONS_LIMIT 
    };
}

async function simulateBruteForce() {
    const targetPassword = document.getElementById('brutePassword').value;
    const maxLength = document.getElementById('bruteMaxLength').value;
    const resultDiv = document.getElementById('bruteResult');
    const progressDiv = document.getElementById('bruteProgress');
    const progressFill = document.querySelector('#bruteProgress .progress-fill');
    const keywordProgressDiv = document.getElementById('keywordProgress');
    const bruteBtn = document.getElementById('bruteBtn');
    const stopBtn = document.getElementById('stopBruteBtn');
    
    const keyword1 = document.getElementById('keyword1').value;
    const keyword2 = document.getElementById('keyword2').value;
    const keyword3 = document.getElementById('keyword3').value;
    const keywords = [keyword1, keyword2, keyword3];
    const isKeywordMode = maxLength === 'keyword';
    
    if (!targetPassword) { alert('Masukkan password target!'); return; }
    
    if (bruteForceActive) {
        bruteForceActive = false;
        await sleep(500);
    }
    
    // CEK LIMIT UNTUK MODE KEYWORD + DATABASE
    if (isKeywordMode) {
        const activeKeywords = keywords.filter(k => k.trim() !== '');
        if (activeKeywords.length === 0) {
            alert('Isi minimal 1 kata kunci untuk mode Keyword + Database Combo!');
            return;
        }
        
        const { estimatedTotal, exceeded } = generateKeywordDatabaseCombinations(keywords);
        
        if (exceeded || estimatedTotal > MAX_COMBINATIONS_LIMIT) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00; background: rgba(0,255,0,0.1);">
                <strong>✅✅✅ PASSWORD ANDA 100% AMAN! ✅✅✅</strong><br><br>
                🔒 Total kombinasi: <strong>${estimatedTotal.toLocaleString()}</strong><br>
                📊 Melebihi batas: <strong>${MAX_COMBINATIONS_LIMIT.toLocaleString()}</strong><br><br>
                🛡️ Password Anda tidak mungkin dipecahkan dengan metode ini!
            </div>`;
            return;
        }
    }
    
    bruteForceActive = true;
    bruteBtn.disabled = true;
    stopBtn.disabled = false;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="result-card">⏳ Memulai simulasi...</div>';
    
    const startTime = performance.now();
    let attempts = 0;
    let found = false;
    let foundPassword = '';
    
    if (isKeywordMode) {
        progressDiv.style.display = 'block';
        keywordProgressDiv.style.display = 'block';
        
        const { combinations } = generateKeywordDatabaseCombinations(keywords);
        const totalCombos = combinations.length;
        
        keywordProgressDiv.innerHTML = `🔑 Total kombinasi: ${totalCombos.toLocaleString()}`;
        
        for (let i = 0; i < totalCombos && bruteForceActive; i++) {
            attempts++;
            if (combinations[i] === targetPassword) {
                found = true;
                foundPassword = combinations[i];
                break;
            }
            if (i % 100 === 0) {
                const percent = (i / totalCombos) * 100;
                progressFill.style.width = `${percent}%`;
                keywordProgressDiv.innerHTML = `🔑 ${percent.toFixed(1)}% (${i.toLocaleString()}/${totalCombos.toLocaleString()})<br>🔍 ${combinations[i].substring(0, 40)}`;
                await sleep(0);
            }
        }
    } else {
        const maxLen = parseInt(maxLength);
        if (targetPassword.length > maxLen) {
            resultDiv.innerHTML = `<div class="result-card">⚠️ Password lebih panjang dari ${maxLen} karakter!</div>`;
            bruteForceActive = false;
            bruteBtn.disabled = false;
            stopBtn.disabled = true;
            return;
        }
        
        progressDiv.style.display = 'block';
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        for (let len = 1; len <= maxLen && bruteForceActive; len++) {
            const totalCombos = Math.pow(chars.length, len);
            let comboCount = 0;
            
            for (const combo of generateCombinations(len, '', chars)) {
                if (!bruteForceActive) break;
                attempts++;
                comboCount++;
                if (comboCount % 5000 === 0) {
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
    
    bruteForceActive = false;
    bruteBtn.disabled = false;
    stopBtn.disabled = true;
    setTimeout(() => { progressDiv.style.display = 'none'; keywordProgressDiv.style.display = 'none'; }, 1000);
}

function* generateCombinations(length, prefix = '', chars = 'abcdefghijklmnopqrstuvwxyz0123456789') {
    if (length === 0) { yield prefix; return; }
    for (let i = 0; i < chars.length; i++) {
        if (!bruteForceActive) return;
        yield* generateCombinations(length - 1, prefix + chars[i], chars);
    }
}

function stopBruteForce() {
    if (bruteForceActive) {
        bruteForceActive = false;
        document.getElementById('bruteResult').innerHTML = '<div class="result-card">🛑 Menghentikan...</div>';
    }
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Password Cracker
async function crackPassword() {
    const password = document.getElementById('passwordInput').value.trim();
    const mode = document.querySelector('input[name="crackMode"]:checked').value;
    if (!password) { alert('Masukkan password!'); return; }
    
    const crackBtn = document.getElementById('crackBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const resultSection = document.getElementById('resultSection');
    
    crackBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    resultSection.style.display = 'none';
    
    const startTime = performance.now();
    let found = false, attempts = 0, foundPassword = null;
    
    if (mode === 'dictionary') {
        for (let i = 0; i < passwordDatabase.length; i++) {
            attempts++;
            if (passwordDatabase[i].toLowerCase() === password.toLowerCase()) {
                found = true;
                foundPassword = passwordDatabase[i];
                break;
            }
            if (i % 1000 === 0) {
                btnLoading.textContent = `⏳ ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    } else {
        const md5Hash = CryptoJS.MD5(password).toString();
        for (let i = 0; i < passwordDatabase.length; i++) {
            attempts++;
            if (CryptoJS.MD5(passwordDatabase[i]).toString() === md5Hash) {
                found = true;
                foundPassword = passwordDatabase[i];
                break;
            }
            if (i % 1000 === 0) {
                btnLoading.textContent = `⏳ ${Math.round((i/passwordDatabase.length)*100)}%`;
                await sleep(0);
            }
        }
    }
    
    const endTime = performance.now();
    const crackTime = (endTime - startTime) / 1000;
    const strength = checkStrength(password);
    
    document.getElementById('resultIcon').textContent = found ? '⚠️' : '✅';
    document.getElementById('resultTitle').innerHTML = found ? `DITEMUKAN! "${foundPassword}"` : 'AMAN! Tidak ditemukan!';
    document.getElementById('crackTime').textContent = `${crackTime.toFixed(3)} detik`;
    document.getElementById('attempts').textContent = attempts.toLocaleString();
    document.getElementById('strength').innerHTML = found ? `🔴 ${strength.text}` : `🟢 ${strength.text}`;
    document.getElementById('suggestions').innerHTML = found ? 'Ganti password yang lebih unik!' : 'Password cukup kuat, tetap waspada!';
    document.getElementById('resultSection').style.display = 'block';
    
    crackBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
}

function generatePassword() {
    const length = parseInt(document.getElementById('passLength').value);
    const useUpper = document.getElementById('genUpper').checked;
    const useLower = document.getElementById('genLower').checked;
    const useNumbers = document.getElementById('genNumbers').checked;
    const useSymbols = document.getElementById('genSymbols').checked;
    let chars = '';
    if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) chars += '0123456789';
    if (useSymbols) chars += '!@#$%^&*()';
    if (!chars) { alert('Pilih minimal satu!'); return; }
    let password = '';
    for (let i = 0; i < length; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('generatedPassword').value = password;
}

function exportPasswords() {
    const count = 100, length = 16;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const passwords = [];
    for (let i = 0; i < count; i++) {
        let pwd = '';
        for (let j = 0; j < length; j++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
        passwords.push(pwd);
    }
    const blob = new Blob([passwords.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

async function crackHash() {
    const hashInput = document.getElementById('hashInput').value.trim();
    const hashType = document.getElementById('hashType').value;
    const resultDiv = document.getElementById('hashResult');
    if (!hashInput) { alert('Masukkan hash!'); return; }
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="result-card">⏳ Mencari...</div>';
    for (let i = 0; i < passwordDatabase.length; i++) {
        let computedHash = hashType === 'md5' ? CryptoJS.MD5(passwordDatabase[i]).toString() : CryptoJS.SHA1(passwordDatabase[i]).toString();
        if (computedHash === hashInput.toLowerCase()) {
            resultDiv.innerHTML = `<div class="result-card">✅ DITEMUKAN! Password: <span style="color:#00ff00">${passwordDatabase[i]}</span></div>`;
            return;
        }
        if (i % 1000 === 0) {
            resultDiv.innerHTML = `<div class="result-card">⏳ ${Math.round((i/passwordDatabase.length)*100)}%</div>`;
            await sleep(0);
        }
    }
    resultDiv.innerHTML = '<div class="result-card">❌ Tidak ditemukan di database!</div>';
}

function copyToClipboard() {
    const pwdField = document.getElementById('generatedPassword');
    pwdField.select();
    document.execCommand('copy');
    alert('Copied!');
}

// Event Listeners
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
    document.getElementById('stopBruteBtn').addEventListener('click', stopBruteForce);
    document.getElementById('toggleVisibility').addEventListener('click', () => {
        const pwdInput = document.getElementById('passwordInput');
        pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('passwordInput').addEventListener('input', (e) => {
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
});
