// ==UserScript==
// @name         DeepSeek Chat Exporter (Markdown Ordered)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  监听并导出 DeepSeek 聊天内容为 Markdown，严格按照搜索提示、思考链、正式回答顺序
// @author       YourName
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_download
// ==/UserScript==

(function () {
    'use strict';

    // =====================
    // 配置
    // =====================
    const config = {
        chatContainerSelector: '.dad65929', // 聊天框容器
        userClassPrefix: 'fa81',             // 用户消息 class 前缀
        aiClassPrefix: 'f9bf7997',           // AI消息相关 class 前缀
        aiReplyContainer: 'edb250b1',        // AI回复的主要容器
        searchHintSelector: '.a6d716f5.db5991dd', // 搜索/思考时间
        thinkingChainSelector: '.e1675d8b',  // 思考链
        finalAnswerSelector: 'div.ds-markdown.ds-markdown--block', // 正式回答
        exportButtonText: '导出为 Markdown',
        exportFileName: 'DeepSeek_Chat_Export',
    };

    // ---------------------
    // 判断是否为用户消息
    // ---------------------
    function isUserMessage(node) {
        return node.classList.contains(config.userClassPrefix);
    }

    // ---------------------
    // 判断是否为 AI 回复
    // ---------------------
    function isAIMessage(node) {
        return node.classList.contains(config.aiClassPrefix);
    }

    // ---------------------
    // 提取搜索/思考时间标签
    // ---------------------
    function extractSearchOrThinking(node) {
        const hintNode = node.querySelector(config.searchHintSelector);
        return hintNode ? `**${hintNode.textContent.trim()}**` : null;
    }

    // ---------------------
    // 提取思考链
    // ---------------------
    function extractThinkingChain(node) {
        const thinkingNode = node.querySelector(config.thinkingChainSelector);
        return thinkingNode ? `**思考链**\n${thinkingNode.textContent.trim()}` : null;
    }

    // ---------------------
    // 提取正式回答
    // ---------------------
    function extractFinalAnswer(node) {
        const answerNode = node.querySelector(config.finalAnswerSelector);
        return answerNode ? `**正式回答**\n${answerNode.textContent.trim()}` : null;
    }

    // ---------------------
    // 遍历聊天框内容，提取信息
    // ---------------------
    function getOrderedMessages() {
        const messages = [];
        const chatContainer = document.querySelector(config.chatContainerSelector);
        if (!chatContainer) {
            console.error('未找到聊天容器');
            return messages;
        }

        for (const node of chatContainer.children) {
            if (isUserMessage(node)) {
                messages.push(`**用户：**\n${node.textContent.trim()}`);
            } else if (isAIMessage(node)) {
                let output = '';

                // 查找 edb250b1（完整AI回答结构）
                const aiReplyContainer = node.querySelector(`.${config.aiReplyContainer}`);
                if (aiReplyContainer) {
                    const searchHint = extractSearchOrThinking(aiReplyContainer);
                    if (searchHint) output += `${searchHint}\n\n`;

                    const thinkingChain = extractThinkingChain(aiReplyContainer);
                    if (thinkingChain) output += `${thinkingChain}\n\n`;
                } else {
                    // 如果 edb250b1 不存在，直接查找搜索/思考时间
                    const searchHint = extractSearchOrThinking(node);
                    if (searchHint) output += `${searchHint}\n\n`;
                }

                // 查找正式回答
                const finalAnswer = extractFinalAnswer(node);
                if (finalAnswer) output += `${finalAnswer}\n\n`;

                if (output.trim()) {
                    messages.push(output.trim());
                }
            }
        }

        console.log("按照DOM顺序提取的消息：", messages);
        return messages;
    }

    // ---------------------
    // 生成 Markdown 内容
    // ---------------------
    function exportMarkdown() {
        const messages = getOrderedMessages();
        if (messages.length === 0) {
            alert("未找到聊天记录！");
            return;
        }

        const mdContent = messages.join('\n\n---\n\n');

        console.log("生成的 Markdown 内容：", mdContent);

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.exportFileName}_${Date.now()}.md`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // =====================
    // 添加导出按钮
    // =====================
    function createExportMenu() {
        const menu = document.createElement('div');
        menu.className = 'ds-exporter-menu';
        menu.innerHTML = `<button class="export-btn" id="md-btn">导出为 Markdown</button>`;
        menu.querySelector('#md-btn').addEventListener('click', exportMarkdown);
        document.body.appendChild(menu);
    }

    // =====================
    // 样式注入
    // =====================
    GM_addStyle(`
        .ds-exporter-menu {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(255, 255, 255, 0.9);
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .export-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .export-btn:hover {
            background: #45a049;
        }
    `);

    // =====================
    // 初始化脚本
    // =====================
    function init() {
        const checkInterval = setInterval(() => {
            if (document.querySelector('.fa81')) {
                clearInterval(checkInterval);
                createExportMenu();
            }
        }, 500);

        setTimeout(() => {
            if (!document.querySelector('.ds-exporter-menu')) {
                alert('无法初始化导出菜单，请刷新页面后重试');
            }
        }, 5000);
    }

    // 启动脚本
    init();
})();
