import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import "./styles/anime-effects.css";
import { accordionTransition, hoverLift, productSwap, revealOnScroll, slideTransition } from "./lib/anime-effects.js";
import { SiteFibers } from "./components/SiteFibers";
import "./brand-story-v2.css";

const navigation = [
  { href: "/", label: "ホーム" },
  { href: "/about/", label: "Tulikoについて" },
  { href: "/business/", label: "製品・事業" },
  { href: "/cases/", label: "配置検討例" },
  { href: "/story/", label: "ブランドストーリー" },
  { href: "/news/", label: "更新情報" },
  { href: "/contact/", label: "お問い合わせ" },
] as const;

const aboutChapters = [
  { id: "about-intro", label: "市場の課題", title: "静けさを、オフィスで選べる仕事の条件に。", summary: "開かれたオフィスにも、通話、オンライン会議、思考のための短く確かな独立が必要です。" },
  { id: "about-purpose", label: "製造の系譜", title: "土台は、働き方を見つめた関連製造基盤に。", summary: "2002–2021年は関連製造端の公開発展記録であり、Tuliko自身の成立・沿革ではありません。" },
  { id: "about-products", label: "2019", title: "デスクとチェアから、音とプライバシーの空間へ。", summary: "2019年、関連製造端の公開記録に電話ブースシリーズの開発が現れ、製品領域が声と集中の空間へ広がりました。" },
  { id: "about-evidence", label: "2026", title: "Tulikoは、日本市場に向けて始まった。", summary: "2026年8月、ドメイン登録と製品サイトのブランド統一を起点に、日本のオフィスとの対話を始めました。" },
  { id: "about-delivery", label: "現在", title: "製造の積み重ねを、導入判断に変える。", summary: "利用場面、人数、仕様、配置条件、確認可能な資料を、案件ごとに一つずつつなぎます。" },
  { id: "about-company", label: "確認範囲", title: "確認できることと、確認が必要なことを分ける。", summary: "沿革、試験、サービス、保証の適用範囲を明記し、未確認の内容をTulikoの実績として扱いません。" },
  { id: "about-contact", label: "導入相談", title: "日本のオフィスへ、ちょうどよい静けさを。", summary: "製品を売る前に、その空間に合うブース、構成、位置と確認資料を一緒に確かめます。" },
] as const;

const useCases = [
  { id: "performance", label: "2002", title: "働き方から、家具を考える。", text: "関連製造基盤は杭州のオフィス家具事業から始まり、自社設計やショールームを通じて空間の使われ方を蓄積しました。", image: "/assets/brand-story/lineage-2002-concept-v1.webp", alt: "オフィス家具の設計基盤を表現した現代のコンセプトイメージ" },
  { id: "finish", label: "2008", title: "姿勢と仕事のリズムから、空間へ。", text: "家具開発で培った人体工学と精密加工の知見を、静音ブースの寸法・操作性・設備配置へ展開。仕事の変化を支える空間として再構成しました。", image: "/assets/brand-story/lineage-2008-concept-v2.webp", alt: "静音ブースの原型を前に素材と構成を検討する開発チームのコンセプトイメージ" },
  { id: "operation", label: "2009–16", title: "国際市場で、使われ方を学ぶ。", text: "海外展示会への参加を重ね、2014–2016年には国際オフィス家具市場へ展開したことが公開記録に残されています。", image: "/assets/brand-story/lineage-2009-2016-concept-v1.webp", alt: "国際市場での製品検討を表現した現代のコンセプトイメージ" },
] as const;

const methodSteps = [
  { step: "2019", phase: "電話ブースシリーズへ", detail: "関連製造端の公開記録に基づく製品開発", mediaLabel: "現代のコンセプトイメージ（生成）／当時の記録画像ではありません", image: "/assets/brand-story/phone-booth-2019-concept-v1.webp", alt: "2019年の電話ブース開発への転換を表現した現代のコンセプトイメージ" },
  { step: "2020–21", phase: "モジュラー音響空間へ", detail: "電話・会議・ワークポッドへ製品領域を拡張", mediaLabel: "現代のコンセプトイメージ（生成）／当時の記録画像ではありません", image: "/assets/brand-story/modular-2020-2021-concept-v1.webp", alt: "複数サイズのモジュラー音響ワークスペースを表現した現代のコンセプトイメージ" },
  { step: "現在", phase: "案件ごとの構成へ", detail: "構造・素材・寸法・換気・照明を確認", mediaLabel: "現在の構成イメージ（生成）／導入事例ではありません", image: "/assets/brand-story/configuration-current-concept-v2.webp", alt: "ワークブースの素材と構成確認を表現した生成イメージ" },
] as const;

const heroProducts = [
  { sku: "SPD01", size: "1名用", configuration: "直線デスク", color: "灰緑", image: "/assets/products/catalog/spd01-grey-green.webp", imageHigh: "/assets/products/catalog-hq/spd01-grey-green.webp", alt: "灰緑色の一人用直線デスク仕様 Tuliko SPD01 静音ワークブース" },
  { sku: "SPD02", size: "1名用", configuration: "L型デスク", color: "白", image: "/assets/products/catalog/spd02-white.webp", imageHigh: "/assets/products/catalog-hq/spd02-white.webp", alt: "白色の一人用L型デスク仕様 Tuliko SPD02 静音ワークブース" },
  { sku: "SPD03", size: "1名用", configuration: "昇降デスク", color: "光沢グレー", image: "/assets/products/catalog/spd03-gloss-grey.webp", imageHigh: "/assets/products/catalog-hq/spd03-gloss-grey.webp", alt: "光沢グレーの一人用昇降デスク仕様 Tuliko SPD03 静音ワークブース" },
  { sku: "SPD04", size: "1名用", configuration: "ラウンジチェア", color: "米紅", image: "/assets/products/catalog/spd04-soft-red.webp", imageHigh: "/assets/products/catalog-hq/spd04-soft-red.webp", alt: "米紅色の一人用ラウンジチェア仕様 Tuliko SPD04 静音ワークブース" },
  { sku: "SPD07", size: "2名用", configuration: "ミーティング", color: "陰影グレー", image: "/assets/products/catalog/spd07-shadow-grey.webp", imageHigh: "/assets/products/catalog-hq/spd07-shadow-grey.webp", alt: "陰影グレーの二人用ミーティング仕様 Tuliko SPD07 静音ワークブース" },
  { sku: "SPD08", size: "2名用", configuration: "昇降デスク", color: "カーキ", image: "/assets/products/catalog/spd08-khaki.webp", imageHigh: "/assets/products/catalog-hq/spd08-khaki.webp", alt: "カーキ色の二人用昇降デスク仕様 Tuliko SPD08 静音ワークブース" },
  { sku: "SPD09", size: "小型", configuration: "ミーティング", color: "土褐", image: "/assets/products/catalog/spd09-earth-brown.webp", imageHigh: "/assets/products/catalog-hq/spd09-earth-brown.webp", alt: "土褐色の小型ミーティング仕様 Tuliko SPD09 静音ワークブース" },
  { sku: "SPD12", size: "中型", configuration: "ミーティング", color: "灰緑", image: "/assets/products/catalog/spd12-grey-green.webp", imageHigh: "/assets/products/catalog-hq/spd12-grey-green.webp", alt: "灰緑色の中型ミーティング仕様 Tuliko SPD12 静音ワークブース" },
  { sku: "SPD14", size: "大型", configuration: "ミーティング", color: "黒", image: "/assets/products/catalog/spd14-black.webp", imageHigh: "/assets/products/catalog-hq/spd14-black.webp", alt: "黒色の大型ミーティング仕様 Tuliko SPD14 静音ワークブース" },
] as const;

const deliverySteps = [
  { number: "01", title: "利用場面と人数を聞く", text: "通話、オンライン会議、集中作業のどれに、何人で使うかを整理します。" },
  { number: "02", title: "仕様と配置を比べる", text: "ブースの大きさ、内部構成、仕上げ、搬入経路と電源条件を確認します。" },
  { number: "03", title: "資料と適用範囲を示す", text: "製品資料、構造表示、試験資料を、対象モデルと条件を分けてご案内します。" },
] as const;

const planningInfo = [
  { number: "01", label: "製品を比較", text: "一人用から会議用まで、用途と構成を確認。" },
  { number: "02", label: "条件を確認", text: "搬入経路・電源・設置スペースを案件ごとに確認。" },
  { number: "03", label: "個別に案内", text: "対応地域、保証、保守は契約条件とともに案内。" },
] as const;

const launchMilestones = [
  { number: "01", title: "ドメイン登録", text: "2026年8月、tuliko-jp.com の登録を日本市場向けブランド発信の起点としました。" },
  { number: "02", title: "ブランド表示を統一", text: "製品サイトのタイトル、ナビゲーション、ローディング、企業・製品情報をTulikoに統一しました。" },
  { number: "03", title: "資料から対話を始める", text: "製品資料、構造表示、試験資料を、導入相談と比較検討の出発点にしています。" },
] as const;

const riskInfo = [
  { label: "沿革の区分", value: "2002–2021年は関連製造端の公開発展記録であり、Tuliko自身の成立・沿革ではありません。" },
  { label: "2026年の意味", value: "日本市場向けブランド表現と製品サイトの開始を指し、日本法人、商標、全国サービス網の完了を意味しません。" },
  { label: "試験の適用", value: "報告書記載の試料・条件に限ります。対象モデルは個別に確認します。" },
  { label: "サービス範囲", value: "対応地域と対象サービスは、設置場所を確認のうえ個別にご案内します。" },
  { label: "保証・保守", value: "対象製品と契約内容を確認し、保証、保守方法、交換部品の条件を個別にご提示します。" },
] as const;

function VisualPanel({ image, alt, title, text, mediaLabel, className = "" }: { image: string; alt: string; title: string; text: string; mediaLabel?: string; className?: string }) {
  return (
    <figure className={`brand-story-visual-panel ${className}`}>
      <img src={image} alt={alt} loading="lazy" decoding="async" />
      <figcaption>
        {mediaLabel ? <small>{mediaLabel}</small> : null}
        <strong>{title}</strong>
        <span>{text}</span>
      </figcaption>
    </figure>
  );
}

export function BrandStoryPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroProductRef = useRef<HTMLElement>(null);
  const chapterRailRef = useRef<HTMLElement>(null);
  const routeTimerRef = useRef<number | null>(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState("performance");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState("about-intro");
  const [isActiveChapterTall, setIsActiveChapterTall] = useState(false);
  const [activeHeroProduct, setActiveHeroProduct] = useState(0);
  const [previousHeroProduct, setPreviousHeroProduct] = useState<number | null>(null);
  const [isProductAutoplayEnabled, setIsProductAutoplayEnabled] = useState(true);
  const [isProductHovered, setIsProductHovered] = useState(false);
  const [isProductFocused, setIsProductFocused] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const currentUseCase = useCases.find((item) => item.id === activeUseCase) ?? useCases[0];
  const currentHeroProduct = heroProducts[activeHeroProduct];
  const previousHeroProductData = previousHeroProduct === null ? null : heroProducts[previousHeroProduct];
  const isProductPlaybackPaused = !isProductAutoplayEnabled || isProductHovered || isProductFocused || !isDocumentVisible || prefersReducedMotion || activeChapter !== "about-intro";

  const selectUseCaseFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? useCases.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + useCases.length) % useCases.length;
    setActiveUseCase(useCases[nextIndex].id);
    document.getElementById(`quality-tab-${useCases[nextIndex].id}`)?.focus();
  };

  const selectHeroProductFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? heroProducts.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + heroProducts.length) % heroProducts.length;
    showHeroProduct(nextIndex);
    document.getElementById(`hero-product-${heroProducts[nextIndex].sku}`)?.focus();
  };

  const showHeroProduct = (index: number) => {
    const nextIndex = (index + heroProducts.length) % heroProducts.length;
    if (nextIndex === activeHeroProduct) return;
    setPreviousHeroProduct(activeHeroProduct);
    setActiveHeroProduct(nextIndex);
  };

  const handleRouteChange = (event: MouseEvent<HTMLAnchorElement>) => {
    const link = event.currentTarget;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;

    event.preventDefault();
    if (routeTimerRef.current !== null) return;
    setIsPageReady(false);
    routeTimerRef.current = window.setTimeout(() => {
      window.location.assign(href);
    }, 260);
  };

  const scrollToChapter = (id: string) => {
    setActiveChapter(id);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsPageReady(true));
    document.title = "Tulikoについて | 製造の積み重ねから、日本のオフィスへ";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "日本のオフィスに必要な静けさ、関連製造端の製品系譜、2019年の電話ブース開発、2026年のTuliko日本市場ブランド始動を事実の境界とともに紹介します。",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute(
      "content",
      "Tulikoについて | 製造の積み重ねから、日本のオフィスへ",
    );
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "関連製造端の公開発展記録とTuliko自身の2026年始動を分け、静音ワークブースを日本のオフィスへ届ける考え方をご紹介します。",
    );
    return () => {
      window.cancelAnimationFrame(frame);
      if (routeTimerRef.current !== null) window.clearTimeout(routeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(media.matches);
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    media.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updateVisibility);
    heroProducts.slice(1).forEach((product) => {
      const image = new Image();
      image.src = product.image;
    });
    return () => {
      media.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (isProductPlaybackPaused) return;
    const timer = window.setTimeout(() => {
      setPreviousHeroProduct(activeHeroProduct);
      setActiveHeroProduct((activeHeroProduct + 1) % heroProducts.length);
    }, 4600);
    return () => window.clearTimeout(timer);
  }, [activeHeroProduct, isProductPlaybackPaused]);

  useEffect(() => {
    const stage = heroProductRef.current;
    if (!stage) return;
    const currentProductVisual = stage.querySelector<HTMLElement>("[data-product-layer='current']");
    const previousProductVisual = stage.querySelector<HTMLElement>("[data-product-layer='previous']");
    const productMeta = stage.querySelector<HTMLElement>("[data-product-swap='meta']");
    const productAnimation = currentProductVisual ? productSwap(currentProductVisual, {
      duration: 320,
      distance: 0,
      scale: 1,
    }) : null;
    const previousProductAnimation = previousProductVisual ? productSwap(previousProductVisual, {
      duration: 280,
      distance: 0,
      scale: 1,
      exit: true,
    }) : null;
    const metaAnimation = productMeta ? productSwap(productMeta, {
      duration: 320,
      distance: 10,
      scale: 1,
    }) : null;
    const clearPreviousProduct = window.setTimeout(() => setPreviousHeroProduct(null), 340);
    return () => {
      window.clearTimeout(clearPreviousProduct);
      productAnimation?.revert?.();
      previousProductAnimation?.revert?.();
      metaAnimation?.revert?.();
    };
  }, [activeHeroProduct]);

  useEffect(() => {
    const nextProduct = heroProducts[(activeHeroProduct + 1) % heroProducts.length];
    const nextImage = new Image();
    nextImage.srcset = `${nextProduct.image} 1600w, ${nextProduct.imageHigh} 2368w`;
    nextImage.sizes = "(min-width: 981px) calc(100vw - 430px), calc(100vw - 32px)";
    nextImage.src = nextProduct.image;
  }, [activeHeroProduct]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const detail = root.querySelector(`[data-accordion-id="${activeChapter}"] .brand-story-accordion-detail`);
    const slide = root.querySelector(`#${activeChapter}`)?.querySelectorAll(":scope > *");
    const detailAnimation = detail ? accordionTransition(detail, { duration: 380, distance: 8 }) : null;
    const slideAnimation = slide ? slideTransition(slide, { duration: 680, distance: 36, scale: 1.01 }) : null;
    return () => {
      detailAnimation?.revert?.();
      slideAnimation?.revert?.();
    };
  }, [activeChapter]);

  useEffect(() => {
    const section = document.getElementById(activeChapter);
    const header = document.querySelector<HTMLElement>(".brand-story-header");
    if (!section) return;

    const updateReadingMode = () => {
      const availableHeight = window.innerHeight - (header?.getBoundingClientRect().height ?? 0);
      const isHeroStage = section.id === "about-intro";
      const isTall = !isHeroStage && section.scrollHeight > Math.max(section.clientHeight, availableHeight) + 8;
      setIsActiveChapterTall(isTall);
      section.classList.toggle("is-tall", isTall);
      document.documentElement.classList.toggle("brand-story-free-scroll", isTall);
    };

    const frame = window.requestAnimationFrame(updateReadingMode);
    const resizeObserver = new ResizeObserver(updateReadingMode);
    resizeObserver.observe(section);
    window.addEventListener("resize", updateReadingMode);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateReadingMode);
      section.classList.remove("is-tall");
    };
  }, [activeChapter]);

  useEffect(() => {
    const rail = chapterRailRef.current;
    if (!rail || window.matchMedia("(min-width: 981px)").matches) return;
    const activeButton = rail.querySelector<HTMLElement>("button.is-active");
    if (!activeButton) return;
    const targetLeft = activeButton.offsetLeft - (rail.clientWidth - activeButton.offsetWidth) / 2;
    rail.scrollTo({ left: Math.max(0, targetLeft), behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [activeChapter, prefersReducedMotion]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    document.documentElement.classList.add("brand-story-snap-scroll");

    const revealObserver = revealOnScroll(root.querySelectorAll<HTMLElement>("[data-brand-reveal]"), {
      distance: 18,
      duration: 560,
      threshold: 0.12,
    });
    const removeHover = hoverLift(root.querySelectorAll<HTMLElement>("[data-brand-hover]"), {
      distance: 4,
      scale: 1.01,
      duration: 220,
    });
    const chapterNodes = aboutChapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((node): node is HTMLElement => Boolean(node));
    const chapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveChapter(visible.target.id);
    }, { rootMargin: "-28% 0px -52%", threshold: [0.05, 0.45, 0.85] });
    chapterNodes.forEach((node) => chapterObserver.observe(node));

    return () => {
      document.documentElement.classList.remove("brand-story-snap-scroll", "brand-story-free-scroll");
      revealObserver?.disconnect?.();
      chapterObserver.disconnect();
      removeHover?.();
    };
  }, []);

  return (
    <div className={`brand-story-page${isPageReady ? " is-page-ready" : ""}${isActiveChapterTall ? " is-reading-long-chapter" : ""}`} data-active-chapter={activeChapter} ref={pageRef}>
      <SiteFibers paused={!isPageReady} className="site-fibers-layer--brand" />
      <a className="brand-story-skip" href="#brand-story-main">本文へ移動</a>
      <header className={`brand-story-header${isMobileMenuOpen ? " is-menu-open" : ""}`}>
        <a className="brand-story-logo" href="/" aria-label="Tuliko ホーム" onClick={handleRouteChange}>
          <img src="/assets/brand/tuliko-logo.png" alt="Tuliko" />
        </a>
        <button
          type="button"
          className="brand-story-menu-toggle"
          aria-expanded={isMobileMenuOpen}
          aria-controls="brand-story-navigation"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span>メニュー</span>
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
        <nav id="brand-story-navigation" aria-label="サイトナビゲーション">
          {navigation.map((item) => (
            <a href={item.href} key={item.href} aria-current={item.href === "/about/" ? "page" : undefined} onClick={(event) => { setIsMobileMenuOpen(false); handleRouteChange(event); }}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="brand-story-header-cta" href="/#consultation" onClick={handleRouteChange}>導入相談</a>
      </header>

      <aside className="brand-story-accordion-shell" aria-label="Tulikoについての章">
        <nav className="brand-story-accordion">
          {aboutChapters.map((chapter, index) => {
            const isActive = activeChapter === chapter.id;
            return (
              <button
                type="button"
                key={chapter.id}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "location" : undefined}
                aria-controls={chapter.id}
                data-accordion-id={chapter.id}
                onClick={() => scrollToChapter(chapter.id)}
              >
                <span className="brand-story-accordion-line">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  <span>{chapter.label}</span>
                </span>
                <strong>{chapter.title}</strong>
                <span className="brand-story-accordion-detail" aria-hidden={!isActive}>
                  <span>{chapter.summary}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <div className="brand-story-accordion-foundation" aria-label="Tuliko の設計の流れ">
          <p>ブランドストーリーの時間軸</p>
          <ol>
            <li><span>01</span><b>日本</b><small>働き方の課題</small></li>
            <li><span>02</span><b>関連製造基盤</b><small>2002–2021</small></li>
            <li><span>03</span><b>Tuliko</b><small>2026–</small></li>
          </ol>
        </div>
      </aside>

      <nav className="brand-story-chapter-rail" aria-label="ページ内の章" ref={chapterRailRef}>
        {aboutChapters.map((chapter, index) => (
          <button
            type="button"
            key={chapter.id}
            className={activeChapter === chapter.id ? "is-active" : undefined}
            aria-current={activeChapter === chapter.id ? "location" : undefined}
            aria-label={`${String(index + 1).padStart(2, "0")} ${chapter.label}へ移動`}
            onClick={() => scrollToChapter(chapter.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}<b>{chapter.label}</b></span><i aria-hidden="true" />
          </button>
        ))}
        <span className="brand-story-chapter-total" aria-hidden="true">07章</span>
      </nav>

      <main id="brand-story-main" className="brand-story-media-track">
        <section className="brand-story-hero brand-story-snap" id="about-intro" aria-labelledby="brand-story-title" data-background-index="01">
          <div className="brand-story-hero-copy">
            <p className="brand-story-index">01 / 日本のオフィスにある課題</p>
            <h1 id="brand-story-title">一台を運ぶのではない。<br className="brand-story-title-break" />オフィスに、静けさを<br className="brand-story-title-break" />取り戻す。</h1>
            <p className="brand-story-lead">
              聞かれたくない通話、集中したいオンライン会議、途切れずに考えたい時間。
              Tuliko は、静けさを希少な設備ではなく、オフィスで選べる仕事の条件にします。
            </p>
          </div>
          <figure
            className={`brand-story-product-plate${isProductPlaybackPaused ? " is-product-paused" : ""}`}
            ref={heroProductRef}
            onPointerEnter={() => setIsProductHovered(true)}
            onPointerLeave={() => setIsProductHovered(false)}
            onFocusCapture={() => setIsProductFocused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsProductFocused(false);
            }}
          >
            <div className="brand-story-product-visual">
              {previousHeroProductData && previousHeroProduct !== activeHeroProduct ? (
                <img
                  className="brand-story-product-image brand-story-product-image--previous"
                  src={previousHeroProductData.image}
                  srcSet={`${previousHeroProductData.image} 1600w, ${previousHeroProductData.imageHigh} 2368w`}
                  sizes="(min-width: 981px) calc(100vw - 430px), calc(100vw - 32px)"
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  data-product-layer="previous"
                />
              ) : null}
              <img
                className="brand-story-product-image brand-story-product-image--current"
                src={currentHeroProduct.image}
                srcSet={`${currentHeroProduct.image} 1600w, ${currentHeroProduct.imageHigh} 2368w`}
                sizes="(min-width: 981px) calc(100vw - 430px), calc(100vw - 32px)"
                alt={currentHeroProduct.alt}
                fetchPriority={activeHeroProduct === 0 ? "high" : "auto"}
                decoding="async"
                data-product-layer="current"
              />
              <span className="brand-story-product-light" key={`light-${activeHeroProduct}`} aria-hidden="true" />
            </div>
            <figcaption className="brand-story-product-meta" data-product-swap="meta">
              <span>MODEL {String(activeHeroProduct + 1).padStart(2, "0")} / {String(heroProducts.length).padStart(2, "0")}</span>
              <strong>{currentHeroProduct.sku}</strong>
              <dl>
                <div><dt>サイズ</dt><dd>{currentHeroProduct.size}</dd></div>
                <div><dt>構成</dt><dd>{currentHeroProduct.configuration}</dd></div>
                <div><dt>カラー</dt><dd>{currentHeroProduct.color}</dd></div>
              </dl>
            </figcaption>
            <a className="brand-story-hero-evidence" href="#about-evidence" aria-label="SGS 音響試験の報告書記載値と適用条件を確認する">
              <span>SGS 音響試験</span>
              <strong>30.3 dB<sup>*</sup></strong>
              <small>ISO 23351-1:2020 / Class A</small>
              <em>*報告書記載の試料・条件。対象型番は個別確認。</em>
            </a>
            <div className="brand-story-origin-rail" aria-label="Tuliko ブランドストーリーの時間軸">
              <span><b>日本</b><small>働き方の課題</small></span>
              <span><b>関連製造基盤</b><small>2002–2021</small></span>
              <span><b>Tuliko</b><small>2026–</small></span>
            </div>
            <div className="brand-story-product-player" aria-label="製品バリエーション">
              <div className="brand-story-product-transport">
                <button type="button" onClick={() => showHeroProduct(activeHeroProduct - 1)} aria-label="前の製品を表示">←</button>
                <button
                  type="button"
                  onClick={() => setIsProductAutoplayEnabled((current) => !current)}
                  aria-label={isProductAutoplayEnabled ? "製品の自動再生を停止" : "製品の自動再生を開始"}
                  aria-pressed={!isProductAutoplayEnabled}
                  disabled={prefersReducedMotion}
                >
                  {prefersReducedMotion ? "停止中" : isProductAutoplayEnabled ? "停止" : "再生"}
                </button>
                <button type="button" onClick={() => showHeroProduct(activeHeroProduct + 1)} aria-label="次の製品を表示">→</button>
              </div>
              <div className="brand-story-product-selector" role="group" aria-label="表示する製品を選択">
                {heroProducts.map((product, index) => (
                  <button
                    type="button"
                    key={product.sku}
                    id={`hero-product-${product.sku}`}
                    className={activeHeroProduct === index ? "is-active" : undefined}
                    aria-pressed={activeHeroProduct === index}
                    aria-label={`${product.sku} ${product.size} ${product.configuration} ${product.color}`}
                    tabIndex={activeHeroProduct === index ? 0 : -1}
                    onClick={() => showHeroProduct(index)}
                    onKeyDown={(event) => selectHeroProductFromKeyboard(event, index)}
                  >
                    {product.sku.replace("SPD", "")}
                  </button>
                ))}
              </div>
              <span className="brand-story-product-progress" aria-hidden="true"><i key={activeHeroProduct} /></span>
            </div>
          </figure>
          <div className="brand-story-hero-rule" aria-hidden="true"><i /><i /><i /></div>
        </section>

        <section className="brand-story-statement brand-story-snap" id="about-purpose" aria-labelledby="brand-story-statement-title" data-background-index="02">
          <p className="brand-story-index">02 / 関連製造端の公開発展記録</p>
          <div className="brand-story-statement-content">
            <div>
              <h2 id="brand-story-statement-title">私たちの土台は、<br />働き方を見つめた<br />家具づくりにある。</h2>
            </div>
            <div className="brand-story-use-case-media">
              <div className="brand-story-use-case-tabs" role="tablist" aria-label="関連製造端の発展時期を選択">
                {useCases.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    id={`quality-tab-${item.id}`}
                    role="tab"
                    aria-selected={activeUseCase === item.id}
                    aria-controls={`quality-panel-${item.id}`}
                    tabIndex={activeUseCase === item.id ? 0 : -1}
                    className={activeUseCase === item.id ? "is-active" : undefined}
                    onClick={() => setActiveUseCase(item.id)}
                    onKeyDown={(event) => selectUseCaseFromKeyboard(event, index)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div
                className="brand-story-use-case-panel"
                id={`quality-panel-${currentUseCase.id}`}
                role="tabpanel"
                aria-labelledby={`quality-tab-${currentUseCase.id}`}
                aria-live="polite"
              >
                <VisualPanel
                  key={currentUseCase.id}
                  image={currentUseCase.image}
                  alt={currentUseCase.alt}
                  title={currentUseCase.title}
                  text={currentUseCase.text}
                  mediaLabel="現代のコンセプトイメージ（生成）／当時の記録画像ではありません"
                  className="brand-story-switch-panel"
                />
              </div>
              <p className="brand-story-quality-definition"><strong>事実の境界：</strong> 2002–2021年は関連製造端の公開発展記録です。Tuliko自身の創立年、法人沿革、ブランド実績ではありません。</p>
            </div>
          </div>
        </section>

        <section className="brand-story-products brand-story-snap" id="about-products" aria-labelledby="brand-story-products-title" data-background-index="03">
          <div className="brand-story-products-heading">
            <p className="brand-story-index">03 / 2019年の転換点</p>
            <h2 id="brand-story-products-title">デスクとチェアから、<br />音とプライバシーの空間へ。</h2>
          </div>
          <div className="brand-story-product-grid">
            {methodSteps.map((step) => (
              <article key={step.step}>
                <img src={step.image} alt={step.alt} loading="lazy" decoding="async" />
                <span className="brand-story-product-card-caption">
                  <small>{step.step} / {step.mediaLabel}</small>
                  <strong>{step.phase}</strong>
                  <span>{step.detail}</span>
                </span>
              </article>
            ))}
          </div>
          <a className="brand-story-product-more" href="/business/" onClick={handleRouteChange}>現在の製品仕様を見る</a>
        </section>

        <section className="brand-story-evidence brand-story-snap" id="about-evidence" aria-labelledby="brand-story-evidence-title" data-background-index="04" data-brand-reveal>
          <div className="brand-story-evidence-heading">
            <p className="brand-story-index">04 / 2026年 日本市場ブランド始動</p>
            <h2 id="brand-story-evidence-title">Tulikoは、日本の<br />オフィスへ向けて始まった。</h2>
          </div>
          <div className="brand-story-launch-layout">
            <figure className="brand-story-launch-mark">
              <img src="/assets/brand/tuliko-logo.png" alt="Tuliko" loading="lazy" decoding="async" />
              <figcaption>
                <span>JAPAN MARKET BRAND START</span>
                <strong>2026.08</strong>
                <a href="https://www.alibabacloud.com/en/whois/tuliko-jp.com" target="_blank" rel="noreferrer">tuliko-jp.com / 登録情報を確認</a>
              </figcaption>
            </figure>
            <ol className="brand-story-launch-list">
              {launchMilestones.map((item) => (
                <li key={item.number}>
                  <span>{item.number}</span>
                  <div><h3>{item.title}</h3><p>{item.text}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <p className="brand-story-evidence-note">2026年の始動は、日本法人の設立、商標登録、日本全国のサービス網完成を意味しません。Tuliko自身の歩みは、ここから始まります。</p>
        </section>

        <section className="brand-story-making brand-story-snap" id="about-delivery" aria-labelledby="brand-story-making-title" data-background-index="05">
          <div className="brand-story-making-heading">
            <p className="brand-story-index">05 / 現在の導入プロセス</p>
            <h2 id="brand-story-making-title">製造の積み重ねを、<br />導入判断に変える。</h2>
          </div>
          <div className="brand-story-making-copy">
            <div className="brand-story-delivery-layout">
              <figure className="brand-story-process-visual" data-brand-reveal>
                <video controls playsInline preload="metadata" poster="/assets/video/spd01-product-poster.png" aria-label="SPD01 製品確認映像">
                  <source src="/assets/video/spd01-product-hero-seedance25-480p-v1.mp4" type="video/mp4" />
                </video>
                <figcaption>SPD01 / 製品確認映像 / 16:9 / 環境音あり</figcaption>
              </figure>
              <ol className="brand-story-delivery-list">
                {deliverySteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div><h3>{step.title}</h3><p>{step.text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="brand-story-planning-strip" aria-label="導入前の確認事項">
              {planningInfo.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.label}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="brand-story-company brand-story-snap" id="about-company" aria-labelledby="brand-story-company-title" data-background-index="06">
          <div>
            <p className="brand-story-index">06 / 事実と適用範囲</p>
            <h2 id="brand-story-company-title">確認できることと、<br />確認が必要なことを分ける。</h2>
          </div>
          <div className="brand-story-company-content">
            <figure className="brand-story-company-report">
              <img src="/assets/docs/sgs-report-page.webp" alt="SGS TEST REPORT 第3頁。試験条件と Speech Level Reduction の結果を記載" loading="lazy" decoding="async" />
              <figcaption>
                <small>SGS TEST REPORT / 2026-05-28</small>
                <strong>30.3 dB は、報告書記載の試料と条件の結果です。</strong>
                <span>ISO 23351-1:2020 / Class A。対象モデルへの適用は個別に確認します。</span>
                <a href="/assets/docs/sgs-acoustic-test-czin2605000320cm02-en.pdf" target="_blank" rel="noreferrer">報告書PDFを開く</a>
              </figcaption>
            </figure>
            <dl>
              {riskInfo.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="brand-story-close brand-story-snap" id="about-contact" aria-labelledby="brand-story-close-title" data-background-index="07">
          <p className="brand-story-index">07 / 現在とこれから</p>
          <div className="brand-story-close-copy">
            <h2 id="brand-story-close-title">日本のオフィスへ、<br />ちょうどよい静けさを。</h2>
            <p className="brand-story-close-lead">利用シーン、人数、仕様、配置条件、確認可能な資料を一つずつつなぎます。ブランドは、一回ごとの導入判断の中で確認されていきます。</p>
            <div className="brand-story-close-actions">
              <a className="is-secondary" href="#about-company">試験資料を確認する</a>
              <a className="is-secondary" href="/business/" onClick={handleRouteChange}>製品仕様を比較する</a>
              <a href="/#consultation" onClick={handleRouteChange}>導入について相談する</a>
            </div>
          </div>
          <VisualPanel
            image="/assets/brand-story/japan-office-use-current-v3.webp"
            alt="日本のオープンオフィスで Tuliko 静音ワークブースを利用する生成イメージ"
            title="SPD01 / 利用イメージ（生成）"
            text="実際の導入事例ではありません。"
            className="brand-story-contact-visual"
          />
        </section>
      </main>

      <footer className="brand-story-footer">
        <span>© Tuliko</span>
        <span>製造の積み重ねから、日本のオフィスへ、ちょうどよい静けさを。</span>
        <a href="/" onClick={handleRouteChange}>製品体験へ戻る</a>
      </footer>
    </div>
  );
}
