let passwordWorker = null;
let totalPasswordsDB = 0;

const passwordInput = document.getElementById('passwordInput');
const crackBtn = document.getElementById('crackBtn');
const toggleBtn = document.getElementById('toggleVisibility');
const resultSection = document.getElementById('resultSection');
const btnText = document.querySelector('.btn-text');
const btnLoading = document.querySelector('.btn-loading');

const totalPasswordsEl = document.getElementById('totalPasswords');
const worstPasswordEl = document.getElementById('worstPassword');
const avgTimeEl = document.getElementById('avgTime');

async function loadDatabaseInfo() {
    try {
        const response = await fetch('/public/api/passwords.json');
        const passwords = await response.json();
        totalPasswordsDB = passwords.length;
        totalPasswordsEl.textContent = totalPasswordsDB.toLocaleString();
        worstPasswordEl.textContent = passwords[0] || '123456';
        
        const avgTime = localStorage.getItem('avgCrackTime');
        if (avgTime) {
            avgTimeEl.textContent = `${parseFloat(avgTime).toFixed(3)} detik`;
        } else {
            avgTimeEl.textContent = 'Belum ada data';
        }
    } catch (error) {
        console.error('Error:', error);
        totalPasswordsEl.textContent = '500+';
        worstPasswordEl.textContent = '123456';
    }
}

function initWorker() {
    if (passwordWorker) {
        passwordWorker.terminate();
    }
    
    passwordWorker = new Worker(new URL('./worker.js', import.meta.url));
    
    passwordWorker.onmessage = function(e) {
        const { type, data } = e.data;
        
        if (type === 'complete') {
            displayResult(data);
            crackBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            
            if (data.crackTime) {
                const currentAvg = localStorage.getItem('avgCrackTime');
                if (currentAvg) {
                    const newAvg = (parseFloat(currentAvg) + data.crackTime) / 2;
                    localStorage.setItem('avgCrackTime', newAvg);
                } else {
                    localStorage.setItem('avgCrackTime', data.crackTime);
                }
            }
            
            passwordWorker.terminate();
            passwordWorker = null;
        } else if (type === 'progress') {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            btnLoading.textContent = `⏳ MENCARI... ${data.percentage}% (${data.currentAttempts}/${data.totalAttempts})`;
        }
    };
}

function displayResult(result) {
    const resultIcon = document.getElementById('resultIcon');
    const resultTitle = document.getElementById('resultTitle');
    const crackTimeEl = document.getElementById('crackTime');
    const attemptsEl = document.getElementById('attempts');
    const strengthEl = document.getElementById('strength');
    const suggestionsEl = document.getElementById('suggestions');
    
    const isFound = result.found;
    const password = result.password;
    const attempts = result.attempts;
    const crackTime = result.crackTime;
    
    if (isFound) {
        resultIcon.textContent = '⚠️';
        resultTitle.textContent = `PASSWORD DITEMUKAN! "${password}" ada di database!`;
        resultTitle.style.color = '#ff4444';
        strengthEl.innerHTML = '🔴 <strong>SANGAT LEMAH</strong> - Password ini termasuk dalam 500+ password paling umum!';
        suggestionsEl.innerHTML = `
            <strong>💡 Saran Perbaikan:</strong><br>
            • Password "${password}" terlalu umum dan mudah ditebak<br>
            • Gunakan minimal 12 karakter dengan campuran huruf besar, angka, dan simbol<br>
            • Jangan gunakan password yang sama untuk akun berbeda<br>
            • Contoh password kuat: "KucingLompat123!@#"
        `;
    } else {
        resultIcon.textContent = '✅';
        resultTitle.textContent = 'PASSWORD AMAN! Tidak ditemukan di database!';
        resultTitle.style.color = '#00ff00';
        strengthEl.innerHTML = '🟢 <strong>KUAT</strong> - Password ini tidak ada dalam dictionary attack kami!';
        suggestionsEl.innerHTML = `
            <strong>🎉 Selamat! Password Anda cukup kuat!</strong><br>
            • Password tidak termasuk dalam 500+ password umum<br>
            • Tetap waspada dengan serangan lain seperti brute force atau phishing<br>
            • Pertimbangkan untuk menggunakan 2FA (Two-Factor Authentication)
        `;
    }
    
    crackTimeEl.textContent = `${crackTime.toFixed(3)} detik`;
    attemptsEl.textContent = attempts.toLocaleString();
    
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function startCracking() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        alert('Masukkan password dulu bro!');
        return;
    }
    
    if (password.length < 3) {
        alert('Password terlalu pendek (minimal 3 karakter) biar hasilnya akurat.');
        return;
    }
    
    crackBtn.disabled = true;
    resultSection.style.display = 'none';
    
    try {
        const response = await fetch('/public/api/passwords.json');
        const passwordDatabase = await response.json();
        
        initWorker();
        
        passwordWorker.postMessage({
            type: 'crack',
            data: {
                targetPassword: password,
                passwordDatabase: passwordDatabase
            }
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal load database password. Coba refresh halaman.');
        crackBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function toggleVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleBtn.textContent = type === 'password' ? '👁️' : '🔒';
}

crackBtn.addEventListener('click', startCracking);
toggleBtn.addEventListener('click', toggleVisibility);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startCracking();
    }
});

loadDatabaseInfo();

passwordInput.addEventListener('input', function(e) {
    const password = e.target.value;
    if (password.length > 0) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        let strengthText = '';
        let strengthColor = '';
        if (strength <= 2) {
            strengthText = 'Lemah';
            strengthColor = '#ff4444';
        } else if (strength <= 4) {
            strengthText = 'Sedang';
            strengthColor = '#ffa500';
        } else {
            strengthText = 'Kuat';
            strengthColor = '#00ff00';
        }
        
        let indicator = document.querySelector('.strength-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'strength-indicator';
            indicator.style.cssText = 'margin-top: 10px; font-size: 12px;';
            passwordInput.parentNode.appendChild(indicator);
        }
        indicator.innerHTML = `Kekuatan Password: <span style="color: ${strengthColor}; font-weight: bold;">${strengthText}</span>`;
    }
});
