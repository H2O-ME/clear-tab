/**
 * 设置系统
 * 负责管理用户设置，包括主题切换等功能
 */
class SettingsManager {
    constructor() {
        // 设置项及默认值
        this.settings = {
            darkMode: false, // 默认为浅色模式
            timezone: 'auto', // 默认使用本地时区
            timezoneOffset: 0, // 默认无偏移
        };
        
        // 可用时区列表
        this.timezones = [
            { id: 'auto', name: '自动检测', offset: 0 },
            { id: 'GMT+0', name: 'GMT+0 格林威治标准时间', offset: 0 },
            { id: 'GMT+1', name: 'GMT+1 中欧时间', offset: 1 },
            { id: 'GMT+2', name: 'GMT+2 东欧时间', offset: 2 },
            { id: 'GMT+3', name: 'GMT+3 莫斯科时间', offset: 3 },
            { id: 'GMT+4', name: 'GMT+4 阿布扎比时间', offset: 4 },
            { id: 'GMT+5', name: 'GMT+5 巴基斯坦时间', offset: 5 },
            { id: 'GMT+6', name: 'GMT+6 孟加拉国时间', offset: 6 },
            { id: 'GMT+7', name: 'GMT+7 印度尼西亚时间', offset: 7 },
            { id: 'GMT+8', name: 'GMT+8 中国标准时间', offset: 8 },
            { id: 'GMT+9', name: 'GMT+9 日本标准时间', offset: 9 },
            { id: 'GMT+10', name: 'GMT+10 澳大利亚东部时间', offset: 10 },
            { id: 'GMT+11', name: 'GMT+11 所罗门群岛时间', offset: 11 },
            { id: 'GMT+12', name: 'GMT+12 新西兰时间', offset: 12 },
            { id: 'GMT-1', name: 'GMT-1 亚速尔群岛时间', offset: -1 },
            { id: 'GMT-2', name: 'GMT-2 大西洋中部时间', offset: -2 },
            { id: 'GMT-3', name: 'GMT-3 巴西利亚时间', offset: -3 },
            { id: 'GMT-4', name: 'GMT-4 大西洋时间', offset: -4 },
            { id: 'GMT-5', name: 'GMT-5 东部时间', offset: -5 },
            { id: 'GMT-6', name: 'GMT-6 中部时间', offset: -6 },
            { id: 'GMT-7', name: 'GMT-7 山地时间', offset: -7 },
            { id: 'GMT-8', name: 'GMT-8 太平洋时间', offset: -8 },
            { id: 'GMT-9', name: 'GMT-9 阿拉斯加时间', offset: -9 },
            { id: 'GMT-10', name: 'GMT-10 夏威夷时间', offset: -10 },
            { id: 'GMT-11', name: 'GMT-11 萨摩亚时间', offset: -11 },
            { id: 'GMT-12', name: 'GMT-12 国际日期变更线', offset: -12 }
        ];
        
        // DOM元素
        this.settingsBtn = null;
        this.settingsModal = null;
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化设置系统
     */
    init() {
        // 从本地存储加载设置
        this.loadSettings();
        
        // 创建设置按钮
        this.createSettingsButton();
        
        // 创建设置弹窗
        this.createSettingsModal();
        
        // 应用当前设置
        this.applySettings();
        
        // 监听设置变化
        this.setupEventListeners();
    }
    
    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('clearTabSettings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
    
    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        try {
            localStorage.setItem('clearTabSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }
    
    /**
     * 创建设置按钮
     */
    createSettingsButton() {
        // 检查是否已存在
        if (document.querySelector('.settings-btn')) return;
        
        // 创建设置按钮
        this.settingsBtn = document.createElement('button');
        this.settingsBtn.className = 'settings-btn';
        this.settingsBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" fill="currentColor"/>
            </svg>
        `;
        
        // 添加到页面
        document.body.appendChild(this.settingsBtn);
    }
    
    /**
     * 创建设置弹窗
     */
    createSettingsModal() {
        // 检查是否已存在
        if (document.querySelector('.settings-modal-container')) return;
        
        // 创建弹窗容器
        this.settingsModal = document.createElement('div');
        this.settingsModal.className = 'settings-modal-container';
        this.settingsModal.style.display = 'none';
        
        // 生成时区选项
        const timezoneOptions = this.timezones.map(tz => 
            `<option value="${tz.id}" ${this.settings.timezone === tz.id ? 'selected' : ''}>${tz.name}</option>`
        ).join('');
        
        // 设置弹窗内容
        this.settingsModal.innerHTML = `
            <div class="settings-modal">
                <div class="settings-header">
                    <h2>设置</h2>
                    <button class="close-settings-btn">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h3>外观</h3>
                        <div class="setting-item">
                            <span>深色模式</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="darkModeToggle" ${this.settings.darkMode ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>时间</h3>
                        <div class="setting-item">
                            <span>时区设置</span>
                            <div class="select-container">
                                <select id="timezoneSelect">
                                    ${timezoneOptions}
                                </select>
                                <svg class="select-arrow" viewBox="0 0 24 24" width="18" height="18">
                                    <path d="M7,10L12,15L17,10H7Z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="settings-footer">
                    <p>清 Tab - 版本 1.1.0</p>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(this.settingsModal);
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 设置按钮点击事件
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }
        
        // 关闭按钮点击事件
        const closeBtn = document.querySelector('.close-settings-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }
        
        // 点击弹窗外部关闭
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // 深色模式切换事件
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                this.settings.darkMode = darkModeToggle.checked;
                this.applySettings();
                this.saveSettings();
            });
        }
        
        // 时区选择事件
        const timezoneSelect = document.getElementById('timezoneSelect');
        if (timezoneSelect) {
            timezoneSelect.addEventListener('change', () => {
                this.settings.timezone = timezoneSelect.value;
                
                // 设置时区偏移
                const selectedTimezone = this.timezones.find(tz => tz.id === this.settings.timezone);
                if (selectedTimezone) {
                    this.settings.timezoneOffset = selectedTimezone.offset;
                }
                
                this.applySettings();
                this.saveSettings();
                
                // 立即更新时间显示
                this.updateTimeWithTimezone();
            });
        }
    }
    
    /**
     * 打开设置弹窗
     */
    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.style.display = 'flex';
            setTimeout(() => {
                this.settingsModal.classList.add('visible');
            }, 10);
        }
    }
    
    /**
     * 关闭设置弹窗
     */
    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('visible');
            setTimeout(() => {
                this.settingsModal.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * 应用当前设置
     */
    applySettings() {
        // 应用深色模式
        if (this.settings.darkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        
        // 应用时区设置
        this.updateTimeWithTimezone();
        
        // 设置时间更新定时器
        this.setupTimeUpdater();
    }
    
    /**
     * 根据设置的时区更新时间显示
     */
    updateTimeWithTimezone() {
        const timeElement = document.querySelector('.time');
        const dateElement = document.querySelector('.date');
        
        if (!timeElement || !dateElement) return;
        
        // 获取当前时间
        const now = new Date();
        
        // 根据时区设置调整时间
        let adjustedTime = now;
        
        if (this.settings.timezone !== 'auto') {
            // 获取本地时区偏移（分钟）
            const localOffset = now.getTimezoneOffset();
            
            // 计算目标时区与UTC的偏移（分钟）
            const targetOffset = -this.settings.timezoneOffset * 60;
            
            // 计算时差（毫秒）
            const offsetDiff = (localOffset + targetOffset) * 60 * 1000;
            
            // 调整时间
            adjustedTime = new Date(now.getTime() + offsetDiff);
        }
        
        // 更新时间显示
        const hours = String(adjustedTime.getHours()).padStart(2, '0');
        const minutes = String(adjustedTime.getMinutes()).padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
        
        // 更新日期显示
        const year = adjustedTime.getFullYear();
        const month = String(adjustedTime.getMonth() + 1).padStart(2, '0');
        const day = String(adjustedTime.getDate()).padStart(2, '0');
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[adjustedTime.getDay()];
        dateElement.textContent = `${year}年${month}月${day}日 ${weekday}`;
    }
    
    /**
     * 设置时间更新定时器
     */
    setupTimeUpdater() {
        // 清除可能存在的定时器
        if (this._timeUpdateInterval) {
            clearInterval(this._timeUpdateInterval);
        }
        
        // 设置新的定时器，每分钟更新一次
        this._timeUpdateInterval = setInterval(() => {
            this.updateTimeWithTimezone();
        }, 60000);
        
        // 立即更新一次时间
        this.updateTimeWithTimezone();
    }
    
    /**
     * 获取当前时区设置
     */
    getCurrentTimezone() {
        return this.settings.timezone;
    }
    
    /**
     * 获取当前时区偏移
     */
    getTimezoneOffset() {
        return this.settings.timezoneOffset;
    }
}

export default SettingsManager;
