import './style.css';

const CATEGORIES = [
  { id: 'llm', name: '大语言模型', icon: '🤖' },
  { id: 'image', name: 'AI图像', icon: '🎨' },
  { id: 'video', name: 'AI视频', icon: '🎬' },
  { id: 'audio', name: 'AI音频', icon: '🎵' },
  { id: 'coding', name: 'AI编程', icon: '💻' },
  { id: 'product', name: '产品动态', icon: '🚀' },
  { id: 'research', name: '研究论文', icon: '📄' },
  { id: 'business', name: '商业投资', icon: '💰' },
];

// Demo news data. In production, this should come from a backend/RSS/API.
const NEWS = [
  { id: 1, title: 'OpenAI 发布 GPT-5 系列新模型', category: 'llm', source: 'OpenAI', time: '2026-07-18', summary: '更强大的推理与多模态能力，支持更长的上下文窗口。', content: 'OpenAI 正式推出了 GPT-5 系列模型，重点提升了复杂推理、代码生成和多模态理解能力。新模型支持最高 256K 上下文，API 价格与 GPT-4o 持平。', url: 'https://openai.com' },
  { id: 2, title: 'Claude 4 新增视频理解功能', category: 'llm', source: 'Anthropic', time: '2026-07-17', summary: 'Claude 现在可以分析视频片段并生成时间戳摘要。', content: 'Anthropic 宣布 Claude 4 支持视频输入，用户可上传视频文件，模型会自动提取关键帧并生成带时间戳的摘要。该功能首先向 Pro 用户开放。', url: 'https://anthropic.com' },
  { id: 3, title: 'Midjourney V8 发布：生成速度翻倍', category: 'image', source: 'Midjourney', time: '2026-07-16', summary: '新版本在保持画质的同时，出图速度提升约 2 倍。', content: 'Midjourney V8 引入了新的扩散模型架构，宣称在相同硬件下生成速度提升两倍，同时支持更精细的文本渲染和角色一致性控制。', url: 'https://midjourney.com' },
  { id: 4, title: 'Runway Gen-5 支持 4K 视频生成', category: 'video', source: 'Runway', time: '2026-07-15', summary: '可直接生成最长 20 秒、4K 分辨率的电影级镜头。', content: 'Runway 推出 Gen-5 视频生成模型，支持 4K 输出和更稳定的物理运动模拟。新功能面向企业客户和视频创作者。', url: 'https://runwayml.com' },
  { id: 5, title: 'Suno 4.0 让 AI 音乐更长更连贯', category: 'audio', source: 'Suno', time: '2026-07-14', summary: '最长可生成 8 分钟音乐，歌曲结构更加完整。', content: 'Suno 4.0 改进了长序列建模能力，可生成完整长度的歌曲，包括引子、主歌、副歌和桥段，并支持更细腻的风格提示。', url: 'https://suno.ai' },
  { id: 6, title: 'GitHub Copilot 推出 Agent Mode', category: 'coding', source: 'GitHub', time: '2026-07-13', summary: 'AI 代理可自动规划、执行并提交代码改动。', content: 'GitHub Copilot 的 Agent Mode 允许开发者用自然语言描述任务，AI 自动分析代码库、修改多文件、运行测试并创建 PR。', url: 'https://github.com' },
  { id: 7, title: 'Google 发布 AI 眼镜 Project Astra', category: 'product', source: 'Google', time: '2026-07-12', summary: '实时视觉助手，支持翻译、导航和物体识别。', content: 'Google 重启 AR 眼镜项目 Project Astra，集成 Gemini 多模态模型，可实时分析用户所见内容，提供翻译、导航和记忆辅助。', url: 'https://google.com' },
  { id: 8, title: 'Meta 开源 Llama 4 405B 模型', category: 'llm', source: 'Meta', time: '2026-07-11', summary: '开源社区迎来最强开放权重模型。', content: 'Meta 发布 Llama 4 系列，其中 405B 参数版本在多项基准测试中接近 GPT-5，模型权重向研究和商业用途开放。', url: 'https://ai.meta.com' },
  { id: 9, title: 'MIT 新研究：AI 模型涌现推理能力', category: 'research', source: 'MIT', time: '2026-07-10', summary: '研究揭示大规模模型在特定任务上自发形成推理路径。', content: 'MIT 团队通过机制可解释性研究发现，足够大的 Transformer 会在训练过程中自发涌现出模块化的推理路径，类似人类工作记忆。', url: 'https://mit.edu' },
  { id: 10, title: 'xAI 完成 120 亿美元融资', category: 'business', source: 'TechCrunch', time: '2026-07-09', summary: '估值突破 700 亿美元，资金用于扩建孟菲斯算力中心。', content: '埃隆·马斯克旗下 xAI 完成 120 亿美元 C 轮融资，估值超过 700 亿美元。公司表示将主要用于建设更强大的 AI 训练集群。', url: 'https://techcrunch.com' },
];

const $app = document.querySelector('#app');
let currentTab = 'feed';
let selectedCategory = 'all';
let detailNews = null;

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
  const filtered = NEWS.filter(n => selectedCategory === 'all' || n.category === selectedCategory)
                       .filter(n => prefs.following.includes(n.category));
  const chips = [{ id: 'all', name: '全部', icon: '🌐' }, ...CATEGORIES]
    .filter(c => c.id === 'all' || prefs.following.includes(c.id))
    .map(c => `<button class="chip ${selectedCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join('');

  let list = `<div class="empty">暂无内容，先去「分类」关注几个主题吧</div>`;
  if (filtered.length) {
    list = filtered.map(n => `
      <article class="card" data-id="${n.id}">
        <div class="card-top">
          <div class="thumb">${CATEGORIES.find(c => c.id === n.category)?.icon || '📰'}</div>
          <div class="card-body">
            <h3 class="card-title">${n.title}</h3>
            <div class="card-meta"><span>${CATEGORIES.find(c => c.id === n.category)?.name}</span>${n.source} · ${n.time}</div>
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
        <div class="cat-item"><div class="name"><span>📱</span>AI动态 App</div><span style="color:var(--text2);font-size:.8rem;">v1.0</span></div>
        <div class="cat-item"><div class="name"><span>🔧</span>构建于 Vite + Capacitor</div></div>
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
        <div class="time">${detailNews.source} · ${detailNews.time}</div>
        <p>${detailNews.content}</p>
        <p>原文链接：<a href="${detailNews.url}" target="_blank" rel="noopener">${detailNews.url}</a></p>
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
      const id = Number(card.dataset.id);
      detailNews = NEWS.find(n => n.id === id) || null;
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
  const back = document.getElementById('back');
  if (back) back.onclick = () => { detailNews = null; render(); };
  const share = document.getElementById('share');
  if (share && detailNews) share.onclick = () => {
    if (navigator.share) navigator.share({ title: detailNews.title, text: detailNews.summary, url: detailNews.url });
    else alert('分享：' + detailNews.title);
  };
  const refresh = document.getElementById('refresh');
  if (refresh) refresh.onclick = () => {
    refresh.style.transform = 'rotate(360deg)';
    setTimeout(() => { refresh.style.transform = 'none'; alert('已刷新（演示数据）'); }, 400);
  };
}

render();
