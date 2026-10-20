# 月下網站密碼加密版

此流程將所有網站 HTML、CSS、JavaScript、JSON、角色圖片、相片及音樂加密後才部署。公開檔案只包括密碼入口、解鎖所需的少量程式及密文；原本圖片／資料網址不會保留明文副本。解鎖後由 Service Worker 在記憶體中解密，原有分頁、三語、十秒載入畫面、圖片及音樂沿用原網址。

**合併 PR 不代表網站已受保護。必須完成以下設定並成功部署；目前公開倉庫及現有網站仍然可讀。**

## 首次啟用

1. 確認帳戶方案支援由私人倉庫發佈 GitHub Pages。GitHub Free 的公開倉庫轉為私人時，Pages 會被取消發佈；不要在未確認方案／部署安排前切換。
2. 將原始碼倉庫設為 **Private**。加密部署會拒絕從公開倉庫執行，避免網站上鎖、原始碼卻仍然公開。
3. 在 **Settings → Secrets and variables → Actions → New repository secret** 新增 `LUNAR_VAULT_PASSWORD`。使用密碼管理器產生至少 20 個隨機字元；建置最低接受 16 個字元。不要將真實密碼貼到對話、程式、命令列參數、`.env` 或提交紀錄。
4. 在 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。
5. 在 **Actions → Deploy encrypted archive → Run workflow** 選擇 `main` 執行。只上傳 `.encrypted-dist/`，成功後以無痕視窗檢查首頁、內頁、圖片及 JSON 網址。

之後私人倉庫的 `main` 更新會重新加密部署。密碼缺失、太短、素材缺漏、消息／預載清單過期或原始碼仍公開，建置會失敗而不發佈明文後備版。請勿再把原始碼根目錄或 `main` 分支直接作為 Pages 發佈來源。

倉庫可見性、帳戶方案與 Secret 需要倉庫擁有人在 GitHub 私下設定；此改動不會替你更改帳單或倉庫可見性。

## 解鎖與鎖定

- 密碼在本機瀏覽器衍生解密金鑰，毋須傳到伺服器。瀏覽器／HTTPS／Service Worker 不可用時，內容維持鎖定。
- 同一瀏覽器工作階段可切換分頁。金鑰暫存在已解鎖分頁的 `sessionStorage` 及 Service Worker 記憶體，密碼本身不會儲存。瀏覽器停用儲存時，僅在記憶體保持解鎖，背景程序停止後需要再次輸入密碼。
- 按「鎖定檔案」會清除本網站已開啟分頁的暫存金鑰、停止媒體並返回入口。解密回應使用 `Cache-Control: no-store`，程式不會將明文放入 Cache Storage 或 IndexedDB。
- 更改密碼：更新同名 GitHub Secret，再執行部署。每次建置重新產生 salt、IV 及檔名。已解鎖的訪客更新頁面後需要新密碼。

## 保護範圍

使用 AES-256-GCM，為每個檔案配置獨立的 96-bit 隨機 IV，並驗證密文完整性。PBKDF2-HMAC-SHA-256 使用 600,000 次迭代及每次建置獨立的 256-bit salt。檔案路徑與建置編號納入 AAD，檔案索引亦加密；密文檔名不暴露原始名稱。密文可被下載並離線猜密碼，所以強隨機密碼十分重要；前端限速不能防止離線破解。

這是共用密碼加密，並非逐人帳戶或伺服器登入權限。知道密碼的人可下載解鎖後的內容與前端代碼，也可以分享密碼或已解密檔案。入口的 HTML、樣式及解鎖程式必須公開，瀏覽器才可以工作。沒有 JavaScript 的訪客只會看到入口提示。

已被複製的公開內容、過往下載、公開 forks 或搜尋快取不能靠新部署收回。將原始碼設為私人只會限制之後的直接存取，不能撤銷第三方已持有的副本。

## 測試及本機建置

`npm run test:vault:unit` 驗證錯誤密碼、竄改、檔案交換、隨機 salt／IV、明文排除與缺檔時保留舊輸出。`npm run test:vault` 另外以本機 HTTP 預覽檢查實際網站解鎖、直接取檔、完整預載、跨頁、音樂 range、背景程序重啟和多分頁鎖定。CI 只使用測試用密碼，不會取得正式 Secret。

本機可在私人終端以隱藏輸入設定環境變數，然後執行 `npm run build:encrypted`。勿將真實密碼直接寫在命令內容；`.encrypted-dist/` 已排除於 Git。預覽需保留 `/lunarvow/` 路徑，或用 `VAULT_BASE_PATH` 指定其他目錄；正式部署須使用 HTTPS。

參考：

- [GitHub Pages 自訂工作流程與方案](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub 倉庫可見性及轉私人影響](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [MDN Web Crypto AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
- [OWASP PBKDF2 工作量](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2)
