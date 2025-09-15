#!/usr/bin/env node

/**
 * 🧹 檔案清理腳本
 * 
 * 功能：
 * 1. 識別重複和冗餘檔案
 * 2. 備份重要檔案
 * 3. 整理檔案結構
 * 4. 生成清理報告
 */

const fs = require('fs');
const path = require('path');

// 配置設定
const CONFIG = {
    backupDir: '備份檔案',
    archiveDir: '歸檔檔案',
    keepFiles: [
        '優化工作流程_統一版本.md',
        '自動化執行腳本.js',
        '瀏覽器相容性解決方案_整合版.md',
        '工作流程模式_整合版.md',
        '快速開始指南.md',
        '檔案清理腳本.js'
    ],
    archiveFiles: [
        '1.基本資訊.txt',
        '主控台.txt',
        '改版資訊.txt',
        '工作流程模式.txt',
        '期望新工作型態.txt',
        '自動化流程說明包.txt',
        'IE_Chrome_Edge三種瀏覽器通用寫法研究報告.txt',
        '漸進式修復執行計劃.txt',
        '瀏覽器相容性解決方案.txt',
        '過時程式碼分析報告.txt'
    ]
};

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

// 創建目錄
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`創建目錄: ${dirPath}`, 'success');
    }
}

// 備份檔案
function backupFile(filePath, backupDir) {
    try {
        const fileName = path.basename(filePath);
        const backupPath = path.join(backupDir, fileName);
        
        fs.copyFileSync(filePath, backupPath);
        log(`備份檔案: ${fileName}`, 'success');
        return true;
    } catch (error) {
        log(`備份檔案失敗: ${filePath} - ${error.message}`, 'error');
        return false;
    }
}

// 移動檔案到歸檔目錄
function archiveFile(filePath, archiveDir) {
    try {
        const fileName = path.basename(filePath);
        const archivePath = path.join(archiveDir, fileName);
        
        fs.renameSync(filePath, archivePath);
        log(`歸檔檔案: ${fileName}`, 'success');
        return true;
    } catch (error) {
        log(`歸檔檔案失敗: ${filePath} - ${error.message}`, 'error');
        return false;
    }
}

// 分析檔案內容相似度
function analyzeFileSimilarity(files) {
    const similarities = [];
    
    for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
            try {
                const content1 = fs.readFileSync(files[i], 'utf8');
                const content2 = fs.readFileSync(files[j], 'utf8');
                
                const similarity = calculateSimilarity(content1, content2);
                if (similarity > 0.3) { // 30% 相似度閾值
                    similarities.push({
                        file1: path.basename(files[i]),
                        file2: path.basename(files[j]),
                        similarity: similarity
                    });
                }
            } catch (error) {
                log(`分析檔案相似度失敗: ${files[i]} vs ${files[j]}`, 'warning');
            }
        }
    }
    
    return similarities;
}

// 計算文字相似度
function calculateSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
}

// 生成清理報告
function generateCleanupReport(stats, similarities) {
    const report = `# 🧹 檔案清理報告

## 📊 清理統計
- **總檔案數**: ${stats.totalFiles}
- **保留檔案**: ${stats.keptFiles}
- **歸檔檔案**: ${stats.archivedFiles}
- **備份檔案**: ${stats.backedUpFiles}
- **清理時間**: ${new Date().toISOString()}

## 📁 檔案分類

### 保留檔案（核心檔案）
${CONFIG.keepFiles.map(file => `- ✅ ${file}`).join('\n')}

### 歸檔檔案（舊版本）
${CONFIG.archiveFiles.map(file => `- 📦 ${file}`).join('\n')}

## 🔍 相似度分析
${similarities.length > 0 ? similarities.map(sim => 
    `- **${sim.file1}** 與 **${sim.file2}** 相似度: ${(sim.similarity * 100).toFixed(1)}%`
).join('\n') : '- 未發現高相似度檔案'}

## 📋 建議

### 1. 檔案結構優化
- ✅ 已整合重複內容到核心檔案
- ✅ 已歸檔舊版本檔案
- ✅ 已建立清晰的檔案結構

### 2. 使用建議
- 使用 \`優化工作流程_統一版本.md\` 作為主要參考
- 使用 \`自動化執行腳本.js\` 進行自動化處理
- 參考 \`瀏覽器相容性解決方案_整合版.md\` 解決相容性問題

### 3. 維護建議
- 定期檢查 \`處理結果/\` 目錄
- 清理過期的處理結果
- 更新瀏覽器支援列表

## 🔄 恢復方式
如需恢復歸檔檔案，請執行：
\`\`\bash
# 恢復單一檔案
cp 歸檔檔案/檔案名.txt ./

# 恢復所有歸檔檔案
cp 歸檔檔案/* ./
\`\`\`

---
*此報告由檔案清理腳本生成*
`;

    const reportPath = '檔案清理報告.md';
    fs.writeFileSync(reportPath, report, 'utf8');
    log(`清理報告已生成: ${reportPath}`, 'success');
}

// 主清理函數
function performCleanup() {
    log('🧹 開始檔案清理作業', 'info');
    
    const stats = {
        totalFiles: 0,
        keptFiles: 0,
        archivedFiles: 0,
        backedUpFiles: 0
    };
    
    // 創建必要目錄
    ensureDir(CONFIG.backupDir);
    ensureDir(CONFIG.archiveDir);
    
    // 獲取所有檔案
    const allFiles = fs.readdirSync('.')
        .filter(file => fs.statSync(file).isFile())
        .filter(file => !file.startsWith('.'));
    
    stats.totalFiles = allFiles.length;
    log(`發現 ${stats.totalFiles} 個檔案`, 'info');
    
    // 分析檔案相似度
    log('分析檔案相似度...', 'info');
    const similarities = analyzeFileSimilarity(allFiles);
    
    // 處理每個檔案
    for (const file of allFiles) {
        if (CONFIG.keepFiles.includes(file)) {
            // 保留檔案
            stats.keptFiles++;
            log(`保留檔案: ${file}`, 'info');
        } else if (CONFIG.archiveFiles.includes(file)) {
            // 歸檔檔案
            if (backupFile(file, CONFIG.backupDir)) {
                stats.backedUpFiles++;
            }
            if (archiveFile(file, CONFIG.archiveDir)) {
                stats.archivedFiles++;
            }
        } else {
            // 其他檔案保持不變
            log(`保持檔案: ${file}`, 'info');
        }
    }
    
    // 生成清理報告
    generateCleanupReport(stats, similarities);
    
    log('🎉 檔案清理完成', 'success');
    log(`統計: 保留 ${stats.keptFiles} 個, 歸檔 ${stats.archivedFiles} 個, 備份 ${stats.backedUpFiles} 個`, 'info');
}

// 預覽模式（不實際執行清理）
function previewCleanup() {
    log('👀 預覽清理作業（不實際執行）', 'info');
    
    const allFiles = fs.readdirSync('.')
        .filter(file => fs.statSync(file).isFile())
        .filter(file => !file.startsWith('.'));
    
    console.log('\n📋 檔案分類預覽:');
    console.log('\n✅ 保留檔案:');
    CONFIG.keepFiles.forEach(file => {
        if (allFiles.includes(file)) {
            console.log(`  - ${file}`);
        }
    });
    
    console.log('\n📦 歸檔檔案:');
    CONFIG.archiveFiles.forEach(file => {
        if (allFiles.includes(file)) {
            console.log(`  - ${file}`);
        }
    });
    
    console.log('\n📁 其他檔案:');
    allFiles.forEach(file => {
        if (!CONFIG.keepFiles.includes(file) && !CONFIG.archiveFiles.includes(file)) {
            console.log(`  - ${file}`);
        }
    });
    
    console.log('\n⚠️  注意: 這是預覽模式，不會實際移動檔案');
}

// 恢復歸檔檔案
function restoreArchived() {
    log('🔄 恢復歸檔檔案', 'info');
    
    if (!fs.existsSync(CONFIG.archiveDir)) {
        log('歸檔目錄不存在', 'error');
        return;
    }
    
    const archivedFiles = fs.readdirSync(CONFIG.archiveDir);
    
    for (const file of archivedFiles) {
        const sourcePath = path.join(CONFIG.archiveDir, file);
        const targetPath = file;
        
        try {
            fs.renameSync(sourcePath, targetPath);
            log(`恢復檔案: ${file}`, 'success');
        } catch (error) {
            log(`恢復檔案失敗: ${file} - ${error.message}`, 'error');
        }
    }
    
    log('🎉 歸檔檔案恢復完成', 'success');
}

// 主函數
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'preview':
            previewCleanup();
            break;
        case 'restore':
            restoreArchived();
            break;
        case 'cleanup':
        default:
            performCleanup();
            break;
    }
}

// 顯示使用說明
function showHelp() {
    console.log(`
🧹 檔案清理腳本使用說明

使用方式:
  node 檔案清理腳本.js [命令]

命令:
  cleanup    執行清理作業（預設）
  preview    預覽清理作業（不實際執行）
  restore    恢復歸檔檔案
  help       顯示此說明

範例:
  node 檔案清理腳本.js preview    # 預覽清理
  node 檔案清理腳本.js cleanup    # 執行清理
  node 檔案清理腳本.js restore    # 恢復檔案

注意:
  - 清理前會自動備份所有檔案
  - 歸檔檔案可隨時恢復
  - 建議先使用 preview 命令查看
    `);
}

// 執行主函數
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('help') || args.includes('--help') || args.includes('-h')) {
        showHelp();
    } else {
        main();
    }
}

module.exports = {
    performCleanup,
    previewCleanup,
    restoreArchived,
    analyzeFileSimilarity
};
