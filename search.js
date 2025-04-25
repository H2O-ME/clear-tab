export default class SearchAPI {
    constructor() {
        this.API_URL = 'https://api.pearktrue.cn/api/aisearch/';
        this.BING_SEARCH_URL = 'https://api.pearktrue.cn/api/bingsearch/';
    }

    /**
     * 获取AI搜索响应
     * @param {string} query 查询内容
     * @param {Function} onWebResults 网页结果回调函数
     * @param {Function} onContent 内容更新回调函数
     * @param {Function} onComplete 完成回调函数
     * @returns {Promise<Object>} 搜索结果对象
     */
    async getAIResponse(query, onWebResults, onContent, onComplete) {
        try {
            // 添加超时处理
            const timeout = 30000; // 30秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // 调用必应搜索API获取网络搜索结果
            const bingSearchUrl = `${this.BING_SEARCH_URL}?search=${encodeURIComponent(query)}`;
            const bingSearchResponse = await fetch(bingSearchUrl, {
                method: 'GET',
                signal: controller.signal
            });

            const bingSearchResult = await bingSearchResponse.json();
            
            if (bingSearchResult.code === 200 && bingSearchResult.data && bingSearchResult.data.length > 0) {
                // 将搜索结果转换为所需格式
                const formattedResults = bingSearchResult.data.map(item => ({
                    title: item.title,
                    content: item.abstract,
                    link: item.href,
                    media: 'Bing搜索',
                    time: this.extractTime(item.title) // 尝试从标题中提取时间
                }));

                if (onWebResults) {
                    onWebResults(formattedResults);
                }
            } else {
                // 如果搜索结果为空或请求失败
                if (onWebResults) {
                    onWebResults([]);
                }
            }

            clearTimeout(timeoutId);

            // 获取AI回答
            const aiSearchUrl = `${this.API_URL}?keyword=${encodeURIComponent(query)}`;
            const aiResponse = await fetch(aiSearchUrl, {
                method: 'GET',
                signal: controller.signal
            });

            const aiResult = await aiResponse.json();
            
            if (aiResult.code === 200 && aiResult.data && aiResult.data.text) {
                // 通知内容开始
                if (onContent) {
                    onContent('');
                }
                
                // 获取完整内容
                const content = aiResult.data.text;
                
                // 更新内容回调
                if (onContent) {
                    onContent(content);
                }
                
                // 获取相关问题和来源信息
                const relatedInfo = this.getRelatedInfo(aiResult);

                // 完成回调，传递相关问题和来源等参数
                if (onComplete) {
                    onComplete(content, relatedInfo.relatedQuestions, relatedInfo.sources, relatedInfo.api_source);
                }
                
                return {
                    content: content,
                    relatedQuestions: relatedInfo.relatedQuestions,
                    sources: relatedInfo.sources,
                    api_source: relatedInfo.api_source,
                    webResults: relatedInfo.sources.map(source => ({
                        title: source.title,
                        content: source.snippet,
                        link: source.link,
                        media: '搜索结果'
                    }))
                };
            } else {
                throw new Error('AI搜索返回数据格式错误');
            }
        } catch (error) {
            console.error('获取AI响应失败:', error);
            if (onComplete) {
                onComplete('');
            }
            throw error;
        }
    }

    /**
     * 获取相关问题和来源
     * @param {Object} aiResult API返回的结果对象
     * @returns {Object} 包含相关问题和来源的对象
     */
    getRelatedInfo(aiResult) {
        if (!aiResult || !aiResult.data) return { relatedQuestions: [], sources: [] };
        
        return {
            relatedQuestions: aiResult.data.related_questions || [],
            sources: aiResult.data.sources || [],
            api_source: aiResult.api_source || '官方API网:https://api.pearktrue.cn/'
        };
    }

    /**
     * 从标题中提取时间
     * @param {string} title 标题
     * @returns {string} 提取的时间字符串或空字符串
     */
    extractTime(title) {
        const timeMatch = title.match(/发布时间：(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : '';
    }

    /**
     * 显示网页搜索结果
     * @param {Array} results 结果数组
     * @param {HTMLElement} webResults 网页结果容器元素
     */
    displayWebResults(results, webResults) {
        webResults.innerHTML = results.map((result, index) => `
            <div class="search-result" data-index="${index}">
                <div class="result-content">
                    <h3>
                        <a href="${result.link}" target="_blank" rel="noopener noreferrer">
                            ${result.title}
                        </a>
                    </h3>
                    <div class="result-url">${this.formatUrl(result.link)}</div>
                    <p class="result-snippet">${result.content}</p>
                    <div class="result-meta">
                        ${result.time ? `<span class="result-time"><i class="far fa-clock"></i> ${this.formatTime(result.time)}</span>` : ''}
                        ${result.media ? `<span class="result-source"><i class="far fa-newspaper"></i> ${result.media}</span>` : ''}
                    </div>
                </div>
                <div class="icon-links">
                    <a href="https://www.bing.com/search?q=${encodeURIComponent(result.title)}" class="icon-link" target="_blank">
                        <img src="https://www.bing.com/favicon.ico" alt="Bing" class="icon">
                    </a>
                </div>
            </div>
        `).join('');
    }

    /**
     * 格式化URL显示
     * @param {string} url URL字符串
     * @returns {string} 格式化后的URL
     */
    formatUrl(url) {
        try {
            const urlObj = new URL(url);
            let formattedUrl = urlObj.hostname;
            if (urlObj.pathname && urlObj.pathname !== '/') {
                formattedUrl += urlObj.pathname.length > 20 
                    ? urlObj.pathname.substring(0, 20) + '...' 
                    : urlObj.pathname;
            }
            return formattedUrl;
        } catch (e) {
            return url;
        }
    }

    /**
     * 格式化时间显示
     * @param {string} time 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatTime(time) {
        try {
            const date = new Date(time);
            if (isNaN(date.getTime())) return time;
            
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return time;
        }
    }
}