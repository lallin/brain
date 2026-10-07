"use client";

import { useEffect, useRef } from "react";
import { useLang, type Lang } from "@/components/sites/boilerlab-ai-93c3cf36/i18n/lang";

// Full-screen "curtain" notice that folds up into a slim bar above the
// header on scroll/close (ported 1:1 from notice-curtain.html — same text,
// same timings; colors live in notice-curtain.css). While it is open the
// main page's wheel-stepper stands down (it bails on `.npc:not([hidden])`,
// see BoilerLabScrollApp), so the wheel that folds the curtain doesn't also
// step the page behind it.
//
// Change NOTICE_ID for each new notice so "오늘 다시 보지 않음" from an
// older one doesn't hide it.
const NOTICE_ID = "notice-japan-it-week-autumn-2026";
const OPEN_DELAY = 300; // ms after load before the curtain drops
const READY_AFTER = 800; // ms after it's fully down before scroll can fold it

const EVENT = "Japan IT Week Autumn 2026";
const BOOTH = "A23-5";

const COPY: Record<Lang, {
  region: string;
  barInfo: string;
  more: string;
  hideToday: string;
  close: string;
  badge: string;
  title: string;
  text: string;
  dateLabel: string;
  date: string;
  boothLabel: string;
  siteLabel: string;
  site: string;
  siteUrl: string;
  meeting: string;
  visualAlt: string;
  ok: string;
  hint: string;
}> = {
  en: {
    region: "Notice",
    barInfo: ` · Booth ${BOOTH} · Oct 21–23`,
    more: "Learn more",
    hideToday: "Don't show again today",
    close: "Close",
    badge: "Exhibition",
    title: "Braindeck at Japan IT Week Autumn 2026",
    text: "Braindeck is exhibiting at Japan IT Week Autumn 2026 this October. We'll present our latest technology and services, including our AI voice technology and BOHO Shield, a content protection solution for the AI era.",
    dateLabel: "Dates",
    date: "Wed, Oct 21 – Fri, Oct 23, 2026",
    boothLabel: "Booth",
    siteLabel: "Official site",
    site: "Japan IT Week",
    siteUrl: "https://www.japan-it.jp/autumn/en-gb.html",
    meeting: `Visit us at booth ${BOOTH}. Individual meetings are also available during the show.`,
    visualAlt: "BOHO Shield — Protect, Detect, Respond",
    ok: "OK",
    hint: "Scroll to fold it up",
  },
  ko: {
    region: "공지",
    barInfo: ` · 부스 ${BOOTH} · 10월 21일(수) ~ 23일(금)`,
    more: "자세히 보기",
    hideToday: "오늘 다시 보지 않음",
    close: "닫기",
    badge: "전시 참가",
    title: "Japan IT Week Autumn 2026 참가 안내",
    text: "Braindeck이 10월에 열리는 「Japan IT Week Autumn 2026」에 참가합니다. AI 음성 기술을 비롯해 AI 시대의 콘텐츠를 지키는 콘텐츠 보호 솔루션 「BOHO Shield」 등 Braindeck의 최신 기술과 서비스를 소개합니다.",
    dateLabel: "기간",
    date: "2026년 10월 21일(수) ~ 23일(금)",
    boothLabel: "부스 번호",
    siteLabel: "공식 사이트",
    site: "Japan IT Week",
    siteUrl: "https://www.japan-it.jp/autumn/en-gb.html",
    meeting: `${BOOTH} 부스로 방문해 주세요. 행사 기간 중 개별 미팅도 가능합니다.`,
    visualAlt: "BOHO Shield — Protect, Detect, Respond",
    ok: "확인",
    hint: "스크롤하면 위로 접혀요",
  },
  ja: {
    region: "お知らせ",
    barInfo: ` · ブース ${BOOTH} · 10月21日(水)〜23日(金)`,
    more: "詳しく見る",
    hideToday: "今日は表示しない",
    close: "閉じる",
    badge: "出展のお知らせ",
    title: "Japan IT Week Autumn 2026 出展のお知らせ",
    text: "Braindeckは10月に開催される「Japan IT Week Autumn 2026」に出展いたします。AI音声技術をはじめ、AI時代のコンテンツを守るコンテンツ保護ソリューション「BOHO Shield」など、Braindeckの最新技術・サービスをご紹介いたします。",
    dateLabel: "会期",
    date: "2026年10月21日（水）～23日（金）",
    boothLabel: "ブース番号",
    siteLabel: "公式サイト",
    site: "Japan IT Week 公式サイト",
    siteUrl: "https://www.japan-it.jp/autumn/ja-jp.html",
    meeting: `弊社ブース【${BOOTH}】へぜひお立ち寄りください。会期中は個別ミーティングも承っております。`,
    visualAlt: "BOHO Shield — Protect, Detect, Respond",
    ok: "確認",
    hint: "スクロールすると上に折りたたまれます",
  },
};

export function NoticeCurtain() {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const t = COPY[useLang()];
  // The event name inside the title gets the mint accent.
  const titleParts = t.title.split(EVENT);

  useEffect(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    if (!root || !wrap) return;
    const bar = wrap.querySelector<HTMLElement>(".npc-bar")!;
    const panel = root.querySelector<HTMLElement>(".npc-panel")!;
    const reopenBtn = bar.querySelector<HTMLButtonElement>("[data-npc-reopen]")!;
    const KEY = "npc-hide:" + root.id;
    let ready = false;
    let busy = false;
    let touchY: number | null = null;
    let lastFocus: Element | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function hiddenToday() {
      try {
        return Number(localStorage.getItem(KEY)) > Date.now();
      } catch {
        return false;
      }
    }
    function hideToday() {
      const end = new Date();
      end.setHours(24, 0, 0, 0);
      try {
        localStorage.setItem(KEY, String(end.getTime()));
      } catch {}
    }
    function after(el: HTMLElement, ms: number, fn: () => void) {
      let fired = false;
      const done = () => {
        if (fired) return;
        fired = true;
        fn();
      };
      el.addEventListener("animationend", function h(e) {
        if (e.target !== el) return;
        el.removeEventListener("animationend", h);
        done();
      });
      timers.push(setTimeout(done, ms));
    }
    function setState(el: HTMLElement, cls: string | null) {
      el.classList.remove("is-open", "is-expanding", "is-collapsing", "is-away", "is-in", "is-out");
      void el.offsetWidth; // restart the animation from the top
      if (cls) el.classList.add(cls);
    }
    function barOnScreen() {
      // Hand the bar's live rect to the curtain's clip-path animation.
      const r = bar.getBoundingClientRect();
      panel.style.setProperty("--c-t", r.top + "px");
      panel.style.setProperty("--c-l", r.left + "px");
      panel.style.setProperty("--c-r", document.documentElement.clientWidth - r.right + "px");
      panel.style.setProperty("--c-b", window.innerHeight - r.bottom + "px");
      return r.bottom > 0 && r.top < window.innerHeight;
    }

    // fromBar: grow out of the top bar instead of dropping from above.
    function open(fromBar: boolean) {
      if (busy) return;
      const expand = fromBar && barOnScreen();
      bar.classList.add("is-ghost");
      root!.hidden = false;
      setState(root!, expand ? "is-expanding" : "is-open");
      lastFocus = document.activeElement;
      document.documentElement.style.overflow = "hidden";
      root!.querySelector<HTMLButtonElement>(".npc-ok")!.focus({ preventScroll: true });
      ready = false;
      clearTimeout(readyTimer);
      readyTimer = setTimeout(() => {
        ready = true;
      }, READY_AFTER);
      listen(true);
    }

    // 'bar' folds into the top bar; 'away' slides up and drops the bar too.
    function close(mode: "bar" | "away") {
      if (busy || root!.hidden) return;
      busy = true;
      ready = false;
      listen(false);
      const toBar = mode !== "away" && barOnScreen();
      setState(root!, toBar ? "is-collapsing" : "is-away");
      after(panel, toBar ? 900 : 700, () => {
        root!.hidden = true;
        setState(root!, null);
        document.documentElement.style.overflow = "";
        busy = false;
        if (mode === "away") {
          removeBar(false);
          return;
        }
        bar.classList.remove("is-ghost");
        setState(bar, "is-in");
        if (lastFocus && lastFocus !== document.body && lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
      });
    }

    function removeBar(animateBar: boolean) {
      if (animateBar) {
        setState(bar, "is-out");
        after(bar, 320, () => wrap!.classList.add("is-gone"));
      } else {
        wrap!.classList.add("is-gone");
      }
      wrap!.addEventListener(
        "transitionend",
        () => {
          wrap!.hidden = true;
        },
        { once: true },
      );
    }

    // Wheel / trackpad / touch / keyboard scroll folds it into the bar.
    function onWheel(e: WheelEvent) {
      if (ready && Math.abs(e.deltaY) > 4) close("bar");
    }
    function onTouchStart(e: TouchEvent) {
      touchY = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      if (ready && touchY !== null && Math.abs(e.touches[0].clientY - touchY) > 24) {
        touchY = null;
        close("bar");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close("bar");
        return;
      }
      const scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "End", "Home"];
      if (ready && scrollKeys.includes(e.key)) {
        e.preventDefault();
        close("bar");
        return;
      }
      if (e.key === "Tab") {
        const f = root!.querySelectorAll<HTMLButtonElement>("button");
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    }
    function listen(on: boolean) {
      if (on) {
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        document.addEventListener("keydown", onKey);
      } else {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("keydown", onKey);
      }
    }

    const onClose = () => close("bar");
    const onHideToday = () => {
      hideToday();
      close("away");
    };
    const onReopen = () => open(true);
    const onBarHide = () => {
      hideToday();
      removeBar(true);
    };
    const closeBtns = root.querySelectorAll<HTMLElement>("[data-npc-close]");
    const hideTodayBtn = root.querySelector<HTMLElement>("[data-npc-hide-today]")!;
    const barHideBtn = bar.querySelector<HTMLElement>("[data-npc-bar-hide]")!;
    closeBtns.forEach((el) => el.addEventListener("click", onClose));
    hideTodayBtn.addEventListener("click", onHideToday);
    reopenBtn.addEventListener("click", onReopen);
    barHideBtn.addEventListener("click", onBarHide);

    // Push the fixed header down by the bar's height, frame by frame while
    // the bar's row collapses, so the header slides back up as it goes.
    const html = document.documentElement;
    const ro = new ResizeObserver(() => {
      html.style.setProperty("--npc-bar-space", (wrap.hidden ? 0 : wrap.getBoundingClientRect().height) + "px");
    });
    ro.observe(wrap);

    if (hiddenToday()) {
      wrap.hidden = true;
    } else {
      timers.push(setTimeout(() => open(false), OPEN_DELAY));
    }

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(readyTimer);
      listen(false);
      closeBtns.forEach((el) => el.removeEventListener("click", onClose));
      hideTodayBtn.removeEventListener("click", onHideToday);
      reopenBtn.removeEventListener("click", onReopen);
      barHideBtn.removeEventListener("click", onBarHide);
      document.documentElement.style.overflow = "";
      ro.disconnect();
      html.style.removeProperty("--npc-bar-space");
    };
  }, []);

  return (
    <>
      <div className="npc-bar-wrap" ref={wrapRef}>
        <div className="npc-bar-clip">
          <div className="npc-bar is-ghost" role="region" aria-label={t.region}>
            <span className="npc-bar-title">
              <b>{EVENT}</b>
              <span className="npc-bar-date">{t.barInfo}</span>
            </span>
            <button type="button" data-npc-reopen>
              {t.more}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <span className="npc-bar-sep" aria-hidden="true" />
            <button type="button" data-npc-bar-hide>
              {t.hideToday}
            </button>
          </div>
        </div>
      </div>

      <div className="npc" id={NOTICE_ID} hidden ref={rootRef}>
        <div className="npc-panel" role="dialog" aria-modal="true" aria-labelledby="npc-title">
          <div className="npc-glow" aria-hidden="true" />
          <button className="npc-x" type="button" aria-label={t.close} data-npc-close>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="npc-layout">
            <div className="npc-copy">
              <span className="npc-badge npc-rise">{t.badge}</span>
              <h2 className="npc-title npc-rise" id="npc-title">
                {titleParts[0]}
                <span className="npc-title-accent">{EVENT}</span>
                {titleParts.slice(1).join(EVENT)}
              </h2>
              <p className="npc-text npc-rise">{t.text}</p>
              <dl className="npc-info npc-rise">
                <div>
                  <dt>
                    <svg className="npc-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></svg>
                    {t.dateLabel}
                  </dt>
                  <dd>{t.date}</dd>
                </div>
                <div>
                  <dt>
                    <svg className="npc-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V9l8-5 8 5v12" /><path d="M9 21v-6h6v6M3 21h18" /></svg>
                    {t.boothLabel}
                  </dt>
                  <dd className="npc-booth">{BOOTH}</dd>
                </div>
                <div>
                  <dt>
                    <svg className="npc-info-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></svg>
                    {t.siteLabel}
                  </dt>
                  <dd>
                    <a href={t.siteUrl} target="_blank" rel="noopener noreferrer">
                      {t.site}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="npc-meeting npc-rise">{t.meeting}</p>
              <div className="npc-actions npc-rise">
                <button className="npc-ok" type="button" data-npc-close>
                  {t.ok}
                </button>
                <button className="npc-ghost" type="button" data-npc-hide-today>
                  {t.hideToday}
                </button>
              </div>
            </div>
            <div className="npc-visual npc-rise">
              {/* eslint-disable-next-line @next/next/no-img-element -- static, single image */}
              <img src="/images/notice/boho-shield.webp" width={818} height={501} alt={t.visualAlt} />
            </div>
          </div>
          <div className="npc-hint" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-6 6 6" />
            </svg>
            {t.hint}
          </div>
        </div>
      </div>
    </>
  );
}
