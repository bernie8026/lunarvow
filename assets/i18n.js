(() => {
    'use strict';

    const STORAGE_KEY = 'bhr-language';
    const SUPPORTED = ['zh-HK', 'en', 'zh-CN'];
    const DEFAULT_LANGUAGE = 'zh-HK';

    const HK = {
        'ARCHIVE SYSTEM // INITIALISING': '檔案系統 // 初始化中',
        'PERSONAL ARCHIVE / 2026': '私人檔案庫 / 2026',
        'HOME': '首頁',
        'LATEST': '最新',
        'ARCHIVE': '檔案',
        'PROFILE': '關於',
        'DATABASE ↗': '角色圖鑑 ↗',
        'SYSTEM ONLINE': '系統在線',
        'STORY ONLINE': '劇情系統在線',
        'FILE ONLINE': '檔案在線',
        'SECTION': '區段',
        "CAPTAIN'S PERSONAL DATABASE": '艦長私人資料庫',
        'LUNAR': '月下',
        'VOW': '誓約',
        'OPEN V8.7 GUIDE': '開啟 V8.7 攻略',
        'EXPLORE ARCHIVE': '瀏覽檔案庫',
        'THERESA // LUNAR VOW': '德麗莎 // 月下誓約',
        'CHARACTER FILE': '角色檔案',
        'TYPE': '屬性',
        'DAMAGE': '傷害',
        'STATUS': '狀態',
        'LIGHTNING / BLEED': '雷電 / 流血',
        'ASTRAL RING READY': '星之環已就緒',
        'SCROLL TO ACCESS': '向下捲動',
        'LAST DATA SYNC': '最後同步',
        'LUNAR VOW ARCHIVE': '月下誓約檔案庫',
        'STORY DATABASE': '劇情資料庫',
        'CAPTAIN LINE RECORDS': '艦長線紀錄',
        'LATEST TRANSMISSION': '最新傳輸',
        'NEW STORY': '新劇情',
        'FILE // STORY-00': '檔案 // STORY-00',
        'STORY ARCHIVE / FULL SPOILERS': '劇情檔案 / 完整劇透',
        'KIANA & FINALITY': '琪亞娜與終焉',
        'MARS / PART 2': '火星 / 第二部',
        'CAPTAINVERSE & LUNA': '艦長宇宙與月下',
        'ACCESS STORY ARCHIVE': '開啟劇情檔案',
        'ARCHIVE DIRECTORY': '檔案目錄',
        'TACTICAL RECORD': '戰術紀錄',
        'CHARACTER DATABASE': '角色資料庫',
        'VISUAL STORAGE': '影像收藏',
        'STORY ARCHIVE': '劇情檔案',
        'NARRATIVE LOG': '敘事紀錄',
        'GENERAL DATABASE': '綜合資料庫',
        'ADMINISTRATOR PROFILE': '管理者資料',
        'PRIMARY SUBJECT': '主要角色',
        'LANGUAGE': '語言',
        'PLATFORM': '平台',
        "CAPTAIN'S PERSONAL ARCHIVE": '艦長私人檔案庫',
        'BHR // SECURE LINK': 'BHR // 安全連線',
        'ACCESSING FILE': '開啟檔案中',
        'ACCESSING DATABASE': '載入角色資料庫',
        'TACTICAL RECORD // COMBAT ARCHIVE': '戰術紀錄 // 戰鬥檔案',
        'FILE / A-01 // GUIDE': '檔案 / A-01 // 攻略',
        'ARCHIVE OVERVIEW': '檔案總覽',
        '2026-07-17 // UPDATED': '2026-07-17 // 已更新',
        'ACCESS COMPLETE GUIDE →': '開啟完整攻略 →',
        'UPCOMING FILES': '即將新增',
        'LOCAL SCRATCHPAD': '本機草稿板',
        'ADD TEMPORARY NOTE': '加入暫存筆記',
        'VISUAL STORAGE // LUNAR VOW COLLECTION': '影像收藏 // 月下誓約',
        'FILE / A-03 // VISUAL': '檔案 / A-03 // 影像',
        'VISUAL INDEX': '影像索引',
        'CHARACTER VISUAL // LUNAR VOW: CRIMSON LOVE': '角色影像 // 月下誓約・予愛以心',
        'PERSONAL STORAGE // IMAGE FILE 001': '私人收藏 // 圖片檔案 001',
        'ARCHIVE NOTICE': '檔案提示',
        'GENERAL DATABASE // HONKAI IMPACT 3RD': '綜合資料庫 // 崩壞3rd',
        'FILE / A-04 // DATA': '檔案 / A-04 // 資料',
        'FILE 01 // OVERVIEW': '檔案 01 // 總覽',
        'NEW // STORY ARCHIVE': '新增 // 劇情檔案',
        'OPEN STORY ARCHIVE →': '開啟劇情檔案 →',
        'FILE 02 // SUBJECTS': '檔案 02 // 角色',
        'OPEN CHARACTER DATABASE →': '開啟角色資料庫 →',
        'FILE 03 // SYSTEMS': '檔案 03 // 系統',
        'NARRATIVE LOG // CAPTAINVERSE RECORD': '敘事紀錄 // 艦長宇宙',
        'FILE / A-05 // CAPTAIN': '檔案 / A-05 // 艦長線',
        'LOG 00 // OVERVIEW': '紀錄 00 // 總覽',
        'OPEN LUNAR VOW FILE →': '開啟月下誓約檔案 →',
        'LOG DIRECTORY': '紀錄目錄',
        'RELATED SUBJECTS': '相關人物',
        'CHARACTER DATABASE // HI3 ARCHIVE': '角色資料庫 // 崩壞3rd 檔案',
        'FILE / A-02 // DATABASE': '檔案 / A-02 // 資料庫',
        'DATABASE / 21 VISUAL FILES': '資料庫 / 21 個影像檔案',
        'DISPLAYING': '顯示中',
        'FILES': '個檔案',
        'SEARCH QUERY': '搜尋',
        'CHARACTER VISUAL': '角色影像',
        'SOURCE FILE ↗': '來源檔案 ↗',
        'CLOSE FILE': '關閉檔案',
        'VALKYRIE // CHARACTER FILE': '女武神 // 角色檔案',
        'NO MATCHING FILE // 搵唔到相符角色': '沒有相符檔案 // 搵唔到相符角色',
        'DATABASE OFFLINE // 無法載入角色資料': '資料庫離線 // 無法載入角色資料',
        'CORE GUIDE // VER. 8.7+ ASTRAL RING': '核心攻略 // Ver. 8.7+ 星之環',
        'SUBJECT / LV-001 // CRIMSON LOVE': '角色 / LV-001 // 予愛以心',
        'STORY ARCHIVE // HONKAI IMPACT 3RD': '劇情檔案 // 崩壞3rd',
        'FILE / S-00 // COMPLETE OVERVIEW': '檔案 / S-00 // 完整總覽',
        'FULL SPOILER WARNING': '完整劇透警告',
        'QUICK ACCESS': '快速索引',
        'WORLD SETTING': '世界設定',
        'ORGANISATION 01': '組織 01',
        'ORGANISATION 02': '組織 02',
        'ORGANISATION 03': '組織 03',
        'PART 1': '第一部',
        'PART 1.5': '第一部半',
        'PART 2 // CURRENT': '第二部 // 連載中',
        'CAPTAINVERSE': '艦長宇宙',
        'READING ORDER': '閱讀次序',
        'OFFICIAL REFERENCES': '官方資料',
        'EARTH → MOON // CHAPTER 1–35': '地球 → 月球 // 第 1–35 章',
        'SALT SNOW CITY → PHOSPHORUS': '鹽雪聖城 → 磷砂',
        'LUOXING / MARS BUBBLE WORLDS': '洛星 / 火星世界泡',
        'ALTERNATE CONTINUITY // BUBBLE UNIVERSES': '獨立時間線 // 世界泡',
        'OPEN CAPTAINVERSE INDEX →': '開啟艦長宇宙索引 →',
        'OPEN FILE ↗': '開啟檔案 ↗',
        'Herrscher of Finality': '終焉之律者',
        'Herrscher of Origin': '始源之律者',
        'Herrscher of Truth': '真理之律者',
        'Vermilion Knight: Eclipse': '真紅騎士・月蝕',
        'Celestial Hymn': '神恩頌歌',
        'Prinzessin der Verurteilung!': '斷罪皇女！！',
        'Flame Sakitama': '真炎幸魂',
        'Miss Pink Elf♪': '粉色妖精小姐♪',
        'Infinite Ouroboros': '無限・噬界之蛇',
        'Golden Diva': '黃金・璀耀之歌',
        'Disciplinary Perdition': '戒律・深罪之檻',
        'Helical Contraption': '螺旋・愚戲之匣',
        'Starry Impression': '繁星・繪世之卷',
        'Reverist Calico': '空夢・掠集之獸',
        'Jade Knight': '玉騎士・月痕',
        'Valkyrie Quicksand': '女武神・熱砂',
        'Terminal Aide 0017': '終末協理 0017',
        "Sweet 'n' Spicy": '甜辣女孩',
        'Miracle ☆ Magical Girl': '奇蹟☆魔法少女',
        'Mad Pleasure: Shadowbringer': '享樂狂宴・邀影',
        'Lunar Vow: Crimson Love': '月下誓約・予愛以心'
    };

    const EN = {
        '返回首頁': 'Return to home',
        '開啟導覽選單': 'Open navigation menu',
        '主要導覽': 'Primary navigation',
        '頁面區段': 'Page sections',
        '月下誓約・予愛以心': 'Lunar Vow: Crimson Love',
        '記錄角色、劇情、實戰攻略，同每一個值得收藏嘅瞬間。呢度唔係百科全書，而係艦長為月下建立嘅專屬檔案庫。': 'Recording characters, stories, practical guides, and every moment worth preserving. This is not an encyclopaedia; it is the Captain’s dedicated archive for Lunar Vow.',
        '最新檔案': 'Latest Files',
        '開啟崩壞3rd完整劇情整理': 'Open the complete Honkai Impact 3rd story overview',
        '由聖芙蕾雅': 'From St. Freya',
        '去到火星': 'to Mars',
        '主線第一部、第一部半、第二部，以及艦長線／月下重逢集中整理，附劇透警告同快速索引。': 'A structured overview of Part 1, Part 1.5, Part 2, and the Captainverse reunion with Lunar Vow, with spoiler warnings and quick navigation.',
        '資料區域': 'Archive Directory',
        '攻略專區': 'Guide Centre',
        '角色操作、裝備、配隊及模式筆記。': 'Character rotations, equipment, team building, and mode notes.',
        '角色圖鑑': 'Character Database',
        '快速瀏覽《崩壞3rd》角色檔案。': 'Browse Honkai Impact 3rd character files quickly.',
        '相片庫': 'Gallery',
        '月下圖片、收藏同攝影記錄。': 'Lunar Vow images, collections, and photography records.',
        '遊戲劇情': 'Story Archive',
        '主線、火星第二部及月下艦長線整理。': 'Main story, Mars Part 2, and Lunar Vow’s Captainverse storyline.',
        '艦長線': 'Captainverse',
        '艦長宇宙相關劇情及角色紀錄。': 'Story and character records from the Captainverse.',
        '崩壞三資料': 'Honkai Impact 3rd Data',
        '世界觀、系統、角色同基礎資料索引。': 'An index of the setting, systems, characters, and core information.',
        '關於艦長': 'About the Captain',
        '白天被 assignment 追殺，晚上返艦橋整理月下檔案。': 'Assignments chase me by day; at night I return to the bridge to organise Lunar Vow’s archive.',
        '我係 Bernie。呢個網站係一個持續更新嘅私人《崩壞3rd》資料庫：內容會偏向實戰、角色感受、劇情同視覺收藏，而唔係純粹堆數值。': 'I am Bernie. This site is an evolving private Honkai Impact 3rd database focused on practical play, character impressions, story, and visual collecting rather than raw numbers alone.',
        '月下誓約・予愛以心係成個網站嘅核心。每次版本更新、裝備變動或者有新收藏，檔案都會繼續擴張。': 'Lunar Vow: Crimson Love is the core of the entire site. Every version update, equipment change, and new collection expands the archive.',
        '攻略專區 // Bernie’s Honkai Realm': 'Guide Centre // Bernie’s Honkai Realm',
        '角色操作、裝備、隊伍循環同模式筆記，全部集中喺同一個戰術檔案庫。': 'Character rotations, equipment, team cycles, and mode notes are collected in one tactical archive.',
        '攻略導覽': 'Guide Overview',
        '呢度會慢慢收集我自己寫嘅《崩壞3rd》攻略，內容偏向「實戰 + 個人感想」，適合想快速掌握操作、裝備同配隊重點嘅艦長。': 'This section gradually collects my own Honkai Impact 3rd guides, combining practical play with personal impressions for Captains who want the essential rotations, equipment, and team-building points quickly.',
        '角色攻略：': 'Character guides:',
        '主打月下誓約・予愛以心，其次係常用主 C 同輔助。': 'The main focus is Lunar Vow: Crimson Love, followed by commonly used damage dealers and supports.',
        '模式小貼士：': 'Mode tips:',
        '包括星之環、古之樂土、深淵基本概念等內容。': 'Includes Astral Ring, Elysian Realm, Abyss fundamentals, and related topics.',
        '最新核心檔案': 'Latest Core File',
        '月下誓約・予愛以心：Ver. 8.7+ 星之環完整入門': 'Lunar Vow: Crimson Love — Complete Ver. 8.7+ Astral Ring Introduction',
        '加入新神之鍵「共生的契約」、星之環「天衍之杯」、新版 QTE／必殺技、新舊裝備比較、操作循環及配隊方向。': 'Covers the new Divine Key Pact of Companionship, Grail of Infinitude Astral Ring, revised QTE and Ultimate, old-versus-new equipment, rotations, and team directions.',
        '計劃中': 'Planned Files',
        '月下誓約：古之樂土星之爆發／星之環充能兩套流派。': 'Lunar Vow: two Elysian Realm styles for Stellar Outburst and Astral Ring charging.',
        '真理之律者：傳統元素隊輔助及輸出用法。': 'Herrscher of Truth: traditional elemental support and damage-dealer usage.',
        '樂土入門：點樣用本命角色穩定過關。': 'Elysian Realm basics: clearing consistently with a favourite character.',
        '草稿板': 'Scratchpad',
        '呢個只係前端暫存工具。重新整理網頁後內容會清空，唔會發佈到 GitHub。': 'This is a browser-only temporary scratchpad. Its contents are cleared after reloading and are not published to GitHub.',
        '例如：月下星之爆發循環點樣再快啲？': 'Example: How can Lunar Vow’s Stellar Outburst rotation be faster?',
        '內容以個人實戰理解為主；實際效果以遊戲內最新版本為準。': 'Content reflects personal practical experience; actual effects follow the latest in-game version.',
        '月下角色視覺、個人收藏同攝影作品會喺呢度建立分類檔案。': 'Lunar Vow character visuals, personal collections, and photography are organised here.',
        '月下相片集': 'Lunar Vow Gallery',
        '呢度集中存放月下誓約相關圖片、角色視覺同個人收藏。之後可以再加分類、年份、活動或者攝影作品標籤。': 'This section stores Lunar Vow images, character visuals, and personal collections. Categories, years, events, and photography tags can be added later.',
        '月下誓約・予愛以心角色立繪': 'Lunar Vow: Crimson Love character artwork',
        '月下相關收藏相片': 'Lunar Vow collection photo',
        '新增圖片方式': 'Adding New Images',
        '網站部署喺 GitHub Pages，前端表單唔可以直接上傳檔案。新增圖片時，需要將檔案放入 repository，再喺呢一頁加入相片項目。': 'The site is deployed on GitHub Pages, so a front-end form cannot upload files directly. New images must be added to the repository and then referenced on this page.',
        '圖片版權屬於其原權利持有人；個人攝影作品版權由拍攝者保留。': 'Image rights belong to their respective owners; personal photography remains copyrighted by the photographer.',
        '世界觀、角色、戰鬥系統同養成內容嘅基礎索引。': 'A basic index of the setting, characters, combat systems, and progression.',
        '遊戲簡介': 'Game Overview',
        '《崩壞3rd》係一款以科幻世界觀、角色動作戰鬥同長篇劇情為核心嘅作品。玩家會透過唔同戰衣、隊伍同戰鬥系統，參與女武神以及各個世界線嘅故事。': 'Honkai Impact 3rd is built around a science-fiction setting, character action combat, and a long-form narrative. Players use different battlesuits, teams, and combat systems to follow the Valkyries across multiple timelines.',
        '完整遊戲劇情': 'Complete Story Overview',
        '由聖芙蕾雅、空之律者同姬子開始，整理到月球終焉、第一部半、火星第二部，以及艦長線同月下重逢。頁面包含重大劇透警告及分段索引。': 'From St. Freya, the Herrscher of the Void, and Himeko to Finality on the Moon, Part 1.5, Mars in Part 2, and the Captainverse reunion with Lunar Vow. The page includes major spoiler warnings and section navigation.',
        '主要角色': 'Main Characters',
        '琪亞娜・卡斯蘭娜': 'Kiana Kaslana',
        '雷電芽衣': 'Raiden Mei',
        '布洛妮婭・扎伊切克': 'Bronya Zaychik',
        '德麗莎・阿波卡利斯': 'Theresa Apocalypse',
        '愛莉希雅': 'Elysia',
        '核心特色': 'Core Features',
        '高速即時動作戰鬥、閃避及 QTE 輪轉。': 'Fast real-time action combat, evasions, and QTE rotations.',
        '物理、元素、流血及唔同隊伍增益機制。': 'Physical, elemental, bleed, and varied team-buff systems.',
        '角色戰衣、武器、聖痕及星之環養成。': 'Battlesuit, weapon, stigma, and Astral Ring progression.',
        '主線、艦長線、古之樂土、深淵及活動玩法。': 'Main story, Captainverse, Elysian Realm, Abyss, and event modes.',
        '本頁為非官方個人資料整理；遊戲及角色權利屬於其原權利持有人。': 'This is an unofficial personal reference; game and character rights belong to their respective owners.',
        '世界泡、角色關係同月下重逢故事嘅敘事紀錄庫。': 'A narrative archive of bubble universes, character relationships, and Lunar Vow’s reunion.',
        '艦長宇宙': 'The Captainverse',
        '艦長線係一系列以艦長、唔同世界泡同角色關係為核心嘅活動故事。佢同主線有唔同敘事方向，亦係月下誓約・予愛以心故事最重要嘅背景。': 'The Captainverse is a series of event stories centred on the Captain, different bubble universes, and character relationships. It follows a separate narrative direction from the main story and forms the most important background for Lunar Vow: Crimson Love.',
        '月下與艦長': 'Lunar Vow and the Captain',
        '月下嘅故事核心係漫長等待、跨越世界嘅追尋，以及同艦長重新相遇。呢一部分之後會按活動、時間線同重要場景逐步整理。': 'Lunar Vow’s story is built around a long wait, a pursuit across worlds, and her reunion with the Captain. This section will be expanded by event, timeline, and major scene.',
        '紀錄分類': 'Record Categories',
        '角色初次相遇與世界泡背景。': 'First encounters and bubble-universe backgrounds.',
        '艦長團隊、活動角色及關係發展。': 'The Captain’s crew, event characters, and relationship development.',
        '月下重逢、戰衣故事及後續紀錄。': 'Lunar Vow’s reunion, battlesuit story, and later records.',
        '主要人物': 'Key Figures',
        '艦長': 'Captain',
        '觀星': 'Stargazer',
        '迷城駭兔': 'Haxxor Bunny',
        '艦長線其他世界泡角色': 'Other Captainverse bubble-universe characters',
        '艦長線資料會按活動內容逐步補充，暫時以索引形式展示。': 'Captainverse information will be expanded with event content; it is currently presented as an index.',
        '角色、戰衣肖像、中文名同英文名全部集中喺可搜尋資料庫。': 'Characters, battlesuit portraits, and names are collected in a searchable database.',
        '女武神檔案': 'Valkyrie Files',
        '已為現有角色清單補上代表戰衣肖像。輸入角色英文名、中文名、slug 或戰衣名即可篩選；按角色圖片可以開啟大圖及查看來源。': 'Representative battlesuit portraits have been added for the current character list. Search by character name, slug, or battlesuit, then select an image to open the full view and source.',
        '輸入角色或戰衣名稱…': 'Enter a character or battlesuit name…',
        '角色肖像來源：Official Honkai Impact 3 Wiki；角色圖像、名稱及遊戲素材權利屬於其原權利持有人。本頁為非官方、非商業個人收藏資料庫。': 'Character portraits are sourced from the Official Honkai Impact 3 Wiki. Character images, names, and game assets belong to their respective owners. This is an unofficial, non-commercial personal collection database.',
        '無法載入角色資料': 'Unable to load character data',
        '搵唔到相符角色': 'No matching character found',
        '開啟': 'Open',
        '圖片': 'image',
        '予愛以心完整入門：新神之鍵、星之環、操作循環、裝備同配隊方向。': 'A complete Crimson Love introduction covering the new Divine Key, Astral Ring, rotations, equipment, and team building.',
        '最後更新：': 'Last updated: ',
        '老婆正式接入星之環，玩法由舊世代升級到 Part 2': 'Lunar Vow officially joins the Astral Ring system, upgrading from the old generation to Part 2.',
        '月下誓約・予愛以心原本係異能屬性雷傷／流血主 C，同時具備雷隊輔助能力。Ver. 8.7 加入新神之鍵後，佢可以啟動星之環「天衍之杯（Grail of Infinitude）」，QTE、必殺技同輸出循環亦會改變。': 'Lunar Vow: Crimson Love began as a PSY lightning/bleed damage dealer with lightning-team support. With the new Divine Key in Ver. 8.7, she can activate the Grail of Infinitude Astral Ring, changing her QTE, Ultimate, and damage cycle.',
        '1. 角色定位': '1. Role',
        '基本資料': 'Basic Information',
        '角色：': 'Character:',
        '德麗莎·阿波卡利斯的艦長線版本': 'The Captainverse version of Theresa Apocalypse',
        '稀有度：': 'Rarity:',
        'S 級': 'S-rank',
        '屬性：': 'Type:',
        '異能（PSY）': 'PSY',
        '武器：': 'Weapon:',
        '十字架，實戰以雙電鋸攻擊': 'Cross; fights with twin chainsaws in practice',
        '戰鬥定位': 'Combat Role',
        '輸出：': 'Damage:',
        '雷元素傷害 + 流血傷害': 'Lightning damage + bleed damage',
        '主 C：': 'Main DPS:',
        '站場累積「啃咬印記」，進入狂化後爆發': 'Build Biting Marks on field, then burst in Frenzy',
        '輔助：': 'Support:',
        '可為雷傷、流血及指定星之環隊伍提供增益': 'Provides buffs for lightning, bleed, and selected Astral Ring teams',
        '2. Ver. 8.7 最大更新': '2. Major Ver. 8.7 Changes',
        '新神之鍵：': 'New Divine Key:',
        '「共生的契約（Pact of Companionship）」及超限形態「共生的契約・永遠（Pact of Companionship: Evermore）」。': 'Pact of Companionship and its PRI-ARM form, Pact of Companionship: Evermore.',
        '接入星之環：': 'Astral Ring access:',
        '裝備新武器後啟動「天衍之杯」，並獲得相生、天淵轉位等相關能力。': 'Equipping the new weapon activates Grail of Infinitude and grants related Astral Ring abilities.',
        '技能重製：': 'Skill revision:',
        'QTE 會改變；星之環充能期間可補充 SP。新必殺技可在非狂化狀態直接補滿啃咬印記並進入狂化。': 'Her QTE changes, Astral Ring charging restores SP, and the new Ultimate can fill Biting Marks and enter Frenzy directly from a non-Frenzy state.',
        '新推薦聖痕：': 'New recommended stigma:',
        '「冠無き獨裁者（Uncrowned Autocrat）」套裝，部件主題為 Julius Caesar；可透過鍛造取得。': 'The Uncrowned Autocrat set, themed around Julius Caesar, can be obtained through forging.',
        '實戰意義：': 'Practical impact:',
        '月下可以加入 Part 2 星之環編隊；舊裝備則仍然保留 Part 1 傳統玩法。': 'Lunar Vow can join Part 2 Astral Ring teams, while her old equipment preserves the traditional Part 1 playstyle.',
        '3. 核心機制': '3. Core Mechanics',
        '啃咬印記（Biting Mark）': 'Biting Mark',
        '普攻第四段、QTE 或指定技能可以累積啃咬印記。印記係進入狂化及維持電鋸連斬嘅核心資源。': 'The fourth Basic Attack sequence, QTE, and selected skills build Biting Marks. They are the central resource for entering Frenzy and sustaining chainsaw attacks.',
        '狂化狀態（Frenzy）': 'Frenzy',
        '進入狂化後，月下可以連續使用武器按鍵進行高速多段斬擊；印記耗盡時會打出終結攻擊。呢段係主要爆發窗口，最好等隊友增益、易傷同聚怪完成先開。': 'In Frenzy, Lunar Vow repeatedly uses the weapon button for rapid multi-hit slashes, finishing when her marks are depleted. This is her main burst window, ideally used after team buffs, vulnerability effects, and gathering are ready.',
        '流血與雷傷': 'Bleed and Lightning Damage',
        '月下同時處理雷元素及流血機制。部分攻擊會施加流血積蓄，而佢亦會對受到流血傷害嘅敵人追加雷傷，所以配裝唔應該只睇單一雷傷面板。': 'Lunar Vow uses both lightning and bleed mechanics. Some attacks build bleed trauma, and she deals additional lightning damage to enemies taking bleed damage, so equipment should not be judged by a lightning-only stat sheet.',
        '4. 裝備選擇': '4. Equipment',
        '2026 星之環版本': '2026 Astral Ring Build',
        '共生的契約 → 共生的契約・永遠': 'Pact of Companionship → Pact of Companionship: Evermore',
        '聖痕：': 'Stigmata:',
        '冠無き獨裁者三件套': 'Uncrowned Autocrat three-piece set',
        '用途：': 'Purpose:',
        '解鎖星之環、新 QTE、新必殺技及隊伍增益；想玩新版月下，武器係核心。': 'Unlocks Astral Ring, the new QTE and Ultimate, and team buffs. The weapon is essential for the updated Lunar Vow.',
        '舊版 Part 1 配裝': 'Legacy Part 1 Build',
        '血染赤匣・愛之切（Bloodied Casket: Tough Love）': 'Bloodied Casket: Tough Love',
        'Darkness Illuminated 專屬套裝': 'Darkness Illuminated signature set',
        '傳統雷傷／流血主 C 或雷隊輔助，唔會啟動新版星之環技能。': 'Traditional lightning/bleed damage dealer or lightning support; it does not activate the new Astral Ring skills.',
        '投資次序：': 'Investment order:',
        '新版神之鍵／超限武器 → 新聖痕套裝 → 武器協同等級 → 角色階級。只換聖痕但冇新武器，無法解鎖完整星之環玩法。': 'New Divine Key/PRI-ARM → new stigma set → weapon synergy level → character rank. The full Astral Ring kit cannot be unlocked by changing stigmata without the new weapon.',
        '5. 簡化操作循環': '5. Simplified Rotations',
        '新版：裝備「共生的契約」': 'New build: Pact of Companionship equipped',
        '先由隊友開武器技、必殺技或其他增益，觸發月下新版 QTE。': 'Use teammates’ weapon skills, Ultimates, or other buffs to trigger Lunar Vow’s revised QTE.',
        '月下 QTE 入場，利用星之環充能期間嘅 SP 回復。': 'Enter with Lunar Vow’s QTE and use the SP recovery during Astral Ring charging.',
        '喺非狂化狀態使用新版必殺技，補滿啃咬印記並直接進入狂化。': 'Use the revised Ultimate outside Frenzy to fill Biting Marks and enter Frenzy immediately.',
        '狂化期間連按武器鍵打滿電鋸斬擊，完成終結攻擊。': 'Repeatedly press the weapon button during Frenzy to complete the chainsaw sequence and finisher.',
        '星之爆發期間按隊伍配置使用強化攻擊及連攜必殺技，再回到隊友循環。': 'During Stellar Outburst, use enhanced attacks and linked Ultimates according to the team, then return to the support rotation.',
        '舊版：原專武玩法': 'Legacy build: original signature weapon',
        '隊友先鋪雷傷增益、元素易傷及其他輔助效果。': 'Set up lightning buffs, elemental vulnerability, and other support effects first.',
        '月下 QTE 入場，普攻至第四段並長按攻擊，快速累積啃咬印記。': 'Enter with Lunar Vow’s QTE, reach the fourth Basic Attack sequence, and hold Attack to build Biting Marks quickly.',
        '接分支攻擊，印記足夠後使用武器技進入狂化。': 'Follow with a Combo Attack and use the weapon skill to enter Frenzy once enough marks are available.',
        '連按武器鍵直至印記耗盡，打出狂化終結攻擊。': 'Press the weapon button repeatedly until the marks are depleted and the Frenzy finisher activates.',
        '使用必殺技收尾，再切返隊友重新鋪增益。': 'Finish with the Ultimate, then switch back to teammates to refresh buffs.',
        '以上係入門骨架；深淵天氣、Boss 機制、角色階級同隊友會改變實際出招次序。': 'This is an introductory framework; Abyss weather, boss mechanics, character rank, and teammates can change the exact sequence.',
        '6. 配隊方向': '6. Team Building',
        '星之環主 C': 'Astral Ring Main DPS',
        '月下做隊長啟動「天衍之杯」，優先配搭具有相生特性、能快速啟動星之環及提供雷傷／流血增益嘅 Part 2 角色。相生隊友愈完整，月下喺星之爆發期間獲得嘅增益愈齊。': 'Use Lunar Vow as leader to activate Grail of Infinitude. Prioritise Part 2 characters with compatible traits, fast Astral Ring activation, and lightning or bleed buffs. A more complete compatible roster gives Lunar Vow more benefits during Stellar Outburst.',
        '星之環輔助': 'Astral Ring Support',
        '裝備新神之鍵後，月下亦可進入指定「升變」或「天衍」編隊擔任輔助；新版武器可提供全隊傷害增益及敵方承傷效果。': 'With the new Divine Key, Lunar Vow can also support selected Part 2 teams; the weapon provides team damage buffs and enemy vulnerability.',
        '傳統 Part 1 雷隊': 'Traditional Part 1 Lightning Team',
        '舊裝備仍可使用「月下 + 黃金・璀耀之歌 + 真理之律者」一類雷隊。月下通常做隊長兼主 C，由兩位隊友完成增益後入場爆發。': 'Legacy equipment still supports teams such as Lunar Vow + Golden Diva + Herrscher of Truth. Lunar Vow normally serves as leader and main DPS, entering after both supports finish their setup.',
        '7. 培養結論': '7. Investment Summary',
        '有新神之鍵：': 'With the new Divine Key:',
        '月下由舊式雷／流血角色升級為星之環角色，操作更直接，亦重新獲得現代隊伍位置。': 'Lunar Vow upgrades from a legacy lightning/bleed unit into an Astral Ring character with a more direct rotation and a modern team position.',
        '只有舊專武：': 'With only the old signature weapon:',
        '仍然可以玩傳統循環，但無法使用新版星之環技能及新必殺技。': 'The traditional rotation remains playable, but the new Astral Ring skills and revised Ultimate are unavailable.',
        '本命玩家：': 'Dedicated players:',
        '新武器係最高優先度；新聖痕可以鍛造，適合逐件補齊。': 'The new weapon has the highest priority. The new stigmata are forgeable and can be completed gradually.',
        '一句講晒：': 'In one line:',
        '先由隊友鋪 Buff → 月下 QTE → 新必殺技入狂化 → 電鋸連斬 → 星之爆發收割。': 'Set up team buffs → Lunar Vow QTE → revised Ultimate into Frenzy → chainsaw sequence → finish during Stellar Outburst.',
        '資料來源': 'Sources',
        '《崩壞3rd》Ver. 8.7 更新公告': 'Honkai Impact 3rd Ver. 8.7 Update Announcement',
        'Ver. 8.7 活動及新神之鍵預覽': 'Ver. 8.7 Event and New Divine Key Preview',
        'Ver. 7.0 月下誓約初登場公告': 'Ver. 7.0 Lunar Vow Debut Announcement',
        '月下誓約個人攻略檔案；實際數值及機制以遊戲內最新版本為準。': 'A personal Lunar Vow guide archive; actual values and mechanics follow the latest in-game version.',
        '由聖芙蕾雅開始，到月球終焉、火星世界泡，再延伸至艦長線與月下。以下係一個以角色選擇同情感主軸為中心嘅劇情整理。': 'From St. Freya to Finality on the Moon, the Martian bubble worlds, and the Captainverse with Lunar Vow, this overview centres on character choices and emotional through-lines.',
        '以下包含重大劇透': 'Major Spoilers Below',
        '內容會直接講到姬子、奧托、凱文、終焉篇、第一部半、第二部，以及月下同艦長重逢。未玩完主線嘅人，建議先睇下面嘅「世界觀簡介」，之後再自行決定要唔要繼續。': 'This page directly discusses Himeko, Otto, Kevin, the Finality arc, Part 1.5, Part 2, and Lunar Vow’s reunion with the Captain. Players who have not finished the main story should read the setting overview first and then decide whether to continue.',
        '劇情索引': 'Story Index',
        '主線第一部': 'Main Story Part 1',
        '琪亞娜與終焉': 'Kiana and Finality',
        '第一部半': 'Part 1.5',
        '希兒、符華與娑': 'Seele, Fu Hua, and Sa',
        '主線第二部': 'Main Story Part 2',
        '火星、尋夢者與瑟莉姆等人': 'Mars, the Dreamseeker, Thelema, and others',
        '世界泡、艦長與月下': 'Bubble universes, the Captain, and Lunar Vow',
        '先理解呢個世界': 'Understanding the World First',
        '「崩壞」唔單止係怪物或者能源，而係會隨文明發展而加劇嘅災難。人類愈進步，崩壞就愈會以更危險方式出現：崩壞獸、死士、律者，以及足以摧毀文明嘅終極災變。': 'Honkai is not merely a monster or an energy source. It is a disaster that intensifies as civilisation advances, appearing as Honkai beasts, zombies, Herrschers, and ultimately catastrophes capable of destroying civilisation.',
        '天命': 'Schicksal',
        '由奧托長期掌權，依靠女武神、科技及崩壞研究對抗災難，同時亦隱藏大量人體實驗與政治操控。': 'Long controlled by Otto, Schicksal fights disasters through Valkyries, technology, and Honkai research while concealing extensive human experimentation and political manipulation.',
        '逆熵': 'Anti-Entropy',
        '反對天命嘅組織，偏向以機甲與科學手段作戰。瓦爾特、愛因斯坦同特斯拉係重要核心人物。': 'An organisation opposing Schicksal that favours mechs and scientific methods. Welt, Einstein, and Tesla are central figures.',
        '世界蛇': 'World Serpent',
        '由前文明遺留下來嘅力量主導，以凱文為核心，為咗令文明存活，可以接受極端而殘酷嘅代價。': 'Led by powers inherited from the Previous Era and centred on Kevin, World Serpent accepts extreme and brutal costs to ensure civilisation survives.',
        '琪亞娜嘅故事': 'Kiana’s Story',
        '第一部表面上係三位少女對抗崩壞，核心其實係琪亞娜由「被製造出來嘅容器」變成真正能夠選擇自己人生嘅人。佢一次又一次承受失去，但最後冇選擇成為神，而係選擇保留人性。': 'Part 1 appears to follow three girls fighting Honkai, but its core is Kiana’s transformation from a manufactured vessel into a person capable of choosing her own life. She suffers loss repeatedly, yet ultimately chooses humanity rather than godhood.',
        '聖芙蕾雅：短暫而珍貴嘅日常': 'St. Freya: A Brief and Precious Everyday Life',
        '琪亞娜、雷電芽衣同布洛妮婭加入聖芙蕾雅學園，受姬子、德麗莎等人教導。呢段校園生活建立咗三人之間嘅感情，亦令之後每一次分離都更加沉重。': 'Kiana, Raiden Mei, and Bronya join St. Freya Academy under the guidance of Himeko, Theresa, and others. Their school life builds the bonds that make every later separation more painful.',
        '空之律者甦醒：琪亞娜失去自己': 'Herrscher of the Void Awakens: Kiana Loses Herself',
        '琪亞娜其實係奧托利用西琳基因與律者核心製造嘅實驗體 K-423。當空之律者人格甦醒，佢失去身體控制權，長空市與天命總部陷入災難。': 'Kiana is actually K-423, an experimental body created by Otto using Sirin’s genes and Herrscher core. When the Herrscher of the Void persona awakens, she loses control of her body and disaster strikes Nagazora and Schicksal Headquarters.',
        '姬子嘅最後一課': 'Himeko’s Final Lesson',
        '姬子穿上會燃燒生命嘅裝甲，進入虛數空間阻止空之律者。佢冇選擇殺死琪亞娜，而係將最後機會留俾學生，令琪亞娜重新奪回意識。呢次犧牲成為琪亞娜往後所有選擇嘅核心。': 'Himeko dons armour that burns away her life and enters imaginary space to stop the Herrscher of the Void. Rather than kill Kiana, she gives her student one final chance to regain consciousness. This sacrifice becomes the foundation of Kiana’s later choices.',
        '流浪與贖罪：琪亞娜學識承擔': 'Wandering and Atonement: Kiana Learns Responsibility',
        '琪亞娜因內疚而離開同伴，獨自處理崩壞事件。喺天穹市危機中，佢即使身體逐漸崩壞，仍然選擇救人。由呢刻開始，佢唔再只係模仿父親，而係真正形成自己嘅信念。': 'Driven by guilt, Kiana leaves her companions and handles Honkai incidents alone. During the Arc City crisis, she chooses to save others even as her body deteriorates. From this point, she stops merely imitating her father and forms convictions of her own.',
        '芽衣嘅選擇：為咗救一個人而離開': 'Mei’s Choice: Leaving to Save One Person',
        '琪亞娜嘅身體因崩壞能侵蝕而接近極限。芽衣為咗令空之律者核心離開琪亞娜，重新成為雷之律者，並加入世界蛇。佢唔係背叛琪亞娜，而係接受自己可能被憎恨，只求對方可以活落去。': 'Kiana’s body approaches its limit under Honkai corrosion. To remove the Herrscher of the Void core from Kiana, Mei becomes the Herrscher of Thunder again and joins World Serpent. It is not betrayal; she accepts being hated if it means Kiana can live.',
        '布洛妮婭與希兒：由被保護者成為守護者': 'Bronya and Seele: From the Protected to the Protectors',
        '布洛妮婭繼承理之律者力量，深入量子之海尋找希兒。希兒亦逐漸由依賴布洛妮婭，成長成可以獨立面對世界與守護他人嘅人。': 'Bronya inherits the power of the Herrscher of Reason and enters the Sea of Quanta to find Seele. Seele also grows from relying on Bronya into someone capable of facing the world and protecting others independently.',
        '奧托：五百年執念嘅終點': 'Otto: The End of a Five-Hundred-Year Obsession',
        '奧托一生都想令卡蓮復活。佢利用所有人、製造無數悲劇，最後以自己性命換取一個可能性：唔係將現有世界嘅卡蓮復活，而係創造一條卡蓮能夠活落去嘅新分支。佢完成願望，但從來冇因此被洗白。': 'Otto spends his life trying to restore Kallen. He uses everyone and causes countless tragedies, then trades his life for one possibility: not reviving the Kallen of the current world, but creating a new branch where she can survive. He fulfils his wish without erasing his crimes.',
        '往世樂土：前文明留低嘅答案': 'Elysian Realm: The Previous Era’s Answer',
        '芽衣進入往世樂土，認識十三英桀嘅記憶體。愛莉希雅揭示自己作為人之律者嘅選擇：正因為佢願意相信人類，後世律者先有可能保留人性。前文明最終失敗，但佢哋嘅犧牲令下一個文明有機會走出另一條路。': 'Mei enters the Elysian Realm and meets the memory sims of the Thirteen Flame-Chasers. Elysia reveals her choice as the Herrscher of Human: because she believed in humanity, later Herrschers gained the possibility of retaining their humanity. The Previous Era failed, but its sacrifices gave the next civilisation another path.',
        '月球終焉：三人再次並肩': 'Finality on the Moon: The Three Stand Together Again',
        '凱文執行「聖痕計劃」，希望以犧牲絕大部分人類為代價，確保文明避過終焉。琪亞娜、芽衣同布洛妮婭分別獲得終焉、始源與真理嘅權能，最終擊敗凱文，並以不同於前文明嘅方式承擔終焉。': 'Kevin executes Project Stigma, sacrificing most of humanity to ensure civilisation survives Finality. Kiana, Mei, and Bronya gain the authorities of Finality, Origin, and Truth, defeat Kevin, and shoulder Finality in a way the Previous Era could not.',
        '向新嘅明日：勝利並唔等於冇代價': 'Towards a New Tomorrow: Victory Still Has a Price',
        '琪亞娜留喺月球處理終焉力量，暫時同地球保持距離。芽衣、布洛妮婭同其他人開始重建世界。第一部結束唔係因為所有問題消失，而係人類終於可以自行決定未來。': 'Kiana remains on the Moon to manage the power of Finality and temporarily keeps her distance from Earth. Mei, Bronya, and the others begin rebuilding. Part 1 ends not because every problem disappears, but because humanity can finally choose its own future.',
        '真正嘅勝利，唔係打敗一個神，而係人類終於唔需要用放棄自己去換取生存。': 'True victory is not defeating a god; it is humanity no longer having to abandon itself in exchange for survival.',
        '終焉之後嘅世界泡': 'Bubble Universes after Finality',
        '第一部半係第一部同第二部之間嘅橋樑。主角焦點由御三家轉向希兒同符華，故事亦由地球危機轉向世界泡、跨世界生命，以及隱藏喺背後嘅高等存在。': 'Part 1.5 bridges Part 1 and Part 2. The focus shifts from the original trio to Seele and Fu Hua, while the story expands from Earth’s crisis to bubble universes, trans-world life, and higher beings operating behind them.',
        '希兒篇：鹽雪聖城與鐵砂之國': 'Seele Arc: Salt Snow Holy City and the Iron Sand Nation',
        '希兒進入互相依存嘅世界泡，面對兩個世界之間嘅矛盾與崩解。佢由過去經常被保護嘅人，成長為能夠承受選擇、理解死亡，並成為新生律者嘅守護者。': 'Seele enters interdependent bubble universes and faces conflict and collapse between two worlds. Once frequently protected by others, she grows into a guardian capable of bearing choices, understanding death, and becoming a newly born Herrscher.',
        '符華篇：業力、身份與娑': 'Fu Hua Arc: Karma, Identity, and Sa',
        '符華進入磷砂世界，重新面對自己漫長生命中累積嘅責任與傷痕。維塔與「娑」逐步揭示更大尺度嘅力量，並將世界泡故事推向第二部。': 'Fu Hua enters the Phosphorus world and confronts the responsibilities and wounds accumulated over her long life. Vita and Sa gradually reveal powers on a greater scale, pushing the bubble-universe story towards Part 2.',
        '第一部半嘅作用': 'The Purpose of Part 1.5',
        '呢部分唔係單純外傳：佢證明終焉危機結束後，宇宙仍然存在大量被遺忘嘅文明同世界；地球只係整個故事其中一個座標。': 'This is not merely a side story. It shows that after the Finality crisis, countless forgotten civilisations and worlds still exist; Earth is only one coordinate in the larger narrative.',
        '火星與尋夢者': 'Mars and the Dreamseeker',
        '第二部發生喺第一部半之後、後崩壞書之前。舞台轉移到火星相關世界泡，由尋夢者、希娜狄雅、赫麗婭、科拉莉、松雀等新角色接棒。舊角色並冇被抹走，而係開始以另一種方式同新世界產生聯繫。': 'Part 2 takes place after Part 1.5 and before A Post-Honkai Odyssey. The stage moves to Mars-related bubble universes, led by the Dreamseeker, Senadina, Helia, Coralie, Songque, and other new characters. Earlier characters are not erased; they begin connecting with the new world in different ways.',
        '死去嘅星球與仍然存在嘅夢': 'A Dead Planet and Dreams That Remain',
        '現實宇宙中嘅火星文明早已毀滅，但其殘留世界泡仍保存住城市、記憶與文明碎片。尋夢者進入瓯夏／火星世界，試圖理解災難背後嘅真相。': 'Mars’s civilisation in the physical universe was destroyed long ago, but its surviving bubble universes preserve cities, memories, and fragments of civilisation. The Dreamseeker enters Oxia and the Martian worlds to uncover the truth behind the disaster.',
        '新隊伍：唔同立場下建立信任': 'A New Team: Building Trust across Different Positions',
        '希娜狄雅以近乎本能嘅熱情接近尋夢者；赫麗婭與科拉莉代表地球方面嘅調查力量；松雀及七術等角色則同火星世界自身嘅命運緊密相連。新主角群唔係御三家翻版，而係一群被迫喺陌生世界重新定義自己嘅人。': 'Senadina approaches the Dreamseeker with almost instinctive warmth; Helia and Coralie represent Earth’s investigative force; Songque and the Seven Shus are bound to the fate of the Martian worlds. The new cast is not a copy of the original trio, but a group forced to redefine themselves in an unfamiliar world.',
        '影、夢與身份': 'Shadows, Dreams, and Identity',
        '第二部反覆追問：一個由記憶、夢境或者世界泡構成嘅人，係咪仍然算真正存在？當世界本身可能係殘響，角色仍然選擇為當下建立關係，令「真實」由物理事實變成一種共同選擇。': 'Part 2 repeatedly asks whether a person made from memories, dreams, or a bubble universe truly exists. Even when the world itself may be an echo, the characters choose to build relationships in the present, turning “reality” from a physical fact into a shared choice.',
        '目前進度：第十一章與幕間': 'Current Progress: Chapter XI and Its Interlude',
        '截至 Ver. 8.7，第二部推進至第十一章幕間〈光所夢見的夜晚〉，故事進一步揭示希娜狄雅嘅過去，以及佢同尋夢者、舊世界力量之間嘅聯繫。呢部分仍然連載中，網站之後會按版本更新。': 'As of Ver. 8.7, Part 2 has reached the Chapter XI interlude, The Night Dreamed by Light, revealing more of Senadina’s past and her connections with the Dreamseeker and powers from the old world. This storyline is ongoing and will be updated with future versions.',
        '艦長線與月下': 'The Captainverse and Lunar Vow',
        '艦長線係由多個活動串連而成嘅獨立世界泡故事。佢同主線共享部分設定同角色原型，但唔應該當成主線同一條時間線。呢條線嘅核心唔係世界末日，而係「一個人究竟可以為另一個人等待幾耐」。': 'The Captainverse is an independent bubble-universe narrative connected across multiple events. It shares concepts and character archetypes with the main story but is not the same timeline. Its central question is not the end of the world, but how long one person can wait for another.',
        '旅行於世界泡之間嘅艦長': 'The Captain Travelling between Bubble Universes',
        '艦長乘坐休伯利安穿梭唔同世界泡，遇到觀星、迷城駭兔、麗塔、姬子等平行版本角色。每個世界都可能消失，所以「記住一個人」本身就變成拯救。': 'The Captain travels between bubble universes aboard the Hyperion, meeting alternate versions of Stargazer, Haxxor Bunny, Rita, Himeko, and others. Because every world may disappear, remembering someone becomes a form of salvation.',
        '月下：最初嘅相遇': 'Lunar Vow: The First Encounter',
        '月下係吸血鬼版本嘅德麗莎。佢既危險又孤獨，對世界缺乏信任，但逐漸將艦長視為唯一願意伸手帶佢離開黑暗嘅人。': 'Luna is a vampire version of Theresa. Dangerous and isolated, she distrusts the world but gradually sees the Captain as the only person willing to reach into the darkness and lead her out.',
        '分離：承諾未有即時兌現': 'Separation: A Promise Not Immediately Fulfilled',
        '艦長因世界泡與自身任務被迫離開。對艦長嚟講係一段旅程，對月下嚟講卻係漫長到足以改變外貌同心境嘅等待。佢冇忘記承諾，反而將等待變成自己活落去嘅理由。': 'The Captain is forced to leave because of the bubble universes and his mission. For him it is one journey; for Luna it is a wait long enough to change her appearance and state of mind. She does not forget the promise, instead turning the wait into a reason to keep living.',
        '重逢：月下誓約・予愛以心': 'Reunion: Lunar Vow: Crimson Love',
        '多年之後，成長後嘅月下再次同艦長相遇。佢已經唔再係等待被救嘅少女，而係可以親自揮動武器，保護自己最重視嘅人。Ver. 7.0 以血月下嘅重逢，為呢段跨越多年嘅承諾交出答案。': 'Years later, the grown Lunar Vow meets the Captain again. She is no longer a girl waiting to be rescued, but someone who can wield her own weapon and protect the person she values most. Ver. 7.0 answers a promise spanning years through their reunion beneath the blood moon.',
        '月下最打動人嘅地方，唔係佢等到艦長，而係等待冇令佢停留喺原地。': 'What makes Lunar Vow moving is not simply that the Captain returned, but that waiting never left her standing still.',
        '建議閱讀／遊玩次序': 'Recommended Reading and Play Order',
        '新玩家：': 'New players:',
        '主線第一部 → 第一部半 → 第二部。': 'Main Story Part 1 → Part 1.5 → Part 2.',
        '只為月下入坑：': 'Players joining for Lunar Vow:',
        '先睇艦長線總覽，再補月下相關活動，最後睇 Ver. 7.0 重逢。': 'Read the Captainverse overview first, then the Lunar Vow-related events, and finish with the Ver. 7.0 reunion.',
        '想理解完整世界觀：': 'For the complete setting:',
        '主線之外再補官方漫畫、視覺小說、往世樂土及後崩壞書。': 'Add the official manga, visual novels, Elysian Realm, and A Post-Honkai Odyssey alongside the main story.',
        '官方資料來源': 'Official References',
        '第一部終章：Toward a New Tomorrow': 'Part 1 Finale: Toward a New Tomorrow',
        '第二部主線開幕及洛星舞台介紹': 'Part 2 Opening and Luoxing Setting Introduction',
        'Mars Newsletter：第二部時間位置與舊角色連結': 'Mars Newsletter: Part 2 Timeline Placement and Returning-Character Links',
        'Ver. 8.7 第二部第十一章幕間更新': 'Ver. 8.7 Part 2 Chapter XI Interlude Update',
        'Ver. 7.0 月下誓約與重逢': 'Ver. 7.0 Lunar Vow and the Reunion',
        '本頁為非官方劇情整理，內容以遊戲內最新版本及官方公告為準。': 'This is an unofficial story overview based on the latest in-game version and official announcements.'
    };

    const CHARACTER_NAMES = {
        'Kiana Kaslana': '琪亞娜·卡斯蘭娜',
        'Raiden Mei': '雷電芽衣',
        'Bronya Zaychik': '布洛妮婭·捷伊慈克',
        'Himeko Murata': '姬子·村田',
        'Theresa Apocalypse': '德麗莎·阿波卡利斯',
        'Fischl': '菲謝爾',
        'Yae Sakura': '八重櫻',
        'Elysia': '愛莉希雅',
        'Mobius': '梅比烏斯',
        'Eden': '伊甸',
        'Aponia': '阿波尼亞',
        'Vill-V': '維爾薇',
        'Griseo': '格雷修',
        'Pardofelis': '帕朵菲莉絲',
        'Li Sushang': '李素裳',
        'Susannah Manatt': '蘇珊娜·曼納特',
        'PROMETHEUS': '普羅米修斯',
        'Carole Pepper': '卡蘿爾·佩珀',
        'Sirin': '西琳',
        'Thelema Nutriscu': '泰蕾瑪·納特里斯庫',
        'Lunar Vow: Crimson Love': '月下誓約・予愛以心'
    };

    Object.assign(HK, CHARACTER_NAMES);
    Object.entries(CHARACTER_NAMES).forEach(([english, chinese]) => {
        if (!EN[chinese]) EN[chinese] = english;
    });

    const PAGE_INFO = {
        'index.html': {
            hkTitle: 'Bernie’s Honkai Realm // 月下誓約檔案庫',
            enTitle: 'Bernie’s Honkai Realm // Lunar Vow Archive',
            hkDescription: 'Bernie’s Honkai Realm：以月下誓約・予愛以心為核心的《崩壞3rd》角色攻略、劇情、資料庫與影像收藏。',
            enDescription: 'Bernie’s Honkai Realm: a Honkai Impact 3rd archive centred on Lunar Vow: Crimson Love, featuring guides, story, character data, and visual collections.'
        },
        'guide.html': {
            hkTitle: '攻略專區 // Bernie’s Honkai Realm',
            enTitle: 'Guide Centre // Bernie’s Honkai Realm',
            hkDescription: 'Bernie’s Honkai Realm 攻略專區，收錄月下誓約・予愛以心 Ver. 8.7+ 星之環攻略。',
            enDescription: 'The Bernie’s Honkai Realm guide centre, featuring the Ver. 8.7+ Astral Ring guide for Lunar Vow: Crimson Love.'
        },
        'gallery.html': {
            hkTitle: '相片庫 // Bernie’s Honkai Realm',
            enTitle: 'Gallery // Bernie’s Honkai Realm',
            hkDescription: 'Bernie’s Honkai Realm 月下誓約相片庫及視覺收藏。',
            enDescription: 'The Lunar Vow gallery and visual collection of Bernie’s Honkai Realm.'
        },
        'honkai-info.html': {
            hkTitle: '崩壞三資料 // Bernie’s Honkai Realm',
            enTitle: 'Honkai Impact 3rd Data // Bernie’s Honkai Realm',
            hkDescription: '《崩壞3rd》基本資料、角色及遊戲特色整理。',
            enDescription: 'An overview of Honkai Impact 3rd information, characters, and game features.'
        },
        'captain-line.html': {
            hkTitle: '艦長線 // Bernie’s Honkai Realm',
            enTitle: 'Captainverse // Bernie’s Honkai Realm',
            hkDescription: 'Bernie’s Honkai Realm 艦長線劇情及角色紀錄。',
            enDescription: 'Captainverse story and character records from Bernie’s Honkai Realm.'
        },
        'hi3.html': {
            hkTitle: '角色圖鑑 // Bernie’s Honkai Realm',
            enTitle: 'Character Database // Bernie’s Honkai Realm',
            hkDescription: 'Bernie’s Honkai Realm《崩壞3rd》角色圖鑑，支援角色搜尋及圖片放大。',
            enDescription: 'The Honkai Impact 3rd character database of Bernie’s Honkai Realm, with character search and full-size image viewing.'
        },
        'story.html': {
            hkTitle: '遊戲劇情 // Bernie’s Honkai Realm',
            enTitle: 'Story Archive // Bernie’s Honkai Realm',
            hkDescription: '《崩壞3rd》主線第一部、第一部半、第二部及艦長線劇情整理。',
            enDescription: 'A structured overview of Honkai Impact 3rd Part 1, Part 1.5, Part 2, and the Captainverse.'
        },
        'lunar-vow-guide.html': {
            hkTitle: '月下誓約・予愛以心 Ver. 8.7+ 更新攻略 // Bernie’s Honkai Realm',
            enTitle: 'Lunar Vow: Crimson Love Ver. 8.7+ Guide // Bernie’s Honkai Realm',
            hkDescription: '月下誓約・予愛以心 Ver. 8.7+ 更新攻略：星之環、新神之鍵、聖痕、操作循環及舊裝備玩法。',
            enDescription: 'A Ver. 8.7+ Lunar Vow: Crimson Love guide covering Astral Ring, the new Divine Key, stigmata, rotations, and legacy equipment.'
        }
    };

    const textSources = new WeakMap();
    const renderedText = new WeakMap();
    const attributeSources = new WeakMap();
    let currentLanguage = DEFAULT_LANGUAGE;
    let mutationLock = false;
    let openCCPromise = null;
    let openCCConverter = null;

    const getPageName = () => {
        const name = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
        return name.includes('.') ? name : 'index.html';
    };

    const preserveWhitespace = (raw, translated) => {
        const leading = raw.match(/^\s*/)?.[0] || '';
        const trailing = raw.match(/\s*$/)?.[0] || '';
        return `${leading}${translated}${trailing}`;
    };

    const sortedEnglishEntries = Object.entries(EN).sort((a, b) => b[0].length - a[0].length);
    const sortedHKEntries = Object.entries(HK).sort((a, b) => b[0].length - a[0].length);

    const replaceKnownPhrases = (value, entries) => {
        let output = value;
        entries.forEach(([source, target]) => {
            if (source && output.includes(source)) output = output.split(source).join(target);
        });
        return output;
    };

    const fallbackSimplify = (value) => {
        const traditional = '萬與專業東絲丟兩嚴喪個豐臨為麗舉麼義烏樂喬習鄉書買亂爭於亞產畝親億僅從侖倉儀們價眾優會傘偉傳傷倫偽體餘來俠侶僥偵側僑僕僞儘兌兒黨關興養獸內岡冊寫軍農馮沖決況凍淨準涼減湊幾鳳憑凱劃劇劉劍劑勁動務勝勞勢勳匯區醫華協單賣盧衛卻廠歷厲壓厭縣參雙發變敘葉號歎嚇嗎聽啟吳員喚問啞喬單喲喪喫噴嚮嚴囉團園圍國圖圓聖場壞塊堅壇壓壘壯聲處備複夠夢夥奧奪奮婦媽嬰學寧寶實審寫寬對尋導將專屬層嶺嶽峽崗島嶄巖帥帳帶幫幣幹庫廢廣廳彈強歸錄彥後徑從復德徵徹恆愛慘慣態慾憂憑懷總戀戰戲戶拋挾損換據掙揀揮搶攝攜擺搖撐撲擴擔擬擁攔攙擊數斂斃斷時晉晝曆曉暫術樸機權條來楊極構標樣樹橋檔檢欄歐歡歲歷歸殘殺殼毀氣漢湯溝滅滿濱災為烏無煉煙煩燒營爐爭愛爾牆獎獨獲獸現環產畫當疊痕發盡監盤盧眾著睏矚礎禮禍離種穀積稱穩窮竄競筆範築簡簽籌類糧緊糾紀約紅紋納純紙級紛紡終組結絕統經綠維網羅罰職聯聖聞聰聲聳膽臉臨舉舊艦艷藝節範莊華萬葉著葯蘇處虛號蝕衝補裝裡製複見規視覺覽觀觸譯議護豐貝貞負財責賢敗賬貨質貪貫貴費賀賴贊贏趕趙跡踐躍車軌輪輯輸轉輕辦邊遼達遷過運還這進遠違連週適選遺郵鄉鄧鄭醞釋醫醜釐鐘鐵鑒長門閉開閃間關隊階險隨隱難靈靜韓響頁頂項順預領頭顯風飛飯飲餘館馬駛駭鬥魚鳥麗麥黃點齊龍龜';
        const simplified = '万与专业东丝丢两严丧个丰临为丽举么义乌乐乔习乡书买乱争于亚产亩亲亿仅从仑仓仪们价众优会伞伟传伤伦伪体余来侠侣侥侦侧侨仆伪尽兑儿党关兴养兽内冈册写军农冯冲决况冻净准凉减凑几凤凭凯划剧刘剑剂劲动务胜劳势勋汇区医华协单卖卢卫却厂历厉压厌县参双发变叙叶号叹吓吗听启吴员唤问哑乔单哟丧吃喷向严啰团园围国图圆圣场坏块坚坛压垒壮声处备复够梦伙奥夺奋妇妈婴学宁宝实审写宽对寻导将专属层岭岳峡岗岛崭岩帅帐带帮币干库废广厅弹强归录彦后径从复德征彻恒爱惨惯态欲忧凭怀总恋战戏户抛挟损换据挣拣挥抢摄携摆摇撑扑扩担拟拥拦搀击数敛毙断时晋昼历晓暂术朴机权条来杨极构标样树桥档检栏欧欢岁历归残杀壳毁气汉汤沟灭满滨灾为乌无炼烟烦烧营炉争爱尔墙奖独获兽现环产画当叠痕发尽监盘卢众着困瞩础礼祸离种谷积称稳穷窜竞笔范筑简签筹类粮紧纠纪约红纹纳纯纸级纷纺终组结绝统经绿维网罗罚职联圣闻聪声耸胆脸临举旧舰艳艺节范庄华万叶着药苏处虚号蚀冲补装里制复见规视觉览观触译议护丰贝贞负财责贤败账货质贪贯贵费贺赖赞赢赶赵迹践跃车轨轮辑输转轻办边辽达迁过运还这进远违连周适选遗邮乡邓郑酝释医丑厘钟铁鉴长门闭开闪间关队阶险随隐难灵静韩响页顶项顺预领头显风飞饭饮余馆马驶骇斗鱼鸟丽麦黄点齐龙龟';
        const map = new Map([...traditional].map((char, index) => [char, simplified[index] || char]));
        return [...value].map((char) => map.get(char) || char).join('');
    };

    const loadOpenCC = () => {
        if (openCCConverter) return Promise.resolve(openCCConverter);
        if (openCCPromise) return openCCPromise;

        openCCPromise = new Promise((resolve) => {
            if (window.OpenCC?.Converter) {
                openCCConverter = window.OpenCC.Converter({ from: 'hk', to: 'cn' });
                resolve(openCCConverter);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/t2cn.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                if (window.OpenCC?.Converter) {
                    openCCConverter = window.OpenCC.Converter({ from: 'hk', to: 'cn' });
                }
                resolve(openCCConverter);
            };
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });

        return openCCPromise;
    };

    const translateCore = (core, language) => {
        if (!core) return core;

        if (language === 'zh-HK') {
            return HK[core] || replaceKnownPhrases(core, sortedHKEntries);
        }

        if (language === 'en') {
            return EN[core] || replaceKnownPhrases(core, sortedEnglishEntries);
        }

        const traditional = HK[core] || replaceKnownPhrases(core, sortedHKEntries);
        return openCCConverter ? openCCConverter(traditional) : fallbackSimplify(traditional);
    };

    const shouldSkipNode = (node) => {
        const parent = node.parentElement;
        if (!parent) return true;
        return Boolean(parent.closest('script, style, noscript, code, pre, .language-switcher, .page-transition__grid'));
    };

    const applyTextNode = (node) => {
        if (!(node instanceof Text) || shouldSkipNode(node)) return;
        const current = node.nodeValue || '';
        if (!current.trim()) return;

        if (!textSources.has(node)) textSources.set(node, current);
        const source = textSources.get(node);
        const core = source.trim();
        const translated = translateCore(core, currentLanguage);
        const next = preserveWhitespace(source, translated);

        if (current !== next) node.nodeValue = next;
        renderedText.set(node, next);
    };

    const translatableAttributes = ['aria-label', 'placeholder', 'alt', 'title'];

    const applyAttributes = (element) => {
        if (!(element instanceof Element) || element.closest('.language-switcher')) return;
        let sources = attributeSources.get(element);
        if (!sources) {
            sources = new Map();
            attributeSources.set(element, sources);
        }

        translatableAttributes.forEach((attribute) => {
            if (!element.hasAttribute(attribute)) return;
            if (!sources.has(attribute)) sources.set(attribute, element.getAttribute(attribute) || '');
            const source = sources.get(attribute);
            if (!source) return;
            const translated = translateCore(source, currentLanguage);
            if (element.getAttribute(attribute) !== translated) element.setAttribute(attribute, translated);
        });
    };

    const scan = (root = document) => {
        mutationLock = true;
        try {
            if (root instanceof Text) applyTextNode(root);
            if (root instanceof Element) applyAttributes(root);

            const walker = document.createTreeWalker(
                root instanceof Document ? root.documentElement : root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode(node) {
                        return shouldSkipNode(node) || !(node.nodeValue || '').trim()
                            ? NodeFilter.FILTER_REJECT
                            : NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let node;
            while ((node = walker.nextNode())) applyTextNode(node);
            root.querySelectorAll?.('[aria-label], [placeholder], [alt], [title]').forEach(applyAttributes);
        } finally {
            mutationLock = false;
        }
    };

    const updatePageMetadata = () => {
        const page = PAGE_INFO[getPageName()] || PAGE_INFO['index.html'];
        document.title = currentLanguage === 'en'
            ? page.enTitle
            : currentLanguage === 'zh-CN'
                ? (openCCConverter ? openCCConverter(page.hkTitle) : fallbackSimplify(page.hkTitle))
                : page.hkTitle;

        const description = document.querySelector('meta[name="description"]');
        if (description) {
            description.content = currentLanguage === 'en'
                ? page.enDescription
                : currentLanguage === 'zh-CN'
                    ? (openCCConverter ? openCCConverter(page.hkDescription) : fallbackSimplify(page.hkDescription))
                    : page.hkDescription;
        }
    };

    const updateDatabaseNameLayout = () => {
        document.querySelectorAll('.card .name .zh').forEach((element) => {
            element.hidden = true;
        });
    };

    const updateSwitcher = () => {
        document.querySelectorAll('.language-switcher button[data-language]').forEach((button) => {
            const active = button.dataset.language === currentLanguage;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };

    const createSwitcher = () => {
        const header = document.querySelector('[data-header]');
        if (!header || header.querySelector('.language-switcher')) return;

        const switcher = document.createElement('div');
        switcher.className = 'language-switcher';
        switcher.setAttribute('role', 'group');
        switcher.setAttribute('aria-label', 'Language / 語言');
        switcher.innerHTML = `
            <button type="button" data-language="zh-HK" aria-pressed="false">繁體中文</button>
            <button type="button" data-language="en" aria-pressed="false">English</button>
            <button type="button" data-language="zh-CN" aria-pressed="false">简体中文</button>`;

        const status = header.querySelector('.site-header__status');
        header.insertBefore(switcher, status || null);
        header.classList.add('has-language-switcher');

        switcher.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-language]');
            if (!button) return;
            setLanguage(button.dataset.language, true);
        });
    };

    const announceLanguage = () => {
        let live = document.querySelector('.language-announcer');
        if (!live) {
            live = document.createElement('div');
            live.className = 'language-announcer sr-only';
            live.setAttribute('aria-live', 'polite');
            document.body.appendChild(live);
        }

        live.textContent = currentLanguage === 'en'
            ? 'Language changed to English.'
            : currentLanguage === 'zh-CN'
                ? '语言已切换为简体中文。'
                : '語言已切換為繁體中文。';
    };

    async function setLanguage(language, announce = false) {
        if (!SUPPORTED.includes(language)) language = DEFAULT_LANGUAGE;
        currentLanguage = language;
        localStorage.setItem(STORAGE_KEY, language);
        document.documentElement.lang = language;
        document.body.dataset.language = language;
        document.body.classList.add('is-language-switching');

        if (language === 'zh-CN') await loadOpenCC();

        scan(document);
        updatePageMetadata();
        updateSwitcher();
        updateDatabaseNameLayout();

        window.setTimeout(() => document.body.classList.remove('is-language-switching'), 260);
        if (announce) announceLanguage();

        window.dispatchEvent(new CustomEvent('bhr:languagechange', {
            detail: { language }
        }));
    }

    const injectStyles = () => {
        if (document.getElementById('bhr-i18n-style')) return;
        const link = document.createElement('link');
        link.id = 'bhr-i18n-style';
        link.rel = 'stylesheet';
        link.href = 'assets/i18n.css';
        document.head.appendChild(link);
    };

    injectStyles();
    createSwitcher();

    const storedLanguage = localStorage.getItem(STORAGE_KEY);
    const initialLanguage = SUPPORTED.includes(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;

    const observer = new MutationObserver((mutations) => {
        if (mutationLock) return;
        mutations.forEach((mutation) => {
            if (mutation.type === 'characterData') {
                const node = mutation.target;
                const rendered = renderedText.get(node);
                if (rendered !== node.nodeValue) textSources.set(node, node.nodeValue || '');
                applyTextNode(node);
                return;
            }

            mutation.addedNodes.forEach((node) => {
                if (node instanceof Text || node instanceof Element) scan(node);
            });

            if (mutation.type === 'attributes') {
                const element = mutation.target;
                const sources = attributeSources.get(element);
                if (sources && mutation.attributeName) {
                    sources.set(mutation.attributeName, element.getAttribute(mutation.attributeName) || '');
                }
                applyAttributes(element);
            }
        });
        updateDatabaseNameLayout();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: translatableAttributes
    });

    window.BHR_I18N = {
        get language() {
            return currentLanguage;
        },
        setLanguage,
        translate(value, language = currentLanguage) {
            return translateCore(value, language);
        }
    };

    setLanguage(initialLanguage, false);
})();
