// ==UserScript==
// @name         DeepSeek Chat Exporter (Markdown & PDF)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  监听并导出 DeepSeek 聊天内容为 Markdown 或 PDF，严格按照搜索提示、思考链、正式回答顺序
// @author       HSyuf/Blueberrycongee/HQ337653
// @match        https://chat.deepseek.com/*
// @grant        GM_addStyle
// @grant        GM_download
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
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
                        answerContent += `$$${tex.textContent.trim()}$$`; // 用$$包裹所有公式
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
        const fixedMdContent = mdContent;

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

        const printContent = `
  <html>
    <head>
      <title>DeepSeek Chat Export</title>
      <script type="text/javascript" async
        src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js">
      </script>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
        h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        h3 { color: #34495e; margin-top: 20px; }
        .ai-answer {
          color: #2c3e50; /* 深蓝色 */
          margin: 15px 0;
        }
        .ai-chain {
          color: #7f8c8d; /* 灰色 */
          font-size: 0.9em; /* 字体小一号 */
          margin: 10px 0;
        }
        hr { border: 0; border-top: 1px solid #eee; margin: 25px 0; }
      </style>
    </head>
    <body>
      ${mdContent
        .replace(/\n### (.*?)\n/g, '<h3>$1</h3>\n') // 修正 Markdown 标题
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")  // 解析加粗
        .replace(/\*(.*?)\*/g, "<i>$1</i>")      // 解析斜体
        .replace(/\n/g, '<br>')                 // 换行
        .replace(/\$\$(.*?)\$\$/g, ' <span class="math">\\($1\\)</span> ') // 公式前后加空格
        .replace(/---/g, '</div><hr>')}
      <script>
        window.onload = function() { MathJax.typeset(); };
      </script>
    </body>
  </html>
`;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    }


      let __exportPNGLock = false;  // 全局锁，防止重复点击
  function exportPNG() {
      if (__exportPNGLock) return;  // 如果当前正在导出，跳过
      __exportPNGLock = true;

      const chatContainer = document.querySelector(config.chatContainerSelector);
      if (!chatContainer) {
          alert("未找到聊天容器！");
          __exportPNGLock = false;
          return;
      }

      // 创建沙盒容器
      const sandbox = document.createElement('iframe');
      sandbox.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: 800px;
          height: ${window.innerHeight}px;
          border: 0;
          visibility: hidden;
      `;
      document.body.appendChild(sandbox);

      // 深度克隆与样式处理
      const cloneNode = chatContainer.cloneNode(true);
      cloneNode.style.cssText = `
          width: 800px !important;
          transform: none !important;
          overflow: visible !important;
          position: static !important;
          background: white !important;
          max-height: none !important;
          padding: 20px !important;
          margin: 0 !important;
          box-sizing: border-box !important;
      `;

      // 清理干扰元素，排除图标
      ['button', 'input', '.ds-message-feedback-container', '.eb23581b.dfa60d66'].forEach(selector => {
          cloneNode.querySelectorAll(selector).forEach(el => el.remove());
      });

      // 数学公式修复
      cloneNode.querySelectorAll('.katex-display').forEach(mathEl => {
          mathEl.style.transform = 'none !important';
          mathEl.style.position = 'relative !important';
      });

      // 注入沙盒
      sandbox.contentDocument.body.appendChild(cloneNode);
      sandbox.contentDocument.body.style.background = 'white';

      // 等待资源加载
      const waitReady = () => Promise.all([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 300))]);

      waitReady().then(() => {
          return html2canvas(cloneNode, {
              scale: 2,
              useCORS: true,
              logging: true,
              backgroundColor: "#FFFFFF"
          });
      }).then(canvas => {
          canvas.toBlob(blob => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${config.exportFileName}_${Date.now()}.png`;
              a.click();
              setTimeout(() => {
                  URL.revokeObjectURL(url);
                  sandbox.remove();
              }, 1000);
          }, 'image/png');
      }).catch(err => {
          console.error('截图失败:', err);
          alert(`导出失败：${err.message}`);
      }).finally(() => {
          __exportPNGLock = false;
      });
  }

    // =====================
  // 创建导出菜单
  // =====================
  function createExportMenu() {
      const menu = document.createElement("div");
      menu.className = "ds-exporter-menu";
      menu.innerHTML = `
          <button class="export-btn" id="md-btn">导出为 Markdown</button>
          <button class="export-btn" id="pdf-btn">导出为 PDF</button>
          <button class="export-btn" id="png-btn">导出图片</button>
      `;

      menu.querySelector("#md-btn").addEventListener("click", exportMarkdown);
      menu.querySelector("#pdf-btn").addEventListener("click", exportPDF);
      menu.querySelector("#png-btn").addEventListener("click", exportPNG);
      document.body.appendChild(menu);
  }

  // =====================
  // 样式
  // =====================
  GM_addStyle(`
  .ds-exporter-menu {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      background: rgba(255, 255, 255, 0.95) url('data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="%23ff9a9e" opacity="0.2"/></svg>');
      border: 2px solid #ff93ac;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(255, 65, 108, 0.3);
      backdrop-filter: blur(8px);
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start; /* 确保按钮左对齐 */
  }

  .export-btn {
      background: linear-gradient(145deg, #ff7eb3 0%, #ff758c 100%);
      color: white;
      border: 2px solid #fff;
      border-radius: 12px;
      padding: 12px 24px;
      font-family: 'Comic Sans MS', cursive;
      font-size: 16px;
      text-shadow: 1px 1px 2px rgba(255, 65, 108, 0.5);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: pointer;
      width: 200px; /* 定义按钮宽度 */
      margin-bottom: 8px; /* 添加按钮之间的间距 */
  }

  .export-btn::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent 33%, rgba(255,255,255,0.3) 50%, transparent 66%);
      transform: rotate(45deg);
      animation: sparkle 3s infinite linear;
  }

  .export-btn:hover {
      transform: scale(1.05) rotate(-2deg);
      box-shadow: 0 6px 24px rgba(255, 65, 108, 0.4);
      background: linear-gradient(145deg, #ff6b9d 0%, #ff677e 100%);
  }

  .export-btn:active {
      transform: scale(0.95) rotate(2deg);
  }

  #md-btn::after {
      content: '📁';
      margin-left: 8px;
      filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.2));
  }

  #pdf-btn::after {
      content: '📄';
      margin-left: 8px;
  }

  #png-btn::after {
      content: '🖼️';
      margin-left: 8px;
  }

  @keyframes sparkle {
      0% { transform: translate(-100%, -100%) rotate(45deg); }
      100% { transform: translate(100%, 100%) rotate(45deg); }
  }

  /* 添加卡通对话框提示 */
  .ds-exporter-menu::before {
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 8px 16px;
      border-radius: 10px;
      border: 2px solid #ff93ac;
      font-family: 'Comic Sans MS', cursive;
      color: #ff6b9d;
      white-space: nowrap;
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  }

  /* 添加漂浮的装饰元素 */
  .ds-exporter-menu::after {
      content: '';
      position: absolute;
      width: 30px;
      height: 30px;
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff93ac" d="M12,2.5L15.3,8.6L22,9.7L17,14.5L18.5,21L12,17.5L5.5,21L7,14.5L2,9.7L8.7,8.6L12,2.5Z"/></svg>');
      top: -20px;
      right: -15px;
      animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
      0%, 100% { transform: translateY(0) rotate(10deg); }
      50% { transform: translateY(-10px) rotate(-10deg); }
  }
`);



  // =====================
  // 初始化
  // =====================
  function init() {
      const checkInterval = setInterval(() => {
          if (document.querySelector(config.chatContainerSelector)) {
              clearInterval(checkInterval);
              createExportMenu();
          }
      }, 500);
  }

  init();
})();
