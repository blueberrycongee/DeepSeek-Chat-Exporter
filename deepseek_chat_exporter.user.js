// ==UserScript==
// @name         DeepSeek Chat Exporter (Markdown Only)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  导出 DeepSeek 聊天记录为 Markdown 格式
// @author       YourName
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

// =====================
// 获取用户消息
// =====================
    function getUserMessages() {
        const chatContainer = document.querySelector('.fa81'); // 聊天记录的父级容器
        if (!chatContainer) {
            console.log("未找到聊天容器！");
            return [];
        }

        const userMessages = [];

        // 查找所有用户消息的节点
        const userMessageNodes = chatContainer.querySelectorAll('div.fbb737a4');

        // 遍历并提取每一条用户消息
        userMessageNodes.forEach(node => {
            const content = node.textContent.trim() || '[无内容]';
            userMessages.push({ content, type: 'user' });
        });

        console.log("提取的用户消息：", userMessages); // 打印调试信息
        return userMessages;
    }


    // =====================
    // 获取 AI 消息
    // =====================
    function getAiMessages() {
        const aiMessages = [];

        // 获取 AI 回答框消息
        const aiAnswers = Array.from(document.querySelectorAll('.f9bf7997.d7dc56a8.c05b5566')).map(msgNode => {
            const content = msgNode.textContent.trim() || '[无内容]';
            aiMessages.push({ content, type: 'ai_answer' }); // 标记为 AI 回答
        });

        // 获取 AI 思维链消息
        const aiChains = Array.from(document.querySelectorAll('.ecc93a3b')).map(msgNode => {
            const content = msgNode.textContent.trim() || '[无内容]';
            aiMessages.push({ content, type: 'ai_chain' }); // 标记为 AI 思维链
        });

        // 获取 AI 正式回复消息
        const aiFormalReplies = Array.from(document.querySelectorAll('.ds-markdown.ds-markdown--block')).map(msgNode => {
            const content = msgNode.textContent.trim() || '[无内容]';
            aiMessages.push({ content, type: 'ai_formal_reply' }); // 标记为 AI 正式回复
        });

        console.log("提取的 AI 消息：", aiMessages); // 打印调试信息
        return aiMessages;
    }

    // =====================
    // 导出为 Markdown 格式
    // =====================
    function exportMarkdown() {
        // 每次点击导出时重新获取对话记录
        const userMessages = getUserMessages(); // 获取用户消息
        const aiMessages = getAiMessages();     // 获取 AI 消息

        if (userMessages.length === 0 && aiMessages.length === 0) {
            alert("未找到聊天记录！");
            return;
        }

        // 合并用户消息和 AI 消息
        const allMessages = [...userMessages, ...aiMessages];

        // 生成 Markdown 格式的对话内容
        const mdContent = allMessages.map(msg => {
            if (msg.type === 'user') return `**用户：**\n${msg.content}`;
            if (msg.type === 'ai_formal_reply') return `**AI 回答：**\n${msg.content}`;
            if (msg.type === 'ai_answer') return `**AI 思维链：**\n${msg.content}`;
            return '';
        }).join('\n\n---\n\n');

        console.log("生成的 Markdown 内容：", mdContent); // 输出检查

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DeepSeek_Chat_${Date.now()}.md`;
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
