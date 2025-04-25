/**
 * 工具类 - 提供加密和数据处理的基础函数
 */
export default class CryptoUtil {
    /**
     * 生成随机密钥
     * @returns {string} 生成的随机密钥
     */
    static generateKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 获取基于域名的内部密钥
     * @returns {string} 内部密钥
     */
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
    
    /**
     * 模糊处理数据（简单加密）
     * @param {string} data 要处理的数据
     * @returns {string} 处理后的数据
     */
    static obscureData(data) {
        const key = this.getInternalKey();
        return btoa(encodeURIComponent(data) + key);
    }

    /**
     * 解除模糊处理（简单解密）
     * @param {string} obscuredData 已处理的数据
     * @returns {string} 原始数据
     */
    static deobscureData(obscuredData) {
        const key = this.getInternalKey();
        const decoded = atob(obscuredData);
        return decodeURIComponent(decoded.substring(0, decoded.length - key.length));
    }
}