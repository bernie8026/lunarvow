# 月下誓約檔案庫：通行密鑰版

入口只接受已登記嘅 WebAuthn 通行密鑰。撳「使用通行密鑰」後，可用 Face ID、Touch ID、裝置 PIN 或相容安全金鑰確認。月下同個人作品集共用 `bernie8026.github.io` 嘅通行密鑰登記；新增密鑰只限擁有人發出嘅一次性邀請，專用入口 `unlock.html#passkey-setup=…` 會立即移除網址入面嘅邀請。

新封包每次建置用獨立嘅 256 位元隨機金鑰同 AES-256-GCM 加密。Cloudflare 驗證成功後，只發出月下封包所需嘅封套金鑰；佢同作品集嘅金鑰分開，作品集舊密碼同月下舊密碼都解唔開新封包。Git 只包含加密封包、公開入口、建置工具同測試。

## 正式切換

保留 GitHub Pages 嘅 `main / (root)` 發佈方式同 `/lunarvow/` 網址。合併之前：

1. 喺真實裝置試用已登記嘅通行密鑰，準備第二個可用通行密鑰或擁有人重新發邀請嘅方法，並備份私人封套設定。
2. 用 [作品集 Passkey 分支嘅共用 Cloudflare Worker](https://github.com/bernie8026/lunarvow-united/blob/passkey-only/cloudflare/README.md) 準備部署。保留現有通行密鑰登記同 Durable Object，將私人設定嘅 `archiveId` 設為 `LUNAR_VAULT_ARCHIVE_ID`，將 `archiveKeyB64` 加入 Worker secret `LUNAR_VAULT_KEY_B64`。唔好用作品集封包金鑰。
3. Worker 同兩個網站入口要一齊安排切換：停用 Worker 舊密碼路徑後，舊作品集入口嘅密碼掣會失效。驗證兩邊都可用通行密鑰，再確認 Pages 發佈成功。

舊月下密碼只用於本機由舊版 v2 遷移或還原舊備份。已下載嘅舊封包、公開 Git 歷史同第三方副本無法由新分支收回。已解鎖嘅使用者仍可保存瀏覽器收到嘅內容。

## 私人備份與建置

`.private/lunar-vault-access.json` 或 `LUNAR_PASSKEY_ACCESS_FILE` 指定嘅私人檔案須包含 `authOrigin`、`archiveId` 同 `archiveKeyB64`。保管獨立備份，唔好提交到 Git。此檔案可離線還原新版封包：

```sh
npm run recover:source
```

還原只接受全新目錄，唔會覆蓋已有嘅 `.private/source/`。喺該目錄修改網站，更新原有新聞及預載清單後，喺倉庫根目錄執行：

```sh
npm run build:encrypted
npm run prepare:publish
npm test
npm run test:layout
```

`npm run setup:passkeys` 只用於由 v2 本機遷移：會讀取私人舊密碼檔及獨立月下封套設定，驗證舊包，再將新版寫入 `.encrypted-dist/`。遷移成功先執行 `npm run prepare:publish`。缺少私人設定、素材唔齊或完整性驗證失敗時，工具會停止。

## 保護同檢查

網站依賴 HTTPS、JavaScript、Web Crypto、Service Worker 同 gzip 解壓。按「鎖定檔案」會清除解鎖分頁嘅暫存金鑰並返回入口。分頁可暫存金鑰以喚醒被瀏覽器回收嘅背景程序；明文網站唔會寫入 CacheStorage 或 IndexedDB。

公開 CI 用自製金鑰同 Chrome 虛擬通行密鑰測試封套、還原、訪問檔案、重新上鎖及七語入口。版面回歸從既有 Git 歷史提取固定測試版本，在臨時目錄測試 12 種闊度及三語，完成後清除。已安裝相鄰作品集倉庫嘅 Cloudflare 測試依賴後，亦可執行 `npm run test:integration` 測試實際驗證程式同兩個獨立封包。實體 Face ID、Touch ID 同跨裝置登入仍要喺你嘅裝置確認。

## 語言版本

支援繁體中文、English、简体中文、日本語、한국어、ไทย及Русский。入口及網站均使用原生下拉選單；選擇在本機保存並跨頁沿用。日、韓、泰、俄的離線翻譯包含首頁、攻略、劇情長文、相片庫、圖鑑介面、33 則既有新聞及控制文字；角色、裝備、活動專名保留可搜尋的原名。翻譯及原文均在加密封包內，不依賴線上翻譯服務。新聞內容與核對日期沿用原有資料，此更新只增加語言版本。
