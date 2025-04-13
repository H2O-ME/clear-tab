/**
 * 粒子动画系统
 * 负责创建、管理和渲染粒子动画效果
 */
class ParticleSystem {
    /**
     * 初始化粒子系统
     * @param {HTMLCanvasElement} canvas - 用于绘制粒子的画布元素
     * @param {Object} options - 配置选项
     */
    constructor(canvas, options = {}) {
        // 画布相关
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 配置选项
        this.options = {
            count: options.count || 150,            // 粒子数量
            baseSize: options.baseSize || 3,        // 基础粒子大小
            addedSize: options.addedSize || 4,      // 随机增加的粒子大小
            baseSpeed: options.baseSpeed || 0.2,    // 基础移动速度
            addedSpeed: options.addedSpeed || 0.3,  // 随机增加的速度
            opacityBase: options.opacityBase || 0.5, // 基础不透明度
            opacityAdded: options.opacityAdded || 0.5 // 随机增加的不透明度
        };
        
        // 状态
        this.particles = [];
        this.raf = null;
        this.isInitialized = false;
        this.isRunning = false;
        
        // 初始化粒子系统
        this.initialize();
    }
    
    /**
     * 初始化粒子系统
     * @param {Array} savedParticles - 可选的保存的粒子属性数组
     */
    initialize(savedParticles = null) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 清空现有粒子
        this.particles = [];
        
        // 创建新粒子
        for (let i = 0; i < this.options.count; i++) {
            // 检查是否有保存的粒子特性
            const savedProps = savedParticles && i < savedParticles.length ? savedParticles[i] : null;
            
            this.particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                z: Math.random() * 10,
                size: this.options.baseSize + Math.random() * this.options.addedSize,
                speed: savedProps ? savedProps.speed : this.options.baseSpeed + Math.random() * this.options.addedSpeed,
                color: savedProps ? savedProps.color : this.getRandomParticleColor(),
                opacity: savedProps ? savedProps.opacity : this.options.opacityBase + Math.random() * this.options.opacityAdded
            });
        }
        
        this.isInitialized = true;
    }
    
    /**
     * 获取随机粒子颜色
     * @returns {Object} RGB颜色对象
     */
    getRandomParticleColor() {
        // 主要颜色组：金色、白色、淡蓝色、橙红色
        const colors = [
            { r: 214, g: 184, b: 96 },  // 金色
            { r: 230, g: 230, b: 230 }, // 白色
            { r: 170, g: 200, b: 230 }, // 淡蓝色
            { r: 230, g: 140, b: 90 },  // 橙红色
            { r: 200, g: 200, b: 255 }  // 淡紫色
        ];
        
        // 随机偏向于白色和淡蓝色，使其更容易与壁纸融合
        const weights = [0.2, 0.35, 0.3, 0.1, 0.05];
        
        // 加权随机选择
        const rand = Math.random();
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (rand < sum) return colors[i];
        }
        
        return colors[0]; // 默认
    }
    
    /**
     * 动画循环函数
     */
    animate() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新和绘制每个粒子
        for (const particle of this.particles) {
            // 移动粒子 (z轴决定移动速度，创造视差效果)
            particle.z -= particle.speed * 0.1;
            
            // 当粒子移出屏幕时，将其重置到远处
            if (particle.z <= 0) {
                particle.z = 10;
                particle.x = Math.random() * this.canvas.width;
                particle.y = Math.random() * this.canvas.height;
            }
            
            // 计算透视效果
            const scale = 1 / particle.z;
            const x3d = particle.x * scale;
            const y3d = particle.y * scale;
            const size = particle.size * scale;
            
            // 根据深度设置不透明度
            const opacity = particle.opacity * scale * 1.8;
            
            // 绘制粒子
            this.ctx.beginPath();
            this.ctx.arc(x3d, y3d, size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${opacity})`;
            this.ctx.fill();
        }
        
        // 继续动画循环
        if (this.isRunning) {
            this.raf = requestAnimationFrame(this.animate.bind(this));
        }
    }
    
    /**
     * 开始粒子动画
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    /**
     * 停止粒子动画
     */
    stop() {
        this.isRunning = false;
        if (this.raf) {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 保存当前粒子的速度和其他特性
        const savedParticles = this.particles.map(p => ({
            speed: p.speed,
            color: p.color,
            opacity: p.opacity
        }));
        
        // 更新画布大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 重新初始化粒子，保持原有特性
        this.initialize(savedParticles);
        
        // 如果当前在运行，确保继续动画
        if (this.isRunning && !this.raf) {
            this.animate();
        }
    }
}

// 导出粒子系统类以便在其他文件中使用
export default ParticleSystem; 