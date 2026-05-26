// ==================== GLOBAL VARIABLES ====================
let passwordDatabase = [];
let currentTheme = 'dark';
let bruteForceActive = false;
const MAX_COMBINATIONS_LIMIT = 200000000; // 200 JUTA limit

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

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

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
    document.querySelectorAll('.tab-btn').forEach(btn => {
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
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        themeBtn.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        });
    }
}

// ==================== KEYWORD + DATABASE COMBO (UNLIMITED - SAMPAI 200 JUTA) ====================
async function generateKeywordDatabaseCombinations(keywords) {
    const combinations = [];
    const symbols = ['!', '@', '#', '$', '%', '&', '*', '?'];
    
    const useNumbers = document.getElementById('useNumbersKeyword')?.checked || true;
    const useSymbols = document.getElementById('useSymbolsKeyword')?.checked || true;
    const useCaseVar = document.getElementById('useCaseVariation')?.checked || true;
    const useDatabase = document.getElementById('useDatabaseCombo')?.checked || true;
    
    const activeKeywords = keywords.filter(k => k && k.trim() !== '');
    if (activeKeywords.length === 0) return { combinations: [], estimatedTotal: 0 };
    
    let estimatedTotal = 0;
    let shouldStop = false;
    
    for (let kw of activeKeywords) {
        if (shouldStop) break;
        
        // Variasi keyword
        let kwVariations = [kw.toLowerCase(), kw.toUpperCase()];
        if (useCaseVar) {
            kwVariations.push(kw.charAt(0).toUpperCase() + kw.slice(1).toLowerCase());
        }
        
        for (let kwVar of kwVariations) {
            if (shouldStop) break;
            
            // 1. Keyword saja
            combinations.push(kwVar);
            estimatedTotal++;
            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
            
            // 2. Keyword + Angka (0-999) - FULL
            if (useNumbers) {
                for (let i = 0; i <= 999; i++) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                    combinations.push(kwVar + i);
                    combinations.push(i + kwVar);
                    estimatedTotal += 2;
                    
                    // Progress update setiap 10rb
                    if (combinations.length % 10000 === 0) {
                        await sleep(0);
                    }
                }
            }
            
            // 3. Keyword + Simbol
            if (useSymbols) {
                for (let sym of symbols) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                    combinations.push(kwVar + sym);
                    combinations.push(sym + kwVar);
                    combinations.push(kwVar + sym + '123');
                    combinations.push('123' + kwVar + sym);
                    estimatedTotal += 4;
                }
            }
            
            // 4. KEYWORD + DATABASE PASSWORD (FULL - TANPA BATAS!)
            if (useDatabase && passwordDatabase.length > 0) {
                for (let dbPass of passwordDatabase) {
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                    
                    // Keyword + Database
                    combinations.push(kwVar + dbPass);
                    combinations.push(dbPass + kwVar);
                    combinations.push(kwVar + '_' + dbPass);
                    combinations.push(dbPass + '_' + kwVar);
                    estimatedTotal += 4;
                    
                    // Keyword + Database + Angka
                    if (useNumbers) {
                        for (let num of [1, 12, 123, 1234]) {
                            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                            combinations.push(kwVar + dbPass + num);
                            combinations.push(dbPass + kwVar + num);
                            combinations.push(kwVar + num + dbPass);
                            estimatedTotal += 3;
                        }
                    }
                    
                    // Keyword + Database + Simbol
                    if (useSymbols) {
                        for (let sym of symbols.slice(0, 3)) {
                            if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                            combinations.push(kwVar + dbPass + sym);
                            combinations.push(dbPass + kwVar + sym);
                            estimatedTotal += 2;
                        }
                    }
                    
                    // Update progress biar gak freeze
                    if (combinations.length % 5000 === 0) {
                        await sleep(0);
                    }
                }
            }
            
            // 5. Kombinasi antar keyword (jika ada 2+ keyword)
            if (activeKeywords.length >= 2 && !shouldStop) {
                for (let kw2 of activeKeywords) {
                    if (kw2 === kw) continue;
                    if (estimatedTotal >= MAX_COMBINATIONS_LIMIT) { shouldStop = true; break; }
                    combinations.push(kwVar + kw2);
                    combinations.push(kwVar + '_' + kw2);
                    combinations.push(kwVar + kw2 + '123');
                    estimatedTotal += 3;
                }
            }
        }
    }
    
    // Hapus duplikat pake Set
    const uniqueCombos = [...new Set(combinations)];
    
    return { 
        combinations: uniqueCombos, 
        estimatedTotal: uniqueCombos.length,
        exceeded: uniqueCombos.length >= MAX_COMBINATIONS_LIMIT 
    };
}

// ==================== BRUTE FORCE SIMULATOR ====================
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
    
    // CEK LIMIT DULU SEBELUM MULAI
    if (isKeywordMode) {
        const activeKeywords = keywords.filter(k => k.trim() !== '');
        if (activeKeywords.length === 0) {
            alert('Isi minimal 1 kata kunci!');
            return;
        }
        
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div class="result-card">⏳ Menghitung total kombinasi...</div>';
            await sleep(100);
        }
        
        const { estimatedTotal, exceeded } = await generateKeywordDatabaseCombinations(keywords);
        
        if (exceeded || estimatedTotal > MAX_COMBINATIONS_LIMIT) {
            if (resultDiv) {
                resultDiv.innerHTML = `<div class="result-card" style="border-left: 3px solid #00ff00; background: rgba(0,255,0,0.1);">
                    <strong>✅✅✅ PASSWORD ANDA 100% AMAN! ✅✅✅</strong><br><br>
                    🔒 Total kombinasi yang akan dicoba: <strong>${estimatedTotal.toLocaleString()}</strong><br>
                    📊 Melebihi batas aman: <strong>${MAX_COMBINATIONS_LIMIT.toLocaleString()} kombinasi</strong><br><br>
                    🛡️ Password Anda tidak mungkin dipecahkan dengan metode brute force!
                </div>`;
            }
            return;
        }
        
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="result-card">⏳ Memulai simulasi dengan ${estimatedTotal.toLocaleString()} kombinasi...</div>`;
        }
    }
    
    bruteForceActive = true;
    if (bruteBtn) bruteBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    
    const startTime = performance.now();
    let attempts = 0;
    let found = false;
    let foundPassword = '';
    
    if (isKeywordMode) {
        if (progressDiv) progressDiv.style.display = 'block';
        if (keywordProgressDiv) keywordProgressDiv.style.display = 'block';
        
        const { combinations } = await generateKeywordDatabaseCombinations(keywords);
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
            
            // Update progress setiap 100 percobaan
            if (i % 100 === 0 && progressFill) {
                const percent = (i / totalCombos) * 100;
                progressFill.style.width = `${percent}%`;
                if (keywordProgressDiv) {
                    keywordProgressDiv.innerHTML = `🔑 ${percent.toFixed(1)}% (${i.toLocaleString()}/${totalCombos.toLocaleString()})<br>🔍 ${combinations[i]?.substring(0, 50) || ''}`;
                }
                await sleep(0);
            }
        }
    } else {
        // Mode normal brute force (sampai 8 digit)
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
        let totalAttemptsAll = 0;
        
        for (let len = 1; len <= maxLen && bruteForceActive; len++) {
            const totalCombos = Math.pow(chars.length, len);
            let comboCount = 0;
            
            for (const combo of generateCombinations(len, '', chars)) {
                if (!bruteForceActive) break;
                attempts++;
                comboCount++;
                
                if (comboCount % 1000 === 0 && progressFill && resultDiv) {
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
        const resultDiv = document.getElementById('bruteResult');
        if (resultDiv) {
            resultDiv.innerHTML = '<div class="result-card">🛑 Menghentikan simulasi...</div>';
        }
    }
}

// ==================== PASSWORD CRACKER ====================
async function crackPassword() {
    const password = document.getElementById('passwordInput')?.value.trim();
    const mode = document.querySelector('input[name="crackMode"]:checked')?.value;
    if (!password) { alert('Masukkan password!'); return; }
    
    const crackBtn = document.getElementById('crackBtn');
    const btnText = document.querySelector('#crackBtn .btn-text');
    const btnLoading = document.querySelector('#crackBtn .btn-loading');
    const resultSection = document.getElementById('resultSection');
    
    if (crackBtn) crackBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    if (resultSection) resultSection.style.display = 'none';
    
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
            if (i % 1000 === 0 && btnLoading) {
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
            if (i % 1000 === 0 && btnLoading) {
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
    document.getElementById('suggestions').innerHTML = found ? 'Ganti password yang lebih unik!' : 'Password cukup kuat!';
    if (resultSection) resultSection.style.display = 'block';
    
    if (crackBtn) crackBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
}

// ==================== GENERATOR ====================
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
    if (!chars) { alert('Pilih minimal satu!'); return; }
    let password = '';
    for (let i = 0; i < length; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    const genField = document.getElementById('generatedPassword');
    if (genField) genField.value = password;
}

function copyToClipboard() {
    const field = document.getElementById('generatedPassword');
    if (field) { field.select(); document.execCommand('copy'); alert('Copied!'); }
}

function exportPasswords() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const passwords = [];
    for (let i = 0; i < 100; i++) {
        let pwd = '';
        for (let j = 0; j < 16; j++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
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
    const hashInput = document.getElementById('hashInput')?.value.trim();
    const hashType = document.getElementById('hashType')?.value || 'md5';
    const resultDiv = document.getElementById('hashResult');
    if (!hashInput) { alert('Masukkan hash!'); return; }
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="result-card">⏳ Mencari...</div>';
    }
    for (let i = 0; i < passwordDatabase.length; i++) {
        const computedHash = hashType === 'md5' ? CryptoJS.MD5(passwordDatabase[i]).toString() : CryptoJS.SHA1(passwordDatabase[i]).toString();
        if (computedHash === hashInput.toLowerCase()) {
            if (resultDiv) {
                resultDiv.innerHTML = `<div class="result-card">✅ DITEMUKAN! Password: <span style="color:#00ff00">${passwordDatabase[i]}</span></div>`;
            }
            return;
        }
        if (i % 1000 === 0 && resultDiv) {
            resultDiv.innerHTML = `<div class="result-card">⏳ ${Math.round((i/passwordDatabase.length)*100)}%</div>`;
            await sleep(0);
        }
    }
    if (resultDiv) {
        resultDiv.innerHTML = '<div class="result-card">❌ Tidak ditemukan!</div>';
    }
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    setupTabs();
    setupTheme();
    
    document.getElementById('crackBtn')?.addEventListener('click', crackPassword);
    document.getElementById('generateBtn')?.addEventListener('click', generatePassword);
    document.getElementById('copyPasswordBtn')?.addEventListener('click', copyToClipboard);
    document.getElementById('exportPasswordsBtn')?.addEventListener('click', exportPasswords);
    document.getElementById('hashCrackBtn')?.addEventListener('click', crackHash);
    document.getElementById('bruteBtn')?.addEventListener('click', simulateBruteForce);
    document.getElementById('stopBruteBtn')?.addEventListener('click', stopBruteForce);
    document.getElementById('toggleVisibility')?.addEventListener('click', () => {
        const pwd = document.getElementById('passwordInput');
        if (pwd) pwd.type = pwd.type === 'password' ? 'text' : 'password';
    });
    
    document.getElementById('passwordInput')?.addEventListener('input', (e) => {
        const strength = checkStrength(e.target.value);
        let indicator = document.querySelector('.strength-indicator');
        if (!indicator && e.target.parentNode) {
            indicator = document.createElement('div');
            indicator.className = 'strength-indicator';
            indicator.style.cssText = 'margin-top: 8px; font-size: 11px;';
            e.target.parentNode.appendChild(indicator);
        }
        if (indicator) indicator.innerHTML = `Kekuatan: <span style="color: ${strength.color};">${strength.text}</span>`;
    });
});
