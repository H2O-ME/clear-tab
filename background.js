/**
 * 背景管理系统
 * 负责管理和控制页面背景，包括必应壁纸加载和粒子系统备用背景
 */
import ParticleSystem from './particles.js';

class BackgroundManager {
    constructor() {
        // 配置参数
        this.loadTimeout = 1000; // 加载超时时间（毫秒）
        
        // 状态变量
        this.isLoaded = false;
        this.useParticles = false;
        this.particleSystem = null;
        this.timeoutId = null;
        
        // DOM元素
        this.body = document.body;
    }
    
    /**
     * 初始化背景管理系统
     */
    init() {
        this.setupParticleSystem();
        this.setWallpaperTimeout();
    }
    
    /**
     * 设置粒子系统（作为备用背景）
     */
    setupParticleSystem() {
        // 创建画布
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-background';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '-1';
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 1s ease';
        
        // 设置画布尺寸
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // 添加到DOM
        document.body.appendChild(canvas);
        
        // 创建粒子系统
        this.particleSystem = new ParticleSystem(canvas, {
            count: 200,
            baseSize: 3,
            addedSize: 4,
            baseSpeed: 0.2,
            addedSpeed: 0.3,
            opacityBase: 0.5,
            opacityAdded: 0.5
        });
    }
    
    /**
     * 激活粒子背景
     */
    activateParticleBackground() {
        if (!this.particleSystem) return;
        
        this.useParticles = true;
        this.isLoaded = true;
        
        // 显示粒子画布
        const canvas = document.getElementById('particle-background');
        if (canvas) {
            canvas.style.opacity = '1';
        }
        
        // 启动粒子系统
        this.particleSystem.start();
        
        // 触发加载完成事件
        this.dispatchBackgroundLoadedEvent();
    }
    
    /**
     * 触发背景加载完成事件
     */
    dispatchBackgroundLoadedEvent() {
        const event = new CustomEvent('backgroundLoaded', {
            detail: { type: this.useParticles ? 'particles' : 'wallpaper' }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 刷新背景
     */
    refresh() {
        if (this.particleSystem) {
            this.particleSystem.handleResize();
        }
    }
    
    /**
     * 设置壁纸加载超时
     * 当壁纸加载超时时，启动粒子系统作为备用背景
     */
    setWallpaperTimeout() {
        // 清除可能存在的超时计时器
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        
        // 设置新的超时计时器
        this.timeoutId = setTimeout(() => {
            if (!this.isLoaded) {
                console.log('壁纸加载超时，启用粒子背景');
                this.activateParticleBackground();
            }
        }, this.loadTimeout);
    }
}

export default BackgroundManager;