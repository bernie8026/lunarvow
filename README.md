# 月下誓約檔案庫

Bernie's Honkai Realm：以月下誓約為主題的靜態網站，包含攻略、劇情、角色圖鑑和圖片收藏。

網站可直接部署到 GitHub Pages，無需建置。開發時請用本機 HTTP 伺服器預覽；角色圖鑑需要透過 HTTP 讀取 `data/characters.json`。

## 驗證網站

需要 Node.js 20 或更新版本：

```sh
npm install
npx playwright install chromium
npm test
```

測試會啟動並關閉自己的本機伺服器，檢查八個頁面的手機及桌面排版、鍵盤導覽、減少動態效果模式、無 JavaScript 的導覽、圖鑑搜尋和重試、三語切換、儲存受限時的行為，以及音樂播放狀態。測試用的 Playwright 不會載入到正式網站。

若電腦已有 Microsoft Edge，可設定 `BROWSER_CHANNEL=msedge` 使用它執行測試。

音樂只會在按播放後載入；音量及播放位置會在瀏覽器允許時儲存在本機。繁簡轉換設有內建後備字表，外部轉換服務暫時無法連線時仍可切換語言。
