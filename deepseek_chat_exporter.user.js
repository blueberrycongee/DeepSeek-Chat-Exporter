// ==UserScript==
// @name         DeepSeek Chat Exporter (Markdown & PDF)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  监听并导出 DeepSeek 聊天内容为 Markdown 或 PDF，严格按照搜索提示、思考链、正式回答顺序
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
        exportFileName: 'DeepSeek_Chat_Export',
    };

    function isUserMessage(node) {
        return node.classList.contains(config.userClassPrefix);
    }

    function isAIMessage(node) {
        return node.classList.contains(config.aiClassPrefix);
    }

    function extractSearchOrThinking(node) {
        const hintNode = node.querySelector(config.searchHintSelector);
        return hintNode ? `**${hintNode.textContent.trim()}**` : null;
    }

    function extractThinkingChain(node) {
        const thinkingNode = node.querySelector(config.thinkingChainSelector);
        return thinkingNode ? `**思考链**\n${thinkingNode.textContent.trim()}` : null;
    }

    function extractFinalAnswer(node) {
        const answerNode = node.querySelector(config.finalAnswerSelector);
        return answerNode ? `**正式回答**\n${answerNode.textContent.trim()}` : null;
    }

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
                const aiReplyContainer = node.querySelector(`.${config.aiReplyContainer}`);
                if (aiReplyContainer) {
                    const searchHint = extractSearchOrThinking(aiReplyContainer);
                    if (searchHint) output += `${searchHint}\n\n`;
                    const thinkingChain = extractThinkingChain(aiReplyContainer);
                    if (thinkingChain) output += `${thinkingChain}\n\n`;
                } else {
                    const searchHint = extractSearchOrThinking(node);
                    if (searchHint) output += `${searchHint}\n\n`;
                }
                const finalAnswer = extractFinalAnswer(node);
                if (finalAnswer) output += `${finalAnswer}\n\n`;
                if (output.trim()) {
                    messages.push(output.trim());
                }
            }
        }
        return messages;
    }

    function generateMdContent() {
        const messages = getOrderedMessages();
        return messages.length ? messages.join('\n\n---\n\n') : '';
    }

    function exportMarkdown() {
        const mdContent = generateMdContent();
        if (!mdContent) {
            alert("未找到聊天记录！");
            return;
        }
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${config.exportFileName}_${Date.now()}.md`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    function exportPDF() {
        const mdContent = generateMdContent();
        if (!mdContent) return;

        const printContent = `
  <html>
        <head>
          <title>DeepSeek Chat Export</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
            .ai-answer { color: #1a7f37; margin: 15px 0; }
            .ai-chain { color: #666; font-style: italic; margin: 10px 0; }
            hr { border: 0; border-top: 1px solid #eee; margin: 25px 0; }
          </style>
        </head>
    <body>
      ${mdContent.replace(/\*\*用户：\*\*\n/g, '<h2>用户提问</h2><div class="user-question">')
        .replace(/\*\*正式回答\*\*\n/g, '</div><h2>AI 回答</h2><div class="ai-answer">')
        .replace(/\*\*思考链\*\*\n/g, '</div><h2>思维链</h2><div class="ai-chain">')
        .replace(/\*\*([^**]+)\*\*/g, '<span class="search-hint">$1</span>') // This line ensures **text** gets bolded properly for search/thinking hints
        .replace(/\n/g, '<br>')
        .replace(/---/g, '</div><hr>')}
    </body>
  </html>
`;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }

    function createExportMenu() {
        const menu = document.createElement('div');
        menu.className = 'ds-exporter-menu';
        menu.innerHTML = `
            <button class="export-btn" id="md-btn">导出为 Markdown</button>
            <button class="export-btn" id="pdf-btn">导出为 PDF</button>
        `;
        menu.querySelector('#md-btn').addEventListener('click', exportMarkdown);
        menu.querySelector('#pdf-btn').addEventListener('click', exportPDF);
        document.body.appendChild(menu);
    }

    GM_addStyle(`
        .ds-exporter-menu { position: fixed; top: 20px; right: 20px; z-index: 9999; background: rgba(255, 255, 255, 0.9); padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
        .export-btn { background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .export-btn:hover { background: #45a049; }
    `);

    function init() {
        const checkInterval = setInterval(() => { if (document.querySelector('.fa81')) { clearInterval(checkInterval); createExportMenu(); } }, 500);
    }

    init();
})();
