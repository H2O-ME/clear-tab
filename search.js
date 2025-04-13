import CryptoUtil from './crypto-util.js';

export default class SearchAPI {
    constructor() {
        this.API_URL = 'https://open.bigmodel.cn/api/paas/v4';
        
        
        this._keyParts = {
            p1: CryptoUtil.obscureData('0ed7db8a'),
            p2: CryptoUtil.obscureData('20fd4b6f'),
            p3: CryptoUtil.obscureData('9a0e2011'),
            p4: CryptoUtil.obscureData('efb557f7'),
            p5: CryptoUtil.obscureData('.stnKl4X'),
            p6: CryptoUtil.obscureData('PxSZYZr1B')
        };
        
        this._apiKey = null; 
    }
    
    get API_KEY() {
        if (!this._apiKey) {
            try {
                this._apiKey = CryptoUtil.getApiKey();
            } catch (e) {
                console.error('API 密钥获取错误');
                this._apiKey = ''; 
            }
        }
        return this._apiKey;
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Client-Version': `${new Date().getFullYear()}.${new Date().getMonth() + 1}`,
            'X-Request-Time': Date.now().toString()
        };
        
        headers['Authorization'] = this.API_KEY;
        
        return headers;
    }

    async verifyApiKey() {
        return await CryptoUtil.verifyApiKey();
    }

    async getAIResponse(query, onWebResults, onContent, onComplete) {
        try {
            // 验证 API 密钥
            const keyVerified = await this.verifyApiKey();
            if (!keyVerified) {
                throw new Error('API 密钥验证失败');
            }
            
            // 添加超时处理
            const timeout = 30000; // 30秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            // 调用Bing搜索API获取网络搜索结果
            const bingSearchUrl = `https://api.pearktrue.cn/api/bingsearch/?search=${encodeURIComponent(query)}`;
            const bingSearchResponse = await fetch(bingSearchUrl, {
                method: 'GET',
                signal: controller.signal
            });

            const bingSearchResult = await bingSearchResponse.json();
            
            if (bingSearchResult.code === 200 && bingSearchResult.data && bingSearchResult.data.length > 0) {
                // 将Bing搜索结果转换为所需格式，确保结果是扁平化的数组
                const formattedResults = bingSearchResult.data.map(item => ({
                    title: item.title,
                    content: item.abstract,
                    link: item.href,
                    media: 'Bing搜索', // 标记来源为Bing搜索
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

            // 获取 AI 回答
            const aiResponse = await fetch(`${this.API_URL}/assistant`, {
                method: 'POST',
                headers: this.getAuthHeaders(), 
                body: JSON.stringify({
                    assistant_id: "659e54b1b8006379b4b2abd6",
                    model: "glm-4-assistant",
                    messages: [{
                        role: 'user',
                        content: [{
                            type: 'text',
                            text: query
                        }]
                    }],
                    stream: true
                })
            });

            const reader = aiResponse.body.getReader();
            let content = '';
            let isFirstChunk = true;
            
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            if (line.includes('[DONE]')) continue;
                            
                            const data = JSON.parse(line.slice(6));
                            if (data.choices?.[0]?.delta?.content) {
                                const newContent = data.choices[0].delta.content;
                                content += newContent;
                                
                                // 确保有足够的内容再开始显示
                                if (content.length > 10 || !isFirstChunk) {
                                    if (onContent) {
                                        onContent(content);
                                    }
                                    isFirstChunk = false;
                                }
                            }
                        } catch (e) {
                            console.error('解析 SSE 数据失败:', e);
                        }
                    }
                }
            }

            if (onComplete) {
                onComplete(content);
            }

        } catch (error) {
            console.error('AI响应失败:', error);
            throw error;
        }
    }

    async generateMindMap(content) {
        try {
            const processedContent = content
                .replace(/【\d+†source】/g, '')
                .split('## 参考资料')[0]
                .split('\n')
                .filter(line => line.trim())
                .join('\n')
                .trim();
            
            const response = await fetch(`${this.API_URL}/assistant`, {
                method: 'POST',
                headers: {
                    'Authorization': this.API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assistant_id: "664e0cade018d633146de0d2",
                    model: "glm-4-assistant",
                    messages: [{
                        role: 'user',
                        content: [{
                            type: 'text',
                            text: `请根据以下内容生成思维导图：\n\n${processedContent}`
                        }]
                    }],
                    stream: true
                })
            });

            const reader = response.body.getReader();
            let mindMapUrl = '';
            let lastContent = '';
            
            while (true) {
                const {done, value} = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            if (line.includes('[DONE]')) continue;
                            
                            const data = JSON.parse(line.slice(6));
                            if (data.choices?.[0]?.delta?.content) {
                                lastContent += data.choices[0].delta.content;
                                const matches = lastContent.match(/!\[.*?\]\((https:\/\/sfile\.chatglm\.cn\/markmap\/[^)\s]+)\)/);
                                if (matches) {
                                    mindMapUrl = matches[1];
                                }
                            }
                        } catch (e) {
                            console.error('解析思维导图数据失败:', e);
                        }
                    }
                }
            }
            
            return mindMapUrl || null;
        } catch (error) {
            console.error('生成思维导图失败:', error);
            return null;
        }
    }

    // 从标题中提取时间
    extractTime(title) {
        const timeMatch = title.match(/发布时间：(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
        return timeMatch ? timeMatch[1] : '';
    }

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

    formatUrl(url) {
        // Implementation of formatUrl method
    }

    formatTime(time) {
        // Implementation of formatTime method
    }
} 