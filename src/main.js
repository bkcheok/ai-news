import './style.css';

const CATEGORIES = [
  { id: 'llm', name: '大语言模型', icon: '🤖', terms: ['llm', 'gpt', 'transformer', 'language-model', 'chat', 'agent', 'openai', 'claude', 'llama', 'qwen'] },
  { id: 'image', name: 'AI图像', icon: '🎨', terms: ['image', 'diffusion', 'stable-diffusion', 'midjourney', 'gan', 'vision'] },
  { id: 'video', name: 'AI视频', icon: '🎬', terms: ['video', 'animation', 'sora', 'runway', 'frame'] },
  { id: 'audio', name: 'AI音频', icon: '🎵', terms: ['audio', 'music', 'tts', 'voice', 'speech', 'suno', 'whisper'] },
  { id: 'coding', name: 'AI编程', icon: '💻', terms: ['code', 'coding', 'copilot', 'programming', 'developer', 'ide'] },
  { id: 'product', name: '产品动态', icon: '🚀', terms: ['app', 'tool', 'productivity', 'platform', 'assistant', 'browser', 'plugin'] },
  { id: 'research', name: '研究论文', icon: '📄', terms: ['paper', 'research', 'arxiv', 'benchmark', 'dataset'] },
  { id: 'business', name: '商业投资', icon: '💰', terms: ['startup', 'funding', 'market', 'investment', 'enterprise'] },
];

// Fallback demo data
const DEMO_NEWS = [
  { id: 'demo-1', title: 'OpenAI 发布 GPT-5 系列新模型', category: 'llm', source: 'OpenAI', time: '2026-07-18', summary: '更强大的推理与多模态能力，支持更长的上下文窗口。', content: 'OpenAI 正式推出了 GPT-5 系列模型，重点提升了复杂推理、代码生成和多模态理解能力。新模型支持最高 256K 上下文，API 价格与 GPT-4o 持平。', url: 'https://openai.com' },
  { id: 'demo-2', title: 'Claude 4 新增视频理解功能', category: 'llm', source: 'Anthropic', time: '2026-07-17', summary: 'Claude 现在可以分析视频片段并生成时间戳摘要。', content: 'Anthropic 宣布 Claude 4 支持视频输入，用户可上传视频文件，模型会自动提取关键帧并生成带时间戳的摘要。该功能首先向 Pro 用户开放。', url: 'https://anthropic.com' },
  { id: 'demo-3', title: 'Midjourney V8 发布：生成速度翻倍', category: 'image', source: 'Midjourney', time: '2026-07-16', summary: '新版本在保持画质的同时，出图速度提升约 2 倍。', content: 'Midjourney V8 引入了新的扩散模型架构，宣称在相同硬件下生成速度提升两倍，同时支持更精细的文本渲染和角色一致性控制。', url: 'https://midjourney.com' },
  { id: 'demo-4', title: 'Runway Gen-5 支持 4K 视频生成', category: 'video', source: 'Runway', time: '2026-07-15', summary: '可直接生成最长 20 秒、4K 分辨率的电影级镜头。', content: 'Runway 推出 Gen-5 视频生成模型，支持 4K 输出和更稳定的物理运动模拟。新功能面向企业客户和视频创作者。', url: 'https://runwayml.com' },
  { id: 'demo-5', title: 'Suno 4.0 让 AI 音乐更长更连贯', category: 'audio', source: 'Suno', time: '2026-07-14', summary: '最长可生成 8 分钟音乐，歌曲结构更加完整。', content: 'Suno 4.0 改进了长序列建模能力，可生成完整长度的歌曲，包括引子、主歌、副歌和桥段，并支持更细腻的风格提示。', url: 'https://suno.ai' },
  { id: 'demo-6', title: 'GitHub Copilot 推出 Agent Mode', category: 'coding', source: 'GitHub', time: '2026-07-13', summary: 'AI 代理可自动规划、执行并提交代码改动。', content: 'GitHub Copilot 的 Agent Mode 允许开发者用自然语言描述任务，AI 自动分析代码库、修改多文件、运行测试并创建 PR。', url: 'https://github.com' },
];

const GH_CACHE_KEY = 'gh_cache_v1';
const GH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const GH_QUERY = 'stars:>100 AI OR machine-learning OR llm OR diffusion OR transformer OR generative-ai OR chatgpt OR stable-diffusion';
const GH_API_URL = `https://api.github.com/search/repositories?q=${encodeURIComponent(GH_QUERY)}&sort=stars&order=desc&per_page=50`;

const $app = document.querySelector('#app');
let currentTab = 'feed';
let selectedCategory = 'all';
let detailNews = null;
let items = [];
let isLoading = false;
let loadError = null;

function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem('prefs') || '{}');
    return { following: saved.following || CATEGORIES.map(c => c.id), dark: saved.dark ?? true };
  } catch { return { following: CATEGORIES.map(c => c.id), dark: true }; }
}
let prefs = loadPrefs();
document.documentElement.setAttribute('data-theme', prefs.dark ? 'dark' : 'light');

function savePrefs() {
  localStorage.setItem('prefs', JSON.stringify(prefs));
}

function classify(repo) {
  const text = `${repo.name} ${repo.description || ''} ${repo.topics?.join(' ') || ''}`.toLowerCase();
  for (const c of CATEGORIES) {
    if (c.terms.some(t => text.includes(t))) return c.id;
  }
  return 'product';
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function fetchGitHub() {
  // Try cache first
  try {
    const cached = JSON.parse(localStorage.getItem(GH_CACHE_KEY) || '{}');
    if (cached.ts && Date.now() - cached.ts < GH_CACHE_TTL_MS && Array.isArray(cached.items)) {
      items = cached.items;
      return;
    }
  } catch {}

  isLoading = true; loadError = null; render();
  try {
    const res = await fetch(GH_API_URL, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    items = (data.items || []).map(repo => ({
      id: `gh-${repo.id}`,
      title: repo.name,
      category: classify(repo),
      source: repo.owner?.login || 'GitHub',
      time: formatDate(repo.updated_at || repo.created_at),
      summary: repo.description || '暂无描述',
      content: `🏷️ ${repo.full_name}\n\n⭐ Stars: ${formatNumber(repo.stargazers_count)}\n🍴 Forks: ${formatNumber(repo.forks_count)}\n💻 语言: ${repo.language || '未知'}\n\n${repo.description || '暂无描述'}`,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language,
      avatar: repo.owner?.avatar_url,
    }));
    localStorage.setItem(GH_CACHE_KEY, JSON.stringify({ ts: Date.now(), items }));
  } catch (e) {
    loadError = e.message;
    // Fallback to cache or demo
    try {
      const cached = JSON.parse(localStorage.getItem(GH_CACHE_KEY) || '{}');
      if (Array.isArray(cached.items) && cached.items.length) items = cached.items;
      else items = DEMO_NEWS;
    } catch { items = DEMO_NEWS; }
  } finally {
    isLoading = false;
    render();
  }
}

function renderHeader(title, action) {
  return `
    <header>
      <h1>${title}</h1>
      ${action || ''}
    </header>
  `;
}

function renderTabs() {
  return `
    <nav>
      <button class="${currentTab === 'feed' ? 'active' : ''}" data-tab="feed"><span class="emoji">🔥</span>动态</button>
      <button class="${currentTab === 'categories' ? 'active' : ''}" data-tab="categories"><span class="emoji">🏷️</span>分类</button>
      <button class="${currentTab === 'me' ? 'active' : ''}" data-tab="me"><span class="emoji">⚙️</span>我的</button>
    </nav>
  `;
}

function renderFeed() {
  const filtered = items.filter(n => selectedCategory === 'all' || n.category === selectedCategory)
                        .filter(n => prefs.following.includes(n.category));
  const chips = [{ id: 'all', name: '全部', icon: '🌐' }, ...CATEGORIES]
    .filter(c => c.id === 'all' || prefs.following.includes(c.id))
    .map(c => `<button class="chip ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join('');

  let list = '';
  if (isLoading) {
    list = `<div class="empty">正在加载 GitHub 热门 AI 项目…</div>`;
  } else if (loadError && !items.length) {
    list = `<div class="empty">加载失败：${loadError}<br>请检查网络连接</div>`;
  } else if (!filtered.length) {
    list = `<div class="empty">暂无内容，先去「分类」关注几个主题吧</div>`;
  } else {
    list = filtered.map(n => `
      <article class="card" data-id="${n.id}">
        <div class="card-top">
          <div class="thumb ${n.avatar ? 'img' : ''}" ${n.avatar ? `style="background-image:url('${n.avatar}')"` : ''}>
            ${n.avatar ? '' : (CATEGORIES.find(c => c.id === n.category)?.icon || '📰')}
          </div>
          <div class="card-body">
            <h3 class="card-title">${n.title}</h3>
            <div class="card-meta"><span>${CATEGORIES.find(c => c.id === n.category)?.name}</span>${n.source} · ${n.time}${n.stars ? ` · ⭐ ${formatNumber(n.stars)}` : ''}${n.language ? ` · 💻 ${n.language}` : ''}</div>
          </div>
        </div>
        <p class="card-summary">${n.summary}</p>
      </article>
    `).join('');
  }

  return renderHeader('AI动态', `<button class="icon-btn" id="refresh">↻</button>`) +
    `<main><div class="chips">${chips}</div>${list}</main>`;
}

function renderCategories() {
  const list = CATEGORIES.map(c => `
    <div class="cat-item" data-cat="${c.id}">
      <div class="name"><span>${c.icon}</span>${c.name}</div>
      <div class="toggle ${prefs.following.includes(c.id) ? 'on' : ''}"></div>
    </div>
  `).join('');
  return renderHeader('分类管理', '') + `<main><div class="section-title">选择你关注的 AI 领域</div><div class="cat-list">${list}</div></main>`;
}

function renderMe() {
  return renderHeader('我的', '') + `
    <main>
      <div class="section-title">外观</div>
      <div class="cat-list">
        <div class="cat-item" id="dark-toggle">
          <div class="name"><span>🌙</span>深色模式</div>
          <div class="toggle ${prefs.dark ? 'on' : ''}"></div>
        </div>
      </div>
      <div class="section-title">关于</div>
      <div class="cat-list">
        <div class="cat-item"><div class="name"><span>📱</span>AI动态 App</div><span style="color:var(--text2);font-size:.8rem;">v1.1</span></div>
        <div class="cat-item"><div class="name"><span>🔧</span>数据来自 GitHub Trending</div></div>
        <div class="cat-item" id="clear-cache"><div class="name"><span>🗑️</span>清除本地缓存</div></div>
      </div>
    </main>
  `;
}

function renderDetail() {
  if (!detailNews) return '';
  const c = CATEGORIES.find(c => c.id === detailNews.category) || { name: '资讯', icon: '📰' };
  return `
    <div class="detail">
      <div class="detail-header">
        <button class="icon-btn" id="back">←</button>
        <h2>详情</h2>
        <button class="icon-btn" id="share">⇧</button>
      </div>
      <div class="detail-content">
        <span class="tag">${c.icon} ${c.name}</span>
        <h3>${detailNews.title}</h3>
        <div class="time">${detailNews.source} · ${detailNews.time}${detailNews.stars ? ` · ⭐ ${formatNumber(detailNews.stars)}` : ''}</div>
        <p>${(detailNews.content || '').replace(/\n/g, '</p><p>')}</p>
        <p>链接：<a href="${detailNews.url}" target="_blank" rel="noopener">${detailNews.url}</a></p>
      </div>
    </div>
  `;
}

function render() {
  let content = '';
  if (currentTab === 'feed') content = renderFeed();
  else if (currentTab === 'categories') content = renderCategories();
  else content = renderMe();
  $app.innerHTML = content + renderTabs() + renderDetail();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('nav button').forEach(btn => {
    btn.onclick = () => { currentTab = btn.dataset.tab; render(); };
  });
  document.querySelectorAll('.chips .chip').forEach(btn => {
    btn.onclick = () => { selectedCategory = btn.dataset.cat; render(); };
  });
  document.querySelectorAll('.card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.id;
      detailNews = items.find(n => String(n.id) === String(id)) || null;
      render();
    };
  });
  document.querySelectorAll('.cat-item[data-cat]').forEach(item => {
    item.onclick = () => {
      const cat = item.dataset.cat;
      if (prefs.following.includes(cat)) prefs.following = prefs.following.filter(c => c !== cat);
      else prefs.following.push(cat);
      savePrefs();
      render();
    };
  });
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle) {
    darkToggle.onclick = () => {
      prefs.dark = !prefs.dark;
      document.documentElement.setAttribute('data-theme', prefs.dark ? 'dark' : 'light');
      savePrefs();
      render();
    };
  }
  const clearCache = document.getElementById('clear-cache');
  if (clearCache) {
    clearCache.onclick = () => {
      localStorage.removeItem(GH_CACHE_KEY);
      alert('缓存已清除，下次刷新将重新获取');
    };
  }
  const back = document.getElementById('back');
  if (back) back.onclick = () => { detailNews = null; render(); };
  const share = document.getElementById('share');
  if (share && detailNews) share.onclick = () => {
    if (navigator.share) navigator.share({ title: detailNews.title, text: detailNews.summary, url: detailNews.url });
    else alert('分享：' + detailNews.title);
  };
  const refresh = document.getElementById('refresh');
  if (refresh) refresh.onclick = () => {
    localStorage.removeItem(GH_CACHE_KEY);
    fetchGitHub();
  };
}

fetchGitHub();
