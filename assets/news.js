(() => {
  'use strict';
  const root=document.querySelector('[data-news-root]');
  const data=window.BHR_NEWS_DATA, view=window.BHR_NEWS_VIEW;
  if(!root || !data || !view) return; // The generated HTML remains usable.
  root.classList.add('news-interactive');
  const params=new URLSearchParams(location.search);
  const filters={region:['tw','global','cn'].includes(params.get('region'))?params.get('region'):'all',category:['version','story','event','supply','equipment','outfit','media'].includes(params.get('category'))?params.get('category'):'all',search:''};
  const language=()=>view.language(window.BHR_I18N?.language || document.documentElement.lang);
  function render() {
    const active=document.activeElement;
    const saved=root.contains(active)?{id:active.id,start:active.selectionStart,end:active.selectionEnd}:null;
    root.innerHTML=view.shell(data,language(),root.dataset.newsMode,filters);
    if(saved?.id) {
      const target=document.getElementById(saved.id);
      target?.focus({preventScroll:true});
      if(target?.type==='search' && saved.start!==null) target.setSelectionRange(saved.start,saved.end);
    }
  }
  function updateResults() {
    const target=root.querySelector('[data-news-results]');
    if(target) target.innerHTML=view.results(data,language(),filters,Date.now());
  }
  root.addEventListener('submit',event=>event.preventDefault());
  root.addEventListener('input',event=>{
    if(event.target.name==='search') { filters.search=event.target.value; updateResults(); }
  });
  root.addEventListener('change',event=>{
    if(['region','category'].includes(event.target.name)) {
      filters[event.target.name]=event.target.value; updateResults();
    }
  });
  root.addEventListener('click',event=>{
    if(!event.target.closest('[data-news-reset]')) return;
    filters.region='all'; filters.category='all'; filters.search='';
    render(); root.querySelector('#news-search')?.focus();
  });
  for(const event of ['bhr:languagechange','bhr:translationsready']) window.addEventListener(event,render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) render();});
  setInterval(()=>{if(!document.hidden) render();},60000);
  render();
})();
