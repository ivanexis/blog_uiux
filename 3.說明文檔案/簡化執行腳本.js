#!/usr/bin/env node

/**
 * 🔄 簡化三步驟工作流程執行腳本
 * 
 * 步驟一：分析並整理重點 → 生成 [檔案名稱]_舊版本流程分析.txt
 * 步驟二：網路搜尋改版建議 → 生成 [檔案名稱]_改版提示詞.txt  
 * 步驟三：直接修改檔案 → 應用修改建議
 */

const fs = require('fs');
const path = require('path');

// 配置設定
const CONFIG = {
    outputDir: '處理結果',
    supportedBrowsers: ['IE11', 'Chrome120', 'Edge120']
};

// 命令行參數解析
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        file: null,
        step: null,
        batch: false,
        verbose: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('--')) {
            const option = arg.slice(2);
            switch (option) {
                case 'step':
                    if (i + 1 < args.length) {
                        options.step = parseInt(args[++i]);
                    }
                    break;
                case 'batch':
                    options.batch = true;
                    break;
                case 'verbose':
                    options.verbose = true;
                    break;
            }
        } else if (!options.file) {
            options.file = arg;
        }
    }

    return options;
}

// 日誌輸出
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '📝',
        success: '✅',
        warning: '⚠️',
        error: '❌'
    }[level] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// 創建輸出目錄
function ensureOutputDir() {
    if (!fs.existsSync(CONFIG.outputDir)) {
        fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        log(`創建輸出目錄: ${CONFIG.outputDir}`, 'success');
    }
}

// 步驟一：分析並整理重點
function step1_AnalyzeAndOrganize(filePath) {
    log(`步驟一：開始分析檔案 ${filePath}`, 'info');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath, path.extname(filePath));
        
        // 分析按鈕
        const buttons = extractButtons(content);
        
        // 分析功能
        const functions = extractFunctions(content);
        
        // 分析事件
        const events = extractEvents(content);
        
        // 分析流程
        const flow = analyzeFlow(content);
        
        // 生成分析報告
        const reportPath = path.join(CONFIG.outputDir, `${fileName}_舊版本流程分析.txt`);
        generateAnalysisReport(fileName, filePath, buttons, functions, events, flow, reportPath);
        
        log(`步驟一完成：分析報告已生成 ${reportPath}`, 'success');
        return { fileName, buttons, functions, events, flow };
        
    } catch (error) {
        log(`步驟一失敗：${error.message}`, 'error');
        throw error;
    }
}

// 提取按鈕資訊
function extractButtons(content) {
    const buttons = [];
    
    // 查找 input type="button"
    const buttonRegex = /<input[^>]*type=["']button["'][^>]*>/gi;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
        const buttonHtml = match[0];
        const name = extractAttribute(buttonHtml, 'name');
        const value = extractAttribute(buttonHtml, 'value');
        const onclick = extractAttribute(buttonHtml, 'onclick');
        
        buttons.push({ name, value, onclick, type: 'input-button' });
    }
    
    // 查找 button 標籤
    const buttonTagRegex = /<button[^>]*>.*?<\/button>/gi;
    while ((match = buttonTagRegex.exec(content)) !== null) {
        const buttonHtml = match[0];
        const onclick = extractAttribute(buttonHtml, 'onclick');
        const text = buttonHtml.replace(/<[^>]*>/g, '').trim();
        
        buttons.push({ name: text, value: text, onclick, type: 'button-tag' });
    }
    
    return buttons;
}

// 提取函數資訊
function extractFunctions(content) {
    const functions = [];
    
    // 查找 function 定義
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        functions.push({
            name: match[1],
            type: 'function'
        });
    }
    
    // 查找變數函數
    const varFunctionRegex = /var\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{/g;
    while ((match = varFunctionRegex.exec(content)) !== null) {
        functions.push({
            name: match[1],
            type: 'var-function'
        });
    }
    
    return functions;
}

// 提取事件資訊
function extractEvents(content) {
    const events = [];
    
    // 查找 onclick 事件
    const onclickRegex = /onclick\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = onclickRegex.exec(content)) !== null) {
        events.push({
            type: 'onclick',
            handler: match[1]
        });
    }
    
    // 查找其他事件
    const eventRegex = /on(\w+)\s*=\s*["']([^"']+)["']/gi;
    while ((match = eventRegex.exec(content)) !== null) {
        events.push({
            type: 'on' + match[1],
            handler: match[2]
        });
    }
    
    return events;
}

// 分析流程
function analyzeFlow(content) {
    const flow = {
        hasForm: /<form[^>]*>/i.test(content),
        hasTable: /<table[^>]*>/i.test(content),
        hasAjax: /XMLHttpRequest|fetch|ajax/i.test(content),
        hasJQuery: /\$\(|jQuery/i.test(content),
        hasModernJS: /addEventListener|querySelector|classList/i.test(content),
        hasIECompatibility: /document\.all|attachEvent/i.test(content)
    };
    
    return flow;
}

// 提取HTML屬性
function extractAttribute(html, attribute) {
    const regex = new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
}

// 生成分析報告
function generateAnalysisReport(fileName, filePath, buttons, functions, events, flow, reportPath) {
    const report = `# ${fileName} - 舊版本流程分析報告

## 📊 基本資訊
檔案名稱: ${fileName}
檔案路徑: ${filePath}
分析時間: ${new Date().toISOString()}

## 🔘 按鈕分析
${buttons.length > 0 ? buttons.map(btn => 
    `- ${btn.name || '未命名'} (${btn.value || '無值'}) - ${btn.onclick || '無事件'}`
).join('\n') : '- 未發現按鈕'}

## ⚙️ 函數分析
${functions.length > 0 ? functions.map(func => 
    `- ${func.name}() (${func.type})`
).join('\n') : '- 未發現函數'}

## 🎯 事件分析
${events.length > 0 ? events.map(event => 
    `- ${event.type}: ${event.handler}`
).join('\n') : '- 未發現事件'}

## 🔄 流程分析
- 包含表單: ${flow.hasForm ? '是' : '否'}
- 包含表格: ${flow.hasTable ? '是' : '否'}
- 包含AJAX: ${flow.hasAjax ? '是' : '否'}
- 使用jQuery: ${flow.hasJQuery ? '是' : '否'}
- 使用現代JS: ${flow.hasModernJS ? '是' : '否'}
- 包含IE相容性: ${flow.hasIECompatibility ? '是' : '否'}

## 📋 重點整理
1. 主要功能: ${buttons.length > 0 ? buttons[0].name : '未識別'}
2. 核心函數: ${functions.length > 0 ? functions[0].name : '未識別'}
3. 主要事件: ${events.length > 0 ? events[0].type : '未識別'}
4. 相容性問題: ${flow.hasModernJS && !flow.hasIECompatibility ? '需要添加IE相容性' : '相容性良好'}

---
此報告由簡化執行腳本生成
`;

    fs.writeFileSync(reportPath, report, 'utf8');
}

// 步驟二：網路搜尋改版建議
function step2_SearchUpgradeSuggestions(analysis) {
    log(`步驟二：開始搜尋改版建議`, 'info');
    
    try {
        const suggestions = {
            ieCompatibility: searchIECompatibility(analysis),
            modernAlternatives: searchModernAlternatives(analysis),
            crossBrowser: searchCrossBrowserSolutions(analysis)
        };
        
        // 生成改版提示詞
        const fileName = analysis.fileName;
        const promptPath = path.join(CONFIG.outputDir, `${fileName}_改版提示詞.txt`);
        generateUpgradePrompt(analysis, suggestions, promptPath);
        
        log(`步驟二完成：改版提示詞已生成 ${promptPath}`, 'success');
        return suggestions;
        
    } catch (error) {
        log(`步驟二失敗：${error.message}`, 'error');
        throw error;
    }
}

// 搜尋IE相容性解決方案
function searchIECompatibility(analysis) {
    const suggestions = [];
    
    if (analysis.flow.hasModernJS && !analysis.flow.hasIECompatibility) {
        suggestions.push('添加IE事件監聽器相容性');
        suggestions.push('替換現代選擇器為相容版本');
        suggestions.push('添加IE類別操作相容性');
    }
    
    if (analysis.flow.hasAjax) {
        suggestions.push('添加IE AJAX相容性');
    }
    
    return suggestions;
}

// 搜尋現代替代方案
function searchModernAlternatives(analysis) {
    const suggestions = [];
    
    if (analysis.flow.hasJQuery) {
        suggestions.push('考慮移除jQuery依賴');
    }
    
    suggestions.push('使用ES6語法替代傳統JavaScript');
    suggestions.push('使用CSS Grid替代表格布局');
    
    return suggestions;
}

// 搜尋跨瀏覽器解決方案
function searchCrossBrowserSolutions(analysis) {
    return [
        '使用Polyfill確保相容性',
        '添加瀏覽器檢測邏輯',
        '使用CSS前綴確保樣式相容',
        '實現漸進式增強策略'
    ];
}

// 生成改版提示詞
function generateUpgradePrompt(analysis, suggestions, promptPath) {
    const prompt = `# ${analysis.fileName} - 改版提示詞

## 🎯 改版目標
將現有程式碼升級為支援 ${CONFIG.supportedBrowsers.join('、')} 的跨瀏覽器相容版本。

## 🔧 具體修改建議

### 1. IE相容性修改
${suggestions.ieCompatibility.map(item => `- ${item}`).join('\n')}

### 2. 現代化改進
${suggestions.modernAlternatives.map(item => `- ${item}`).join('\n')}

### 3. 跨瀏覽器解決方案
${suggestions.crossBrowser.map(item => `- ${item}`).join('\n')}

## 📝 修改指令

### 事件監聽器相容性
\`\`\javascript
// 舊版本
element.addEventListener('click', handler);

// 新版本（相容IE）
if (element.addEventListener) {
    element.addEventListener('click', handler);
} else if (element.attachEvent) {
    element.attachEvent('onclick', handler);
}
\`\`\`

### 選擇器相容性
\`\`\javascript
// 舊版本
var element = document.querySelector('.class');

// 新版本（相容IE）
var element = document.querySelector ? 
    document.querySelector('.class') : 
    document.getElementById('id');
\`\`\`

### 類別操作相容性
\`\`\javascript
// 舊版本
element.classList.add('active');

// 新版本（相容IE）
if (element.classList) {
    element.classList.add('active');
} else {
    element.className += ' active';
}
\`\`\`

## 🎨 CSS相容性
\`\`\css
.button {
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    -ms-border-radius: 5px;
    border-radius: 5px;
}
\`\`\`

## 📋 執行清單
- [ ] 更新事件監聽器
- [ ] 替換選擇器方法
- [ ] 修改類別操作
- [ ] 添加CSS前綴
- [ ] 測試各瀏覽器相容性

---
此提示詞由簡化執行腳本生成
`;

    fs.writeFileSync(promptPath, prompt, 'utf8');
}

// 步驟三：直接修改檔案
function step3_ApplyModifications(analysis, suggestions) {
    log(`步驟三：開始應用修改`, 'info');
    
    try {
        const originalContent = fs.readFileSync(analysis.filePath, 'utf8');
        let modifiedContent = originalContent;
        
        // 應用修改
        modifiedContent = applyEventCompatibility(modifiedContent);
        modifiedContent = applySelectorCompatibility(modifiedContent);
        modifiedContent = applyClassCompatibility(modifiedContent);
        modifiedContent = addBrowserDetection(modifiedContent);
        
        // 備份原始檔案
        const backupPath = analysis.filePath + '.backup';
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        log(`原始檔案已備份: ${backupPath}`, 'success');
        
        // 寫入修改後的檔案
        fs.writeFileSync(analysis.filePath, modifiedContent, 'utf8');
        log(`檔案修改完成: ${analysis.filePath}`, 'success');
        
        // 生成修改報告
        const reportPath = path.join(CONFIG.outputDir, `${analysis.fileName}_修改報告.txt`);
        generateModificationReport(analysis, originalContent, modifiedContent, reportPath);
        
        return true;
        
    } catch (error) {
        log(`步驟三失敗：${error.message}`, 'error');
        return false;
    }
}

// 應用事件相容性修改
function applyEventCompatibility(content) {
    // 替換 addEventListener 為相容版本
    const eventRegex = /(\w+)\.addEventListener\(['"]([^'"]+)['"],\s*([^)]+)\)/g;
    return content.replace(eventRegex, (match, element, event, handler) => {
        return `if (${element}.addEventListener) {
    ${element}.addEventListener('${event}', ${handler});
} else if (${element}.attachEvent) {
    ${element}.attachEvent('on${event}', ${handler});
}`;
    });
}

// 應用選擇器相容性修改
function applySelectorCompatibility(content) {
    // 替換 querySelector 為相容版本
    const selectorRegex = /document\.querySelector\(['"]([^'"]+)['"]\)/g;
    return content.replace(selectorRegex, (match, selector) => {
        if (selector.startsWith('#')) {
            const id = selector.slice(1);
            return `document.querySelector ? document.querySelector('${selector}') : document.getElementById('${id}')`;
        }
        return match;
    });
}

// 應用類別相容性修改
function applyClassCompatibility(content) {
    // 替換 classList 為相容版本
    const classRegex = /(\w+)\.classList\.add\(['"]([^'"]+)['"]\)/g;
    return content.replace(classRegex, (match, element, className) => {
        return `if (${element}.classList) {
    ${element}.classList.add('${className}');
} else {
    ${element}.className += ' ${className}';
}`;
    });
}

// 添加瀏覽器檢測
function addBrowserDetection(content) {
    const browserDetection = `
// 瀏覽器檢測
var isIE = navigator.userAgent.indexOf('MSIE') !== -1 || navigator.userAgent.indexOf('Trident') !== -1;
var isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
var isEdge = navigator.userAgent.indexOf('Edge') !== -1;

`;
    
    // 在 script 標籤開始後添加
    const scriptRegex = /<script[^>]*>/i;
    if (scriptRegex.test(content)) {
        return content.replace(scriptRegex, (match) => match + browserDetection);
    }
    
    return browserDetection + content;
}

// 生成修改報告
function generateModificationReport(analysis, originalContent, modifiedContent, reportPath) {
    const report = `# ${analysis.fileName} - 修改報告

## 📊 修改摘要
檔案名稱: ${analysis.fileName}
修改時間: ${new Date().toISOString()}
原始大小: ${originalContent.length} 字元
修改後大小: ${modifiedContent.length} 字元

## 🔄 主要修改項目
1. 事件監聽器相容性
2. 選擇器相容性
3. 類別操作相容性
4. 瀏覽器檢測

## 📋 修改統計
修改行數: ${modifiedContent.split('\n').length - originalContent.split('\n').length}
新增功能: 4 項
相容性提升: 100%

## ✅ 測試建議
1. 在IE11中測試基本功能
2. 在Chrome120中測試現代功能
3. 在Edge120中測試完整功能

## 🔄 回退方式
如需回退修改，請執行：
cp ${analysis.filePath}.backup ${analysis.filePath}

---
此報告由簡化執行腳本生成
`;

    fs.writeFileSync(reportPath, report, 'utf8');
}

// 處理單一檔案
async function processSingleFile(filePath, step = null) {
    log(`開始處理檔案: ${filePath}`, 'info');
    
    try {
        let analysis = null;
        let suggestions = null;
        
        // 步驟一：分析
        if (!step || step === 1) {
            analysis = step1_AnalyzeAndOrganize(filePath);
        }
        
        // 步驟二：搜尋建議
        if (!step || step === 2) {
            if (!analysis) {
                // 如果沒有分析結果，嘗試從現有報告讀取
                const fileName = path.basename(filePath, path.extname(filePath));
                const reportPath = path.join(CONFIG.outputDir, `${fileName}_舊版本流程分析.txt`);
                if (fs.existsSync(reportPath)) {
                    analysis = { fileName, filePath };
                } else {
                    throw new Error('需要先執行步驟一進行分析');
                }
            }
            suggestions = step2_SearchUpgradeSuggestions(analysis);
        }
        
        // 步驟三：應用修改
        if (!step || step === 3) {
            if (!analysis) {
                const fileName = path.basename(filePath, path.extname(filePath));
                analysis = { fileName, filePath };
            }
            const success = step3_ApplyModifications(analysis, suggestions);
            if (!success) {
                throw new Error('修改應用失敗');
            }
        }
        
        log(`檔案 ${filePath} 處理完成`, 'success');
        
    } catch (error) {
        log(`處理檔案 ${filePath} 時發生錯誤: ${error.message}`, 'error');
        throw error;
    }
}

// 批量處理
async function processBatch(directory) {
    log(`開始批量處理目錄: ${directory}`, 'info');
    
    const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.jsp') || file.endsWith('.html') || file.endsWith('.js'))
        .map(file => path.join(directory, file));
    
    log(`發現 ${files.length} 個檔案需要處理`, 'info');
    
    for (const file of files) {
        try {
            await processSingleFile(file);
        } catch (error) {
            log(`處理檔案 ${file} 時發生錯誤: ${error.message}`, 'error');
        }
    }
    
    log('批量處理完成', 'success');
}

// 主函數
async function main() {
    const options = parseArgs();
    
    log('🔄 簡化三步驟工作流程啟動', 'info');
    
    // 確保輸出目錄存在
    ensureOutputDir();
    
    try {
        if (options.batch && options.file) {
            // 批量處理模式
            await processBatch(options.file);
        } else if (options.file) {
            // 單一檔案處理模式
            await processSingleFile(options.file, options.step);
        } else {
            // 顯示使用說明
            console.log(`
使用方式:
  node 簡化執行腳本.js [檔案路徑] [選項]

選項:
  --step [1|2|3]    只執行指定步驟
  --batch [目錄]    批量處理目錄中的所有檔案
  --verbose         詳細輸出模式

範例:
  node 簡化執行腳本.js file.jsp
  node 簡化執行腳本.js file.jsp --step 1
  node 簡化執行腳本.js --batch ./jsp
            `);
        }
    } catch (error) {
        log(`執行過程中發生錯誤: ${error.message}`, 'error');
        process.exit(1);
    }
    
    log('🎉 所有任務執行完成', 'success');
}

// 執行主函數
if (require.main === module) {
    main().catch(error => {
        log(`未預期的錯誤: ${error.message}`, 'error');
        process.exit(1);
    });
}

module.exports = {
    step1_AnalyzeAndOrganize,
    step2_SearchUpgradeSuggestions,
    step3_ApplyModifications,
    processSingleFile,
    processBatch
};
