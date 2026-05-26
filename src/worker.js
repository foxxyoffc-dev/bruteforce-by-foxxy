self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    if (type === 'crack') {
        const { targetPassword, passwordDatabase } = data;
        
        const startTime = performance.now();
        let found = false;
        let attempts = 0;
        let foundPassword = null;
        
        for (let i = 0; i < passwordDatabase.length; i++) {
            const currentPassword = passwordDatabase[i];
            attempts++;
            
            if (i % 1000 === 0) {
                const percentage = ((i + 1) / passwordDatabase.length) * 100;
                self.postMessage({
                    type: 'progress',
                    data: {
                        percentage: percentage.toFixed(1),
                        currentAttempts: i + 1,
                        totalAttempts: passwordDatabase.length
                    }
                });
            }
            
            if (currentPassword.toLowerCase() === targetPassword.toLowerCase()) {
                found = true;
                foundPassword = currentPassword;
                break;
            }
            
            if (i % 100 === 0) {
                await sleep(0);
            }
        }
        
        const endTime = performance.now();
        const crackTime = (endTime - startTime) / 1000;
        
        self.postMessage({
            type: 'complete',
            data: {
                found: found,
                password: foundPassword,
                attempts: attempts,
                crackTime: crackTime,
                totalDatabase: passwordDatabase.length
            }
        });
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
