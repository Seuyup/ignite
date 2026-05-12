/**
 * Ignite는 Service Worker(PWA)를 쓰지 않습니다.
 * 일부 브라우저·도구·확장이 localhost에서 /sw.js를 요청해 dev 로그에 404가
 * 쌓이는 경우가 있어, 빈 응답 대신 이 스텁으로 200을 반환합니다.
 * 실제 SW 등록이 필요하면 이 파일을 교체하세요.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
