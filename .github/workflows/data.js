const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxrZEpSFXMFXZSDPE0uZbgepPOMChZm3kLn7Kou8OT9oEt7eC0y0lG0Q7VkA7arah3rVg/exec";

        let allVideos = [];
        let currentFilter = 'all';

        async function fetchVideos() {
            const grid = document.getElementById('videoGrid');
            try {
                const response = await fetch(SHEET_API_URL);
                const data = await response.json();
                allVideos = data.reverse().filter(v => v.Title && v.VideoUrl); 

                if(allVideos.length > 0) {
                    updateHeroSection(allVideos[0]); 
                    generateCategoryPills(allVideos); 
                    renderVideos(allVideos); 
                } else {
                    grid.innerHTML = '<div class="loader-msg">No videos found.</div>';
                }
            } catch (error) {
                grid.innerHTML = '<div class="loader-msg">Failed to connect to database.</div>';
            }
        }

        function updateHeroSection(latestVideo) {
            document.getElementById('heroTitle').textContent = latestVideo.Title;
            const heroVid = document.getElementById('heroBgVideo');
            const heroSource = document.getElementById('heroVideoSource');
            heroSource.src = latestVideo.VideoUrl;
            heroVid.load();

            heroVid.onloadedmetadata = function() {
                let duration = heroVid.duration;
                let startTime = duration > 15 ? duration * 0.2 : 0;
                let endTime = duration > 15 ? startTime + 10 : duration;
                heroVid.currentTime = startTime;
                heroVid.ontimeupdate = function() {
                    if (heroVid.currentTime >= endTime) heroVid.currentTime = startTime;
                };
                heroVid.play().catch(e => {});
            };
            document.getElementById('heroPlayBtn').onclick = () => openModal(latestVideo.VideoUrl);
        }

        function generateCategoryPills(videos) {
            const container = document.getElementById('categoryContainer');
            let uniqueTags = new Set();
            videos.forEach(v => {
                if(v.Tags) v.Tags.split(',').forEach(t => uniqueTags.add(t.trim()));
            });
            uniqueTags.forEach(tag => {
                const pill = document.createElement('div');
                pill.className = 'pill';
                pill.setAttribute('data-filter', tag.toLowerCase());
                pill.textContent = tag;
                container.appendChild(pill);
            });
            document.querySelectorAll('.pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                    e.target.classList.add('active');
                    currentFilter = e.target.getAttribute('data-filter');
                    applySearchAndFilter();
                });
            });
        }

        function renderVideos(videosToRender) {
            const grid = document.getElementById('videoGrid');
            grid.innerHTML = '';
            if (videosToRender.length === 0) {
                grid.innerHTML = '<div class="loader-msg">No matching videos found.</div>';
                return;
            }
            videosToRender.forEach(video => {
                let tagsHTML = '';
                const tagArray = video.Tags ? video.Tags.split(',').map(t => t.trim()) : [];
                tagArray.forEach(tag => tagsHTML += `<span class="tag">#${tag}</span>`);

                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <div class="thumbnail" style="background-image: url('${video.ThumbnailUrl || ''}');">
                        <div class="play-overlay">▶</div>
                    </div>
                    <div class="card-info"><h3>${video.Title}</h3></div>
                    <div class="tag-container">${tagsHTML}</div>
                `;
                card.addEventListener('click', () => openModal(video.VideoUrl));
                grid.appendChild(card);
            });
        }

        function applySearchAndFilter() {
            const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
            const filteredVideos = allVideos.filter(video => {
                const title = (video.Title || "").toLowerCase();
                const tagsStr = (video.Tags || "").toLowerCase();
                const tagsArray = tagsStr.split(',').map(t => t.trim());
                const matchesSearch = title.includes(searchQuery) || tagsStr.includes(searchQuery);
                const matchesCategory = (currentFilter === 'all') || tagsArray.includes(currentFilter);
                return matchesSearch && matchesCategory;
            });
            renderVideos(filteredVideos);
        }

        document.getElementById('searchInput').addEventListener('input', applySearchAndFilter);

        const themeToggle = document.getElementById('themeToggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            themeToggle.textContent = document.body.classList.contains('light-mode') ? '🌙' : '☀️';
        });

        const mobileSearchBtn = document.getElementById('mobileSearchBtn'), searchContainer = document.getElementById('searchContainer'), closeSearchBtn = document.getElementById('closeSearchBtn'), searchInput = document.getElementById('searchInput');
        mobileSearchBtn.addEventListener('click', () => { searchContainer.classList.add('active'); searchInput.focus(); });
        closeSearchBtn.addEventListener('click', () => { searchContainer.classList.remove('active'); searchInput.value = ''; applySearchAndFilter(); });

        const modal = document.getElementById('videoModal'), player = document.getElementById('mainPlayer'), videoSource = document.getElementById('videoSource');
        function openModal(videoUrl) { videoSource.src = videoUrl; player.load(); modal.classList.add('active'); document.body.style.overflow = 'hidden'; player.play().catch(()=>{}); }
        function closeModal() { modal.classList.remove('active'); document.body.style.overflow = 'auto'; player.pause(); }
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        fetchVideos();