// ==================== GLOBAL VARIABLES ====================
let passwordDatabase = [];
let currentTheme = 'dark';
let bruteForceActive = false;
const MAX_COMBINATIONS_LIMIT = 200000000; // 200 juta limit

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

// ==================== PASSWORD CRACKER ====================
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
    const useUpper = document.getElementById('genUpper').checked;
    const useLower = document.getElementById('genLower').checked;
    const useNumbers = document.getElementById('genNumbers').checked;
    const useSymbols = document.getElementById('genSymbols').checked;
    
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

// ==================== BRUTE FORCE SIMULATOR (DENGAN LIMIT 200 JUTA) ====================

// Generate kombinasi dari kata kunci dengan estimasi jumlah
function generateKeywordCombinations(keywords) {
    const combinations = new Set();
    const symbols = ['!', '@', '#', '$', '%', '&', '*', '?'];
    const numbers = Array.from({length: 1000}, (_, i) => i.toString());
    
    const useNumbers = document.getElementById('useNumbersKeyword').checked;
    const useSymbols = document.getElementById('useSymbolsKeyword').checked;
    const useCaseVar = document.getElementById('useCaseVariation').checked;
    
    const activeKeywords = keywords.filter(k => k.trim() !== '');
    
    if (activeKeywords.length === 0) return { combinations: [], estimatedTotal: 0, exceeded: false };
    
    let estimatedTotal = 0;
    
    for (let kw of activeKeywords) {
        const originalKw = kw;
        
        let keywordsToTry = [originalKw.toLowerCase(), originalKw.toUpperCase()];
        if (useCaseVar) {
            keywordsToTry.push(originalKw.charAt(0).toUpperCase() + originalKw.slice(1).toLowerCase());
            let altCase = '';
            for (let i = 0; i < originalKw.length; i++) {
                altCase += i % 2 === 0 ? originalKw[i].toUpperCase() : originalKw[i].toLowerCase();
            }
            keywordsToTry.push(altCase);
        }
        
        for (let kwVar of keywordsToTry) {
            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) {
                return { combinations: Array.from(combinations), estimatedTotal, exceeded: true };
            }
            combinations.add(kwVar);
            estimatedTotal++;
            
            if (useNumbers) {
                for (let i = 0; i <= 99; i++) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + i);
                    combinations.add(i + kwVar);
                    combinations.add(kwVar + i.toString().padStart(2, '0'));
                    estimatedTotal += 3;
                }
                for (let i = 100; i <= 999; i += 50) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + i);
                    combinations.add(i + kwVar);
                    estimatedTotal += 2;
                }
            }
            
            if (useSymbols) {
                for (let sym of symbols) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                    combinations.add(kwVar + sym);
                    combinations.add(sym + kwVar);
                    combinations.add(kwVar + sym + '123');
                    estimatedTotal += 3;
                }
            }
            
            if (useNumbers && useSymbols) {
                for (let num of [1, 12, 123]) {
                    for (let sym of symbols.slice(0, 4)) {
                        if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) break;
                        combinations.add(kwVar + num + sym);
                        combinations.add(kwVar + sym + num);
                        estimatedTotal += 2;
                    }
                }
            }
        }
    }
    
    // Kombinasi antar keyword
    if (activeKeywords.length >= 2 && estimatedTotal < MAX_COMBINATIONS_LIMIT) {
        for (let kw1 of activeKeywords) {
            for (let kw2 of activeKeywords) {
                if (kw1 !== kw2 && estimatedTotal < MAX_COMBINATIONS_LIMIT) {
                    combinations.add(kw1 + kw2);
                    combinations.add(kw1 + '_' + kw2);
                    combinations.add(kw1 + kw2 + '123');
                    estimatedTotal += 3;
                }
            }
        }
    }
    
    if (activeKeywords.length >= 3 && estimatedTotal < MAX_COMBINATIONS_LIMIT) {
        const [kw1, kw2, kw3] = activeKeywords;
        combinations.add(kw1 + kw2 + kw3);
        combinations.add(kw1 + '_' + kw2 + '_' + kw3);
        estimatedTotal += 2;
    }
    
    return { 
        combinations: Array.from(combinations), 
        estimatedTotal, 
        exceeded: estimatedTotal >= MAX_COMBINATIONS_LIMIT 
    };
}

// Normal brute force generator
function* generateCombinations(length, prefix = '', chars = 'abcdefghijklmnopqrstuvwxyz0123456789') {
    if (length === 0) { yield prefix; return; }
    for (let i = 0; i < chars.length; i++) {
        if (!bruteForceActive) return;
        yield* generateCombinations(length - 1, prefix + chars[i], chars);
    }
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
    
    // Ambil keyword
    const keyword1 = document.getElementById('keyword1').value;
    const keyword2 = document.getElementById('keyword2').value;
    const keyword3 = document.getElementById('keyword3').value;
    const keywords = [keyword1, keyword2, keyword3];
    const isKeywordMode = maxLength === 'keyword';
    
    if (!targetPassword) { alert('Masukkan password target!'); return; }
    
    // Stop previous simulation
    if (bruteForceActive) {
        bruteForceActive = false;
        await sleep(500);
    }
    
    // Cek limit untuk mode keyword
    if (isKeywordMode) {
        const activeKeywords = keywords.filter(k => k.trim() !== '');
        if (activeKeywords.length === 0) {
            alert('Isi minimal 1 kata kunci untuk mode Keyword Combo!');
            return;
        }
        
        const { estimatedTotal, exceeded } = generateKeywordCombinations(keywords);
        
        if (exceeded || estimatedTotal > MAX_COMBINATIONS_LIMIT) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00; background: rgba(0,255,0,0.1);">
                <strong>✅✅✅ PASSWORD ANDA 100% AMAN! ✅✅✅</strong><br><br>
                🔒 Total kombinasi yang akan dicoba: <strong>${estimatedTotal.toLocaleString()}</strong><br>
                📊 Melebihi batas aman: <strong>${MAX_COMBINATIONS_LIMIT.toLocaleString()} kombinasi</strong><br><br>
                🛡️ Password Anda tidak mungkin dipecahkan dengan metode dictionary attack atau brute force sederhana!<br>
                💪 Tetap gunakan password minimal 12 karakter dengan campuran huruf, angka, dan simbol.<br>
                🔐 Aktifkan 2FA untuk keamanan maksimal.
            </div>`;
            return;
        }
    }
    
    // Mode normal brute force - hitung total kombinasi
    if (!isKeywordMode) {
        const maxLen = parseInt(maxLength);
        const charsCount = 36; // a-z (26) + 0-9 (10)
        let totalCombosAllLength = 0;
        for (let len = 1; len <= maxLen; len++) {
            totalCombosAllLength += Math.pow(charsCount, len);
            if (totalCombosAllLength > MAX_COMBINATIONS_LIMIT) {
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00; background: rgba(0,255,0,0.1);">
                    <strong>✅✅✅ PASSWORD ANDA 100% AMAN! ✅✅✅</strong><br><br>
                    🔒 Total kombinasi untuk ${maxLen} karakter: <strong>${totalCombosAllLength.toLocaleString()}</strong><br>
                    📊 Melebihi batas aman: <strong>${MAX_COMBINATIONS_LIMIT.toLocaleString()} kombinasi</strong><br><br>
                    🛡️ Brute force attack akan membutuhkan waktu bertahun-tahun untuk memecahkan password Anda!<br>
                    💪 Password dengan panjang ${targetPassword.length} karakter sangat aman dari serangan brute force.
                </div>`;
                return;
            }
        }
    }
    
    bruteForceActive = true;
    bruteBtn.disabled = true;
    stopBtn.disabled = false;
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div class="result-card">⏳ Memulai simulasi... (Tekan STOP untuk berhenti)</div>';
    
    const startTime = performance.now();
    let attempts = 0;
    let found = false;
    let foundPassword = '';
    
    // MODE KEYWORD COMBO
    if (isKeywordMode) {
        progressDiv.style.display = 'block';
        keywordProgressDiv.style.display = 'block';
        
        const { combinations, estimatedTotal } = generateKeywordCombinations(keywords);
        const totalCombos = combinations.length;
        
        keywordProgressDiv.innerHTML = `<div style="background: var(--bg-card); padding: 8px; border-radius: 8px;">
            🔑 Total kombinasi: ${totalCombos.toLocaleString()} | Estimasi: ${estimatedTotal.toLocaleString()}
        </div>`;
        await sleep(100);
        
        for (let i = 0; i < totalCombos && bruteForceActive; i++) {
            attempts++;
            const combo = combinations[i];
            
            if (i % 100 === 0) {
                const percent = (i / totalCombos) * 100;
                progressFill.style.width = `${percent}%`;
                keywordProgressDiv.innerHTML = `<div style="background: var(--bg-card); padding: 8px; border-radius: 8px;">
                    🔑 Mencoba kombinasi... ${percent.toFixed(1)}% (${i.toLocaleString()}/${totalCombos.toLocaleString()})<br>
                    💡 Sekarang: <span style="color: var(--accent);">${combo.substring(0, 50)}</span>
                </div>`;
                await sleep(0);
            }
            
            if (combo === targetPassword) {
                found = true;
                foundPassword = combo;
                bruteForceActive = false;
                break;
            }
        }
    } 
    // MODE NORMAL BRUTE FORCE
    else {
        const maxLen = parseInt(maxLength);
        if (targetPassword.length > maxLen) {
            resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ffa500;">
                ⚠️ Password lebih panjang dari ${maxLen} karakter!<br>
                Pilih mode yang lebih panjang atau gunakan mode Keyword Combo.
            </div>`;
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
                    resultDiv.innerHTML = `<div class="result-card">⏳ Mencoba panjang ${len}... ${Math.round(percent)}%<br>
                    📊 ${attempts.toLocaleString()} percobaan<br>
                    🔍 Mencoba: ${combo}</div>`;
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
    
    // Tampilkan hasil
    if (!bruteForceActive && !found) {
        resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ffa500;">
            <strong>🛑 SIMULASI DIHENTIKAN!</strong><br>
            Percobaan: ${attempts.toLocaleString()}<br>
            Waktu: ${timeTaken.toFixed(2)} detik
        </div>`;
    } else if (found) {
        resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #ff4444;">
            <strong>⚠️ PASSWORD BERHASIL DI BRUTE FORCE!</strong><br>
            Password: <span style="color: #00ff00;">${foundPassword}</span><br>
            Waktu: ${timeTaken.toFixed(2)} detik<br>
            Percobaan: ${attempts.toLocaleString()}<br>
            <span style="color: #ffa500;">💡 Rekomendasi: Jangan gunakan kata umum atau kombinasi yang mudah ditebak!</span>
        </div>`;
    } else {
        resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00;">
            <strong>✅ Password aman dari serangan ini!</strong><br>
            Tidak ditemukan dalam ${isKeywordMode ? 'kombinasi keyword' : maxLength + ' karakter brute force'}.<br>
            Waktu: ${timeTaken.toFixed(2)} detik<br>
            Percobaan: ${attempts.toLocaleString()}
        </div>`;
    }
    
    bruteForceActive = false;
    bruteBtn.disabled = false;
    stopBtn.disabled = true;
    setTimeout(() => { 
        progressDiv.style.display = 'none';
        keywordProgressDiv.style.display = 'none';
    }, 1000);
}

function stopBruteForce() {
    if (bruteForceActive) {
        bruteForceActive = false;
        const resultDiv = document.getElementById('bruteResult');
        resultDiv.innerHTML = '<div class="result-card" style="border-left: 3px solid #ffa500;">🛑 Menghentikan simulasi...</div>';
    }
}

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
    document.getElementById('stopBruteBtn').addEventListener('click', stopBruteForce);
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
