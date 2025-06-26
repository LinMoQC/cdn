// 注意：这个文件必须放在你的网站的根目录 (或 app.py 中通过 static_folder 配置的目录)
// 并且必须是纯 JavaScript，不包含 HTML 标签。

// 导入 Firebase SDK for Service Worker
// 确保这里的版本与你在组件中使用的版本一致
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// 硬编码的 Firebase 配置
let firebaseConfig = {
  apiKey: "AIzaSyAvQ3vWMPyiqYRlSgK02oWEQpKxt-R4AkE",
  authDomain: "webpush-99b37.firebaseapp.com",
  projectId: "webpush-99b37",
  storageBucket: "webpush-99b37.firebasestorage.app",
  messagingSenderId: "375068630346",
  appId: "1:375068630346:web:6640b2728c6d742350b5b3",
  measurementId: "G-PGBMYSKMGL"
};

// 监听来自主线程的配置更新消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    // 更新Firebase配置
    firebaseConfig = event.data.config;
    console.log('Firebase配置已更新:', firebaseConfig);
    
    // 重新初始化Firebase
    try {
      // 如果已经初始化过，先清理
      if (self.firebaseApp) {
        // Firebase在SW中无法直接删除app，所以直接覆盖
      }
      
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();
      
      // 处理后台消息
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] 收到后台消息 ', payload);

        const notificationTitle = payload.notification?.title || '新通知';
        const notificationOptions = {
          body: payload.notification?.body || '您有新消息。',
          icon: payload.notification?.icon || '/favicon.ico',
          data: payload.data, // 携带额外数据
          actions: [
            { action: 'open_url', title: '立即查看' }
          ]
        };

        // 显示系统通知
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
      
    } catch (error) {
      console.error('Failed to initialize Firebase in SW:', error);
    }
  }
});

// 初始化 Firebase 应用 (如果配置已就绪)
function initializeFirebase() {
  try {
    if (firebaseConfig.apiKey) {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();
      
      // 处理后台消息 (当网站不在浏览器中打开时)
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] 收到后台消息 ', payload);

        const notificationTitle = payload.notification?.title || '新通知';
        const notificationOptions = {
          body: payload.notification?.body || '您有新消息。',
          icon: payload.notification?.icon || '/favicon.ico',
          data: payload.data, // 携带额外数据，如直播链接
          actions: [
            { action: 'open_url', title: '立即查看' } // 可以添加通知按钮
          ]
        };

        // 显示系统通知
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  } catch (error) {
    console.log('Firebase配置未就绪，等待来自主线程的配置');
  }
}

// 尝试初始化
initializeFirebase();

// 处理通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('通知被点击.', event);
  event.notification.close(); // 关闭通知

  const clickedData = event.notification.data;
  const targetUrl = clickedData?.liveUrl || clickedData?.url || clickedData?.click_action || '/'; // 从 data 中获取URL，或者默认跳转到根目录

  // 根据点击的 action 或默认行为来打开 URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // 如果网站已打开并匹配 URL，则聚焦该窗口
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则，打开新窗口或标签页
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Service Worker 激活事件
self.addEventListener('activate', event => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Service Worker 安装事件
self.addEventListener('install', event => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
}); 
