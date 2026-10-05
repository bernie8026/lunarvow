/* Shared static and browser rendering for the official-news snapshot. */
(function (scope) {
  'use strict';
  const labels = {
    'zh-HK': {
      title:'最新消息', checked:'官方資料核對', note:'按地區整理官方消息。大陸服活動唔代表台港澳服同步開放；消息按以下核對日整理。',
      tw:'台港澳', global:'國際服', cn:'大陸服', all:'全部地區', allTypes:'全部類別',
      version:'版本', story:'劇情', event:'活動', supply:'補給', equipment:'裝備／系統', outfit:'服裝', media:'音樂',
      source:'官方來源', announced:'公告', active:'進行中', upcoming:'尚未開始', ended:'已結束', notice:'版本公告',
      period:'期間', timezone:'UTC+08:00', unknown:'完整日程見官方公告', focus:'月下重點',
      portrait:'月下誓約・予愛以心角色立繪', art:'角色立繪／HoYoverse',
      region:'地區', category:'類別', search:'搜尋消息', placeholder:'角色、活動或版本…',
      count:'則消息', empty:'冇符合條件嘅消息。可以清除搜尋或改選地區。', reset:'重設篩選',
      browse:'查看全部消息', archive:'返回劇情檔案', archiveNote:'主線同艦長線整理（含劇透）',
      snapshot:'版本資料截至', statusNote:'有完整時區嘅活動會按時間標示狀態；其餘日程請睇官方公告。',
      stale:'核對已超過 14 日，請開啟官方來源查看後續公告。', timeNote:'主線任務期限唔代表劇情會移除。'
    },
    en: {
      title:'Latest News', checked:'Official sources checked', note:'Official announcements by region. CN events do not confirm TW/HK/MO availability. This snapshot was checked on the date below.',
      tw:'TW / HK / MO', global:'Global', cn:'Mainland CN', all:'All regions', allTypes:'All categories',
      version:'Version', story:'Story', event:'Events', supply:'Supply', equipment:'Equipment / Systems', outfit:'Outfits', media:'Music',
      source:'Official source', announced:'Announcement', active:'Ongoing', upcoming:'Upcoming', ended:'Ended', notice:'Announcement',
      period:'Period', timezone:'UTC+08:00', unknown:'Full schedule in the official announcement', focus:'Lunar Vow spotlight',
      portrait:'Lunar Vow: Crimson Love character artwork', art:'Character artwork / HoYoverse',
      region:'Region', category:'Category', search:'Search news', placeholder:'Character, event or version…',
      count:'announcements', empty:'No matching news. Clear the search or select another region.', reset:'Reset filters',
      browse:'View all news', archive:'Open story archive', archiveNote:'Main story & Captainverse overview (spoilers)',
      snapshot:'Versions checked on', statusNote:'Events with a verified time zone show timed status; check official sources for other schedules.',
      stale:'Last checked over 14 days ago. Open the official sources for newer announcements.', timeNote:'Story mission deadlines do not mean the story is removed.'
    },
    'zh-CN': {
      title:'最新消息', checked:'官方资料核对', note:'按地区整理官方消息。大陆服活动不代表台港澳服同步开放；消息按以下核对日整理。',
      tw:'台港澳', global:'国际服', cn:'大陆服', all:'全部地区', allTypes:'全部类别',
      version:'版本', story:'剧情', event:'活动', supply:'补给', equipment:'装备／系统', outfit:'服装', media:'音乐',
      source:'官方来源', announced:'公告', active:'进行中', upcoming:'尚未开始', ended:'已结束', notice:'版本公告',
      period:'期间', timezone:'UTC+08:00', unknown:'完整日程见官方公告', focus:'月下重点',
      portrait:'月下誓约・予爱以心角色立绘', art:'角色立绘／HoYoverse',
      region:'地区', category:'类别', search:'搜索消息', placeholder:'角色、活动或版本…',
      count:'则消息', empty:'没有符合条件的消息。可以清除搜索或改选地区。', reset:'重设筛选',
      browse:'查看全部消息', archive:'返回剧情档案', archiveNote:'主线及舰长线整理（含剧透）',
      snapshot:'版本资料截至', statusNote:'有完整时区的活动会按时间标示状态；其余日程请查看官方公告。',
      stale:'核对已超过 14 日，请打开官方来源查看后续公告。', timeNote:'主线任务期限不代表剧情会移除。'
    }
  };
  const language = lang => labels[lang] ? lang : 'zh-HK';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const date = value => value.replaceAll('-', '.');
  const text = (item, lang) => item.content[language(lang)];
  function status(item, now) {
    if (item.endsAt && now >= Date.parse(item.endsAt)) return 'ended';
    if (item.startsAt && now < Date.parse(item.startsAt)) return 'upcoming';
    if (item.endsAt) return 'active';
    return 'notice';
  }
  const normalized = value => value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  function select(data, filters = {}, now = Date.now()) {
    const query = normalized(filters.search || '');
    return data.items.filter(item =>
      (!filters.region || filters.region === 'all' || item.regions.includes(filters.region)) &&
      (!filters.category || filters.category === 'all' || item.category === filters.category) &&
      (!query || normalized(Object.values(item.content).flatMap(c => [c.title, c.summary]).join(' ') + ' ' + item.version).includes(query))
    ).sort((a,b) => b.announcedOn.localeCompare(a.announcedOn) || a.id.localeCompare(b.id));
  }
  function card(item, lang, now, spotlight = false) {
    const l = labels[language(lang)], c = text(item,lang), state = status(item,now);
    const sources = item.sources.map((source,index) => '<a class="news-source" href="'+escape(source.url)+'" target="_blank" rel="noopener noreferrer">'+l.source+(item.sources.length>1?' '+(index+1):'')+' ↗<span class="sr-only"> — '+escape(c.title)+'</span></a>').join('');
    return '<article class="news-card'+(spotlight?' news-card--spotlight':'')+'" id="'+(spotlight?'spotlight-':'news-')+escape(item.id)+'" data-news-id="'+escape(item.id)+'">'+
      (spotlight?'<figure class="news-portrait"><img src="assets/hi3/characters/lunar-vow-crimson-love.webp" alt="'+l.portrait+'" width="960" height="660" loading="lazy" decoding="async"><figcaption>'+l.art+'</figcaption></figure>':'')+
      '<div class="news-card__body">'+
      (spotlight?'<p class="news-kicker">'+l.focus+'</p>':'')+
      '<div class="news-tags"><span class="news-region">'+item.regions.map(r=>l[r]).join(' / ')+'</span><span>'+l[item.category]+'</span><span>v'+escape(item.version)+'</span></div>'+
      '<p class="news-date">'+l.announced+' <time datetime="'+escape(item.announcedOn)+'">'+date(item.announcedOn)+'</time></p>'+
      '<h3>'+escape(c.title)+'</h3><p class="news-summary">'+escape(c.summary)+'</p>'+
      '<div class="news-period"><span class="news-status news-status--'+state+'">'+l[state]+'</span><p>'+escape(c.period||l.unknown)+
      (item.endsAt?' <span class="news-timezone">'+l.timezone+'</span>':'')+'</p></div>'+
      '<div class="news-sources">'+sources+'</div></div></article>';
  }
  function versions(data,lang) {
    const l=labels[language(lang)];
    return '<div class="news-versions" aria-label="'+l.snapshot+' '+date(data.checkedOn)+'">'+data.regions.map(region =>
      '<a class="news-version" href="'+escape(region.source)+'" target="_blank" rel="noopener noreferrer"><span>'+l[region.id]+'</span><strong>v'+escape(region.version)+'</strong><small>'+l.source+' ↗</small></a>').join('')+'</div>';
  }
  function controls(lang,filters) {
    const l=labels[language(lang)], options=(values,current)=>values.map(([v,label])=>'<option value="'+v+'"'+(v===current?' selected':'')+'>'+label+'</option>').join('');
    return '<form class="news-controls" role="search" aria-label="'+l.search+'">'+
      '<label for="news-search"><span>'+l.search+'</span><input id="news-search" name="search" type="search" autocomplete="off" value="'+escape(filters.search||'')+'" placeholder="'+l.placeholder+'" aria-controls="news-results"></label>'+
      '<label for="news-region"><span>'+l.region+'</span><select id="news-region" name="region" aria-controls="news-results">'+options([['all',l.all],['tw',l.tw],['global',l.global],['cn',l.cn]],filters.region||'all')+'</select></label>'+
      '<label for="news-category"><span>'+l.category+'</span><select id="news-category" name="category" aria-controls="news-results">'+options([['all',l.allTypes],...['version','story','event','supply','equipment','outfit','media'].map(x=>[x,l[x]])],filters.category||'all')+'</select></label></form>';
  }
  function results(data,lang,filters,now) {
    const l=labels[language(lang)], items=select(data,filters,now);
    return '<p class="news-count" role="status" aria-live="polite" aria-atomic="true">'+items.length+' '+l.count+'</p>'+
      (items.length?'<div class="news-grid">'+items.map(item=>card(item,lang,now)).join('')+'</div>':'<div class="news-empty"><p>'+l.empty+'</p><button type="button" data-news-reset>'+l.reset+'</button></div>');
  }
  function shell(data,lang,mode,filters={},now=Date.now()) {
    const l=labels[language(lang)];
    const header='<div class="news-intro"><p>'+l.note+'</p><p class="news-checked">'+l.checked+' <time datetime="'+data.checkedOn+'">'+date(data.checkedOn)+'</time></p></div>'+
      '<p class="news-stale" '+(now-Date.parse(data.checkedOn+'T23:59:59+08:00')>14*864e5?'':'hidden')+'>'+l.stale+'</p>'+
      versions(data,lang)+card(data.items.find(item=>item.id===data.spotlight),lang,now,true);
    if(mode==='home') return header+'<div class="news-grid news-grid--home">'+data.homeItems.map(id=>card(data.items.find(item=>item.id===id),lang,now)).join('')+'</div>'+
      '<div class="news-bottom"><a class="news-browse" href="news.html">'+l.browse+' <span aria-hidden="true">↗</span></a><a class="news-story-link" href="story.html">'+l.archive+' →<small>'+l.archiveNote+'</small></a></div>';
    return header+'<div class="news-directory"><h2>'+l.title+'</h2><p class="news-help">'+l.statusNote+' '+l.timeNote+'</p>'+
      controls(lang,filters)+'<div id="news-results" data-news-results>'+results(data,lang,filters,now)+'</div></div>';
  }
  const api={labels,language,status,select,card,shell,results,versions};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else scope.BHR_NEWS_VIEW=api;
})(typeof window!=='undefined'?window:globalThis);
