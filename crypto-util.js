export default class CryptoUtil {
    static encryptedApiKey = "U2FsdGVkX1/CMonLj6FCyMCoaQcuyuvu6JCNcqWPY1Cn3AuSSbt5053CC0n0Mzu/OIDSB2NsAMTzKT6HV+rwvbgz6vGMfngwey0ndHK2rms=";
    static apiKey = null;
    static keyVerified = false;
    
    static generateKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static getInternalKey() {
        const domain = window.location.hostname;
        const seed = domain + '-ai-tab-secret';
        let hash = 0;
        
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(16).padStart(16, '0');
    }
    
    static obscureData(data) {
        const key = this.getInternalKey();
        return btoa(encodeURIComponent(data) + key);
    }

    static deobscureData(obscuredData) {
        const key = this.getInternalKey();
        const decoded = atob(obscuredData);
        return decodeURIComponent(decoded.substring(0, decoded.length - key.length));
    }
    
    static async verifyApiKey() {
        if (this.keyVerified) return true;
        
        const modalContainer = document.createElement('div');
        modalContainer.className = 'api-key-modal-container';
        modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'api-key-modal-content';
        modalContent.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            text-align: center;
            animation: modalFadeIn 0.3s ease forwards;
        `;
        
        modalContent.innerHTML = `
            <h2 style="margin-top: 0; color: #333; font-size: 20px; margin-bottom: 20px;">输入 API 密钥</h2>
            <p style="color: #666; margin-bottom: 20px; font-size: 14px;">使用 AI 搜索需要输入管理员向您提供的密钥进行验证</p>
            <input type="password" id="api-secret-key" placeholder="请输入密钥" style="width: 100%; padding: 12px; border: 1px solid rgba(0, 0, 0, 0.2); border-radius: 8px; margin-bottom: 20px; font-size: 16px;">
            <div style="display: flex; justify-content: space-between;">
                <button id="cancel-api-key" style="padding: 10px 20px; border: none; border-radius: 8px; background: #f1f1f1; color: #333; cursor: pointer; font-size: 15px;">取消</button>
                <button id="submit-api-key" style="padding: 10px 20px; border: none; border-radius: 8px; background: #4285f4; color: white; cursor: pointer; font-size: 15px;">验证</button>
            </div>
            <p id="api-key-error" style="color: #d32f2f; margin-top: 15px; font-size: 14px; display: none;">密钥不正确，请重新输入</p>
        `;
        
        modalContainer.appendChild(modalContent);
        document.body.appendChild(modalContainer);
        
        setTimeout(() => {
            document.getElementById('api-secret-key').focus();
        }, 100);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        return new Promise((resolve) => {
            document.getElementById('cancel-api-key').addEventListener('click', () => {
                modalContainer.remove();
                resolve(false);
            });
            
            document.getElementById('submit-api-key').addEventListener('click', async () => {
                const secretKey = document.getElementById('api-secret-key').value.trim();
                if (!secretKey) {
                    document.getElementById('api-key-error').style.display = 'block';
                    document.getElementById('api-key-error').textContent = '请输入密钥';
                    return;
                }
                
                try {
                    if (!window.CryptoJS) {
                        await loadCryptoJS();
                    }
                    
                    const decrypted = CryptoJS.AES.decrypt(this.encryptedApiKey, secretKey).toString(CryptoJS.enc.Utf8);
                    
                    if (decrypted) {
                        this.apiKey = decrypted;
                        this.keyVerified = true;
                        modalContainer.remove();
                        resolve(true);
                    } else {
                        document.getElementById('api-key-error').style.display = 'block';
                        document.getElementById('api-key-error').textContent = '密钥不正确，请重新输入';
                    }
                } catch (error) {
                    console.error('解密失败:', error);
                    document.getElementById('api-key-error').style.display = 'block';
                    document.getElementById('api-key-error').textContent = '密钥不正确，请重新输入';
                }
            });
            
            document.getElementById('api-secret-key').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('submit-api-key').click();
                }
            });
        });
    }
    
    static getApiKey() {
        return this.apiKey;
    }
}

function loadCryptoJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
} 