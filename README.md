# 月下誓約檔案庫：密碼加密版

GitHub Pages 保留現有 `main / (root)` 發佈方式及 `/lunarvow/` 網址。公開倉庫只保留密碼入口、少量解鎖／建置程式、測試及一份加密封包，不需要 Private 倉庫、GitHub Pro 或 Actions Secret。

**合併本次加密發佈後，等待原有 Pages build and deployment 成功才會上鎖。** 正式密碼另存於私人密碼檔，沒有寫入 Git、URL、程式或建置日誌。

## 密碼與可編輯原始碼

本機 `.private/access-password.txt` 為一行入站密碼（至少 16 字元）。可用 `LUNAR_VAULT_PASSWORD_FILE` 指向另一個私人檔案，或在私人環境注入 `LUNAR_VAULT_PASSWORD`。請保管交付的密碼檔；密碼不會由網站傳到伺服器。

`.private/source/` 是完整可編輯備份，全部原始網站檔案、資料、圖片、音樂、舊建置程式及測試也可從加密封包還原。`.private/` 與 `.encrypted-dist/` 均排除於 Git。恢復到另一台電腦時，先把密碼檔放到上述位置，再執行：

```sh
npm run recover:source
```

還原只接受全新目錄，不會覆蓋已有原始碼。請在 `.private/source/` 修改網站；內容／素材更新後，在該目錄執行原有 `scripts/build-news.cjs` 及 `scripts/build-preload-manifest.cjs`，再於倉庫根目錄執行：

```sh
npm run build:encrypted
npm run prepare:publish
npm test
```

檢查通過後只提交公開加密輸出及建置程式。密碼或原始碼缺失、素材不齊、完整性驗證失敗時不會改成發佈明文。更改私人密碼檔後重新建置與提交，即可更改新部署的入站密碼。

## 保護範圍

完整原始碼先 gzip 壓縮，再用 AES-256-GCM 加密；PBKDF2-HMAC-SHA-256 使用 600,000 次迭代、每次建置獨立的 256-bit salt 及 96-bit IV，並將建置編號納入 AAD。瀏覽器先驗證完整密文，再在記憶體解壓與提供原有網址；JSON、圖片、音樂及分頁在未解鎖時均無明文公開副本。

需要 HTTPS／localhost、JavaScript、Web Crypto、Service Worker 及 gzip DecompressionStream。原有三語、十秒入站及只在按掣後播放音樂的行為保留。按「鎖定檔案」會清除已開啟分頁的暫存金鑰並返回入口。金鑰可暫存在已解鎖分頁的 sessionStorage，以恢復被瀏覽器回收的背景程序；密碼本身及明文檔案不會寫入 CacheStorage 或 IndexedDB。

持有密碼者仍可檢視、保存及分享解鎖後的內容與代碼。此為共用密碼加密，不是逐人帳戶。已公開的歷史提交、舊副本及第三方快取不能靠新部署收回；此更新不改寫 Git 歷史。素材與遊戲相關權利屬原權利人。

## 檢查

公開 CI 驗證發佈目錄、加密／還原及使用測試內容的瀏覽器流程。版面回歸另從既有公開歷史還原與目前封包相同的原網站，在臨時目錄用測試密碼驗證 12 種闊度及三語，結束後刪除；不讀取正式密碼、不上傳明文或解鎖畫面。完整原網站回歸可在本機有私人備份時執行 `npm run test:source`。

解鎖後的音樂、鎖定及動畫控制集中於頁尾，採正常排版，避免浮動控制遮住內容。
