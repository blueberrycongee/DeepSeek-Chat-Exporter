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
    if (!answerNode) return null;

    let answerContent = '';

    // 遍历ds-markdown--block中的每个p、h3、hr和数学公式
    const elements = answerNode.querySelectorAll('.ds-markdown--block p, .ds-markdown--block h3, .katex-display.ds-markdown-math, hr');

    elements.forEach((element) => {
        // 如果是段落<p>，遍历其中的text和数学公式
        if (element.tagName.toLowerCase() === 'p') {
            element.childNodes.forEach((childNode) => {
                if (childNode.nodeType === Node.TEXT_NODE) {
                    answerContent += childNode.textContent.trim();  // 文本节点
                } else if (childNode.classList && childNode.classList.contains('katex')) {
                    // KaTeX公式提取
                    const tex = childNode.querySelector('annotation[encoding="application/x-tex"]');
                    if (tex) {
                        answerContent += `$$$${tex.textContent.trim()}$$$`; // 用$$包裹所有公式
                    }
                } else if (childNode.tagName === 'STRONG') {
                    // <strong>转换为Markdown加粗 (**)
                    answerContent += `**${childNode.textContent.trim()}**`;
                } else if (childNode.tagName === 'EM') {
                    // <em>转换为Markdown斜体 (*)
                    answerContent += `*${childNode.textContent.trim()}*`;
                } else if (childNode.tagName === 'A') {
                    // <a>转换为Markdown链接 [text](url)
                    const href = childNode.getAttribute('href');
                    answerContent += `[${childNode.textContent.trim()}](${href})`;
                } else if (childNode.nodeType === Node.ELEMENT_NODE) {
                    // 对于其他未知标签，提取其文本
                    answerContent += childNode.textContent.trim();
                }
            });
            answerContent += '\n\n';  // 段落结束后添加换行
        }
        // 如果是h3标签，处理为Markdown标题
        else if (element.tagName.toLowerCase() === 'h3') {
            answerContent += `### ${element.textContent.trim()}\n\n`;  // 将h3转为Markdown的三级标题
        }
        // 处理块级数学公式
        else if (element.classList.contains('katex-display')) {
            const tex = element.querySelector('annotation[encoding="application/x-tex"]');
            if (tex) {
                answerContent += `$$${tex.textContent.trim()}$$\n\n`;  // 块级数学公式
            }
        }
        // 如果是<hr>标签，转换为Markdown分割线
        else if (element.tagName.toLowerCase() === 'hr') {
            answerContent += '\n---\n';  // 转换为Markdown分割线
        }
    });

    // 添加Markdown标题
    return `**正式回答**\n${answerContent.trim()}`;
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

        // Fix for inline math and block math rendering
        const fixedMdContent = mdContent.replace(/(\*\*.*?\*\*)/g, '<strong>$1</strong>') // Ensures **bold** in Markdown
        .replace(/\(\s*([^)]*)\s*\)/g, '\\($1\\)') // Inline math: \( f(x,y) \)
        .replace(/\$\$\s*([^$]*)\s*\$\$/g, '$$$1$$'); // Block math: $$ \frac{dy}{dx} = \frac{y^2}{x^2 + 1} $$

        const blob = new Blob([fixedMdContent], { type: 'text/markdown' });
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

        // Fix for inline math and block math rendering in HTML for PDF
        const fixedMdContent = mdContent.replace(/(\*\*.*?\*\*)/g, '<strong>$1</strong>') // Bold text
        .replace(/\(\s*([^)]*)\s*\)/g, '\\($1\\)') // Inline math
        .replace(/\$\$\s*([^$]*)\s*\$\$/g, '$$$1$$'); // Block math

        const printContent = `
      <html>
        <head>
          <title>DeepSeek Chat Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
            .ai-answer { color: #1a7f37; margin: 15px 0; }
            .ai-chain { color: #666; font-style: italic; margin: 10px 0; }
            hr { border: 0; border-top: 1px solid #eee; margin: 25px 0; }
          </style>
        </head>
        <body>
          ${fixedMdContent.replace(/\*\*用户：\*\*\n/g, '<h2>用户提问</h2><div class="user-question">')
        .replace(/\*\*正式回答\*\*\n/g, '</div><h2>AI 回答</h2><div class="ai-answer">')
        .replace(/\*\*思考链\*\*\n/g, '</div><h2>思维链</h2><div class="ai-chain">')
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

  // =====================
  // 添加导出菜单
  // =====================
  function createExportMenu() {
    const menu = document.createElement("div");
    menu.className = "ds-exporter-menu";
    menu.innerHTML = `
      <button class="export-btn" id="md-btn">导出为 Markdown</button>
      <button class="export-btn" id="pdf-btn">导出为 PDF</button>
    `;

    menu.querySelector("#md-btn").addEventListener("click", exportMarkdown);
    menu.querySelector("#pdf-btn").addEventListener("click", exportPDF);
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
      background: rgba(255, 255, 255, 0.95);
      padding: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      gap: 8px;
      backdrop-filter: blur(4px);
    }
    .export-btn {
      background: #2196F3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .export-btn:hover {
      background: #1976D2;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
  `);

  // =====================
  // 初始化脚本
  // =====================
  function init() {
    const checkInterval = setInterval(() => {
      if (document.querySelector(".fa81")) {
        clearInterval(checkInterval);
        createExportMenu();
      }
    }, 500);
  }

  init();
})();
