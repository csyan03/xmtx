const BASE_URL = "https://mx-1341045368.cos.ap-chengdu.myqcloud.com/";

const folders = [
  { id: "250227", bgm: "250227.mp3", media: ["250227-1.mp4", "250227-2.mp4", "250227-3.mp4"], date: "2025-02-27 20:18", text: "人总是真正经历失去，才会懂得珍惜#分享照片" },
  { id: "250217", bgm: "250217.mp3", media: ["250217-1.mp4"], date: "2025-02-17 10:49", text: "#生活碎片" },
  { id: "250115", bgm: "250115.mp3", media: ["250115-1.mp4", "250115-2.mp4"], date: "2025-01-15 11:14", text: "#人类幼崽 姨姨带娃，有福啦！" },
  { id: "250101", bgm: "250101.mp3", media: ["250101-1.mp4", "250101-2.mp4", "250101-3.mp4", "250101-4.mp4"], date: "2025-01-01 14:54", text: "#分享照片" },
  { id: "241215", bgm: "241215.mp3", media: ["241215-1.mp4", "241215-2.mp4", "241215-3.mp4", "241215-4.webp"], date: "2024-12-15 17:41", text: "#生活碎片" },
  { id: "241128", bgm: "241128.mp3", media: ["241128-1.png"], date: "2024-11-28 19:44" },
  { id: "241123", bgm: "241123.mp3", media: ["241123-1.mp4", "241123-2.mp4", "241123-3.png"], date: "2024-11-23 21:15", text: "22" },
  { id: "241116", bgm: "241116.mp3", media: ["241116-1.mp4"], date: "2024-11-16 09:02", text: "祝自己小人得志" },
  { id: "241102", bgm: "241102.mp3", media: ["241102-1.jpeg", "241102-2.jpeg", "241102-3.jpeg"], date: "2024-11-02 00:07", text: "三张图，找三个人p。" },
  { id: "241010-1", bgm: "241010.mp3", media: ["241010-1-0.webp", "241010-2.webp"], date: "2024-10-10 12:37" },
  { id: "241005", bgm: "241005.mp3", media: ["241005-1.mp4"], date: "2024-10-05 18:41", text: "说遗憾也不是很遗憾说不遗憾也很遗憾" },
  { id: "241001", bgm: "241001.mp3", media: ["241001-1.webp", "241001-2.webp", "241001-3.webp", "241001-4.webp", "241001-5.webp"], date: "2024-10-01 23:18", text: "没有常青树做自己的自由花" },
  { id: "240930", bgm: "240930.mp3", media: ["240930-1.mp4"], date: "2024-09-30 00:20", text: "圆周率没有尽头，人们也只记得开头！" },
  { id: "240923-1", bgm: "240923.mp3", media: ["240923-1-0.webp"], date: "2024-09-23 01:14", text: "你承诺过的月亮，还是没有出现！" },
  { id: "240915", bgm: "240915.mp3", media: ["240915-1.webp", "240915-2.webp"], date: "2024-09-15 23:37", text: "幸福没有标准答案" },
  { id: "240910", bgm: "240910.mp3", media: ["240910-1.jpg", "240910-2.jpg"], date: "2024-09-10 23:08" },
  { id: "240904", bgm: "240904.mp3", media: ["240904-1.mp4"], date: "2024-09-04 01:28" },
  { id: "240826", bgm: "240826.mp3", media: ["240826-1.jpg"], date: "2024-08-26 22:57" },
  { id: "240624", bgm: "240624.mp3", media: ["240624-1.mp4"], date: "2024-06-24 23:21" }
];

// 生成所有需要预缓存的 URL 列表
const urlsToCache = folders.reduce((acc, folder) => {
  // 添加背景音乐
  if (folder.bgm) acc.push(`${BASE_URL}${folder.bgm}`);
  // 添加媒体文件
  folder.media.forEach(file => acc.push(`${BASE_URL}${file}`));
  // 添加缩略图
  acc.push(`${BASE_URL}${folder.id}-0.webp`);
  return acc;
}, []);

// 全局状态变量
let currentFolder = null;
let currentIndex = 0;
let currentFolderIndex = null;
let isHomeScrollEnabled = true;
let isMediaPlaying = false;
let nextFolderPreview = null;
let backdrop = null;

// 注册 Service Worker 并传递预缓存列表
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        // 等待 Service Worker 激活后发送消息
        navigator.serviceWorker.ready.then(() => {
          navigator.serviceWorker.controller?.postMessage({
            action: 'precache',
            urls: urlsToCache
          });
        });
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });
}

// 初始化网格（懒加载优化）
function initGrid() {
  const grid = document.querySelector(".grid");
  if (!grid) return;

  grid.innerHTML = folders.map((folder, index) => {
    const thumbnail = `${BASE_URL}${folder.id}-0.webp`;
    return `<div class="thumbnail" data-folder="${index}"><img data-src="${thumbnail}" class="thumb" alt="缩略图"></div>`;
  }).join('');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.onerror = () => console.error(`Failed to load thumbnail: ${img.dataset.src}`);
        observer.unobserve(img);
      }
    });
  }, { rootMargin: "50px" });

  grid.querySelectorAll(".thumb").forEach(img => observer.observe(img));
  grid.querySelectorAll(".thumbnail").forEach(thumb => {
    thumb.addEventListener("click", () => openFolder(thumb.dataset.folder));
  });
}

// 计算两点间距离
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 更新媒体计数器
function updateMediaCounter(container) {
  const counter = container.querySelector(".media-counter");
  if (counter) {
    const totalItems = container.querySelectorAll(".media-item").length;
    counter.textContent = `${currentIndex + 1}/${totalItems}`;
  }
}

// 创建黑色背景
function createBackdrop() {
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    document.body.appendChild(backdrop);
  }
}

// 打开文件夹
function openFolder(folderIndex) {
  currentFolderIndex = parseInt(folderIndex);
  const data = folders[folderIndex];
  const template = document.getElementById("folderTemplate");
  const clone = template.content.cloneNode(true);
  const container = clone.querySelector(".folder-container");

  const bgm = container.querySelector(".bgm");
  if (data.bgm) {
    bgm.src = `${BASE_URL}${data.bgm}`;
    bgm.loop = true;
    bgm.preload = "auto";
  }

  const carousel = container.querySelector(".carousel");
  carousel.style.transition = "transform 0.3s ease";
  data.media.forEach(file => {
    const item = document.createElement("div");
    item.className = "media-item";
    if (file.endsWith(".mp4")) {
      const video = document.createElement("video");
      video.loop = true;
      video.preload = "auto";
      video.playsinline = true;
      video.setAttribute("webkit-playsinline", "true");
      video.innerHTML = `<source src="${BASE_URL}${file}" type="video/mp4">`;
      video.onerror = () => console.error(`Failed to load video: ${file}`);
      item.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = `${BASE_URL}${file}`;
      img.onerror = () => console.error(`Failed to load image: ${file}`);
      item.appendChild(img);
    }
    carousel.appendChild(item);
  });

  preloadAdjacentMedia(data.media, 0);
  createBackdrop();
  backdrop.style.display = "block";

  document.body.appendChild(clone);
  container.style.display = "block";
  currentFolder = container;
  currentIndex = 0;
  isMediaPlaying = true;

  if (data.bgm) bgm.play().catch(err => console.error("BGM play failed:", err));
  playCurrentMedia();

  const dateElement = container.querySelector(".date");
  const descElement = container.querySelector(".description");
  if (dateElement) dateElement.textContent = data.date;
  if (descElement) descElement.textContent = data.text || "";

  updateMediaCounter(container);
  disableHomeScroll();
  initSwipe(container);
}

// 预加载相邻媒体
function preloadAdjacentMedia(mediaList, currentIndex) {
  const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
  const nextIndex = (currentIndex + 1) % mediaList.length;

  const preloadMedia = (index) => {
    const file = `${BASE_URL}${mediaList[index]}`;
    if (mediaList[index].endsWith(".mp4")) {
      const video = document.createElement("video");
      video.src = file;
      video.preload = "auto";
    } else {
      const img = new Image();
      img.src = file;
    }
  };

  preloadMedia(prevIndex);
  preloadMedia(nextIndex);
}

// 创建新文件夹容器
function createFolderContainer(newFolderIndex) {
  const newData = folders[newFolderIndex];
  const template = document.getElementById("folderTemplate");
  const newClone = template.content.cloneNode(true);
  const newContainer = newClone.querySelector(".folder-container");

  const newBgm = newContainer.querySelector(".bgm");
  if (newData.bgm) {
    newBgm.src = `${BASE_URL}${newData.bgm}`;
    newBgm.loop = true;
    newBgm.preload = "auto";
  }

  const newCarousel = newContainer.querySelector(".carousel");
  newCarousel.style.transition = "transform 0.3s ease";
  newData.media.forEach(file => {
    const item = document.createElement("div");
    item.className = "media-item";
    item.style.transform = "scale(1)";
    if (file.endsWith(".mp4")) {
      const video = document.createElement("video");
      video.loop = true;
      video.preload = "auto";
      video.playsinline = true;
      video.setAttribute("webkit-playsinline", "true");
      video.innerHTML = `<source src="${BASE_URL}${file}" type="video/mp4">`;
      item.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = `${BASE_URL}${file}`;
      item.appendChild(img);
    }
    newCarousel.appendChild(item);
  });

  preloadAdjacentMedia(newData.media, 0);

  const newDateElement = newContainer.querySelector(".date");
  const newDescElement = newContainer.querySelector(".description");
  if (newDateElement) newDateElement.textContent = newData.date;
  if (newDescElement) newDescElement.textContent = newData.text || "";

  return newContainer;
}

// 切换文件夹
function switchFolder(newFolderIndex, direction) {
  if (currentFolderIndex === newFolderIndex) return;

  const newContainer = createFolderContainer(newFolderIndex);
  document.body.appendChild(newContainer);
  newContainer.style.display = "block";
  newContainer.style.transition = "transform 0.3s ease";
  newContainer.style.transform = direction === "up" ? "translateY(-100%)" : "translateY(100%)";

  newContainer.offsetHeight;
  newContainer.style.transform = "translateY(0)";
  if (currentFolder) {
    currentFolder.style.transition = "transform 0.3s ease";
    currentFolder.style.transform = direction === "up" ? "translateY(100%)" : "translateY(-100%)";
  }

  setTimeout(() => {
    if (currentFolder) {
      currentFolder.querySelectorAll("video, audio").forEach(media => {
        media.pause();
        media.src = "";
        media.load();
      });
      currentFolder.remove();
    }
    if (nextFolderPreview) {
      nextFolderPreview.remove();
      nextFolderPreview = null;
    }
    currentFolder = newContainer;
    currentFolderIndex = parseInt(newFolderIndex);
    currentIndex = 0;
    isMediaPlaying = true;
    const newBgm = newContainer.querySelector(".bgm");
    if (newBgm.src) newBgm.play().catch(err => console.error("BGM play failed:", err));
    playCurrentMedia();
    updateMediaCounter(newContainer);
    initSwipe(newContainer);
  }, 300);
}

// 初始化滑动和缩放
function initSwipe(container) {
  let startX = 0;
  let startY = 0;
  let gestureMode = null;
  let pinchStartScale = 1;
  let pinchStartTranslateX = 0;
  let pinchStartTranslateY = 0;
  let initialDistance = 0;
  let initialCenterX = 0;
  let initialCenterY = 0;
  let deltaYAccumulated = 0;
  const closeBtn = container.querySelector(".close-btn");

  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      gestureMode = "swipe";
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      deltaYAccumulated = 0;
    } else if (e.touches.length === 2) {
      gestureMode = "pinch";
      if (closeBtn) closeBtn.style.display = "none";
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialDistance = getDistance(touch1, touch2);
      initialCenterX = (touch1.clientX + touch2.clientX) / 2;
      initialCenterY = (touch1.clientY + touch2.clientY) / 2;
      const currentMediaItem = container.querySelectorAll(".media-item")[currentIndex];
      const style = window.getComputedStyle(currentMediaItem);
      const transform = style.transform;
      const matrix = transform.match(/^matrix\((.+)\)$/);
      if (matrix) {
        const values = matrix[1].split(", ");
        pinchStartScale = parseFloat(values[0]);
        pinchStartTranslateX = parseFloat(values[4]);
        pinchStartTranslateY = parseFloat(values[5]);
      } else {
        pinchStartScale = 1;
        pinchStartTranslateX = 0;
        pinchStartTranslateY = 0;
      }
    }
  });

  container.addEventListener("touchmove", (e) => {
    if (gestureMode === "swipe" && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;
      const carousel = container.querySelector(".carousel");
      const totalItems = container.querySelectorAll(".media-item").length;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        let translateX = -currentIndex * 100 + (deltaX / window.innerWidth) * 100;
        if (currentIndex === 0 && deltaX > 0) translateX = 0;
        else if (currentIndex === totalItems - 1 && deltaX < 0) translateX = -currentIndex * 100;
        carousel.style.transition = "none";
        carousel.style.transform = `translateX(${translateX}%)`;
      } else {
        deltaYAccumulated = deltaY;
        const translateY = (deltaY / window.innerHeight) * 100;
        container.style.transition = "none";
        container.style.transform = `translateY(${translateY}%)`;
        backdrop.style.display = "block";

        if (deltaY > 0 && currentFolderIndex > 0 && !nextFolderPreview) {
          nextFolderPreview = createFolderContainer(currentFolderIndex - 1);
          document.body.appendChild(nextFolderPreview);
          nextFolderPreview.style.display = "block";
          nextFolderPreview.style.transform = "translateY(-100%)";
        } else if (deltaY < 0 && currentFolderIndex < folders.length - 1 && !nextFolderPreview) {
          nextFolderPreview = createFolderContainer(currentFolderIndex + 1);
          document.body.appendChild(nextFolderPreview);
          nextFolderPreview.style.display = "block";
          nextFolderPreview.style.transform = "translateY(100%)";
        }

        if (nextFolderPreview) {
          const previewTranslateY = deltaY > 0 ? -100 + (deltaY / window.innerHeight) * 100 : 100 + (deltaY / window.innerHeight) * 100;
          nextFolderPreview.style.transition = "none";
          nextFolderPreview.style.transform = `translateY(${previewTranslateY}%)`;
        }
      }
    } else if (gestureMode === "pinch" && e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const newDistance = getDistance(touch1, touch2);
      const scaleFactor = newDistance / initialDistance;
      let newScale = pinchStartScale * scaleFactor;
      const minScale = 0.1;
      const maxScale = 7;
      newScale = Math.min(Math.max(newScale, minScale), maxScale);

      const newCenterX = (touch1.clientX + touch2.clientX) / 2;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2;
      const deltaCenterX = newCenterX - initialCenterX;
      const deltaCenterY = newCenterY - initialCenterY;

      const currentMediaItem = container.querySelectorAll(".media-item")[currentIndex];
      const translateX = pinchStartTranslateX + deltaCenterX;
      const translateY = pinchStartTranslateY + deltaCenterY;

      currentMediaItem.style.transition = "none";
      currentMediaItem.style.transform = `translate(${translateX}px, ${translateY}px) scale(${newScale})`;
      currentMediaItem.style.transformOrigin = "center center";
    }
  });

  container.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      const carousel = container.querySelector(".carousel");
      const totalItems = container.querySelectorAll(".media-item").length;

      if (gestureMode === "swipe") {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = e.changedTouches[0].clientY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          carousel.style.transition = "transform 0.3s ease";
          if (Math.abs(deltaX) > 65) {
            if (deltaX > 0 && currentIndex > 0) currentIndex--;
            else if (deltaX < 0 && currentIndex < totalItems - 1) currentIndex++;
          }
          carousel.style.transform = `translateX(${-currentIndex * 100}%)`;
          if (isMediaPlaying) playCurrentMedia();
          updateMediaCounter(container);
          preloadAdjacentMedia(folders[currentFolderIndex].media, currentIndex);
        } else {
          container.style.transition = "transform 0.3s ease";
          if (Math.abs(deltaYAccumulated) > 65) {
            let newFolderIndex = currentFolderIndex;
            if (deltaYAccumulated > 0 && currentFolderIndex > 0) {
              newFolderIndex = currentFolderIndex - 1;
              switchFolder(newFolderIndex, "up");
            } else if (deltaYAccumulated < 0 && currentFolderIndex < folders.length - 1) {
              newFolderIndex = currentFolderIndex + 1;
              switchFolder(newFolderIndex, "down");
            } else {
              container.style.transform = "translateY(0)";
              if (nextFolderPreview) {
                nextFolderPreview.remove();
                nextFolderPreview = null;
              }
              backdrop.style.display = "block";
            }
          } else {
            container.style.transform = "translateY(0)";
            if (nextFolderPreview) {
              nextFolderPreview.remove();
              nextFolderPreview = null;
            }
            backdrop.style.display = "block";
          }
        }
      } else if (gestureMode === "pinch") {
        const currentMediaItem = container.querySelectorAll(".media-item")[currentIndex];
        currentMediaItem.style.transition = "transform 0.3s ease";
        currentMediaItem.style.transform = "translate(0px, 0px) scale(1)";
        currentMediaItem.style.transformOrigin = "center center";
        if (closeBtn) closeBtn.style.display = "block";
      }
      gestureMode = null;
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", closeFolder);

  container.addEventListener("click", (e) => {
    if (closeBtn && closeBtn.contains(e.target)) return;
    isMediaPlaying = !isMediaPlaying;
    const bgm = container.querySelector(".bgm");
    const currentItem = container.querySelectorAll(".media-item")[currentIndex];
    const video = currentItem.querySelector("video");
    if (isMediaPlaying) {
      if (bgm.src) bgm.play().catch(err => console.error("BGM play failed:", err));
      if (video) video.play().catch(err => console.error("Video play failed:", err));
    } else {
      if (bgm.src) bgm.pause();
      if (video) video.pause();
    }
  });
}

// 播放当前媒体
function playCurrentMedia() {
  if (!isMediaPlaying || !currentFolder) return;
  const currentItem = currentFolder.querySelectorAll(".media-item")[currentIndex];
  const video = currentItem.querySelector("video");
  if (video && video.paused) {
    video.currentTime = 0;
    video.play().catch(err => console.error("Video play failed:", err));
  }
}

// 关闭文件夹
function closeFolder() {
  if (currentFolder) {
    currentFolder.querySelectorAll("video, audio").forEach(media => {
      media.pause();
      media.src = "";
      media.load();
    });
    currentFolder.remove();
    currentFolder = null;
  }
  if (nextFolderPreview) {
    nextFolderPreview.querySelectorAll("video, audio").forEach(media => {
      media.pause();
      media.src = "";
      media.load();
    });
    nextFolderPreview.remove();
    nextFolderPreview = null;
  }
  if (backdrop) backdrop.style.display = "none";
  currentIndex = 0;
  currentFolderIndex = null;
  isMediaPlaying = false;
  enableHomeScroll();
}

// 禁用主页滚动
function disableHomeScroll() {
  isHomeScrollEnabled = false;
  document.body.style.overflow = "hidden";
}

// 启用主页滚动
function enableHomeScroll() {
  isHomeScrollEnabled = true;
  document.body.style.overflow = "auto";
}

// 退出页面
function exitPage() {
  window.location.href = "https://www.csyan.asia";
}

// 背景音乐控制
const musicBtn = document.getElementById("musicBtn");
const bgMusic = document.getElementById("bgMusic");
const playIcon = document.getElementById("playIcon");
let isMusicPlaying = false;

if (musicBtn && bgMusic && playIcon) {
  musicBtn.addEventListener("click", () => {
    if (isMusicPlaying) {
      bgMusic.pause();
      playIcon.src = `${BASE_URL}gz.png`;
    } else {
      bgMusic.play().catch(err => console.error("Background music play failed:", err));
      playIcon.src = `${BASE_URL}ygz.png`;
    }
    isMusicPlaying = !isMusicPlaying;
  });
}

// 阻止默认滚动
document.addEventListener("touchmove", (e) => {
  if (!isHomeScrollEnabled) e.preventDefault();
}, { passive: false });

// 初始化
document.addEventListener("DOMContentLoaded", initGrid);