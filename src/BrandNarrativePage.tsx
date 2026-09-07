import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, List, X } from "@phosphor-icons/react";
import "./brand-narrative.css";

const navigation = [
  { href: "/", label: "ホーム" },
  { href: "/business/", label: "製品" },
  { href: "/cases/", label: "配置検討" },
  { href: "/story/", label: "ブランドストーリー" },
  { href: "/about/", label: "会社情報" },
] as const;

const chapters = [
  { id: "founder", number: "01", label: "原点" },
  { id: "problem", number: "02", label: "きっかけ" },
  { id: "choices", number: "03", label: "試行錯誤" },
  { id: "birth", number: "04", label: "誕生" },
  { id: "today", number: "05", label: "これから" },
] as const;

const decisions = [
  { title: "閉じるほど、居心地が遠のいた。", body: "最初の実寸モックアップは、音を遮ることばかりを考えた箱だった。中に座ると、圧迫感がある。森川は囲い方を見直し、外の気配がわかるガラスと、視線の落ち着く内装を検討し直した。", choice: "遮るだけでなく、つながりを残す。" },
  { title: "小さくするほど、使い方が窮屈になった。", body: "机を広げれば、出入りしにくい。椅子を引けば、扉に近づく。紙の図面だけではわからず、床にテープを貼り、入る、座る、立つという動きを何度もやり直した。", choice: "寸法の前に、人の動きを確かめる。" },
  { title: "全部を足すと、必要なものが見えなくなった。", body: "機能を増やすたびに、構成と費用が膨らんだ。限られた試作予算の中で、森川は装飾を後回しにした。机、照明、空気の流れ。短い時間を心地よく過ごすための要素から整えた。", choice: "足すことより、残すものを選ぶ。" },
] as const;

const principles = [
  { title: "まず、使う人の話を聞く。", body: "何人で、どんな会話に使うのか。製品を決める前に、その場所で起きていることを知る。" },
  { title: "見えない条件も、伝える。", body: "音響性能、搬入経路、設置スペース。印象だけで語らず、対象モデルと確認条件を分けて説明する。" },
  { title: "置いた後の毎日を考える。", body: "扉を開け、席に着き、仕事へ戻る。その繰り返しに無理がないかを、選び方の基準にする。" },
] as const;

function StoryArrow() { return <ArrowUpRight size={18} aria-hidden="true" />; }

export function BrandNarrativePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState("founder");
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = "創業ストーリー（フィクション） | Tuliko";
    document.documentElement.classList.remove("is-story-route-leaving");
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = "founder";
      for (const chapter of chapters) {
        if ((document.getElementById(chapter.id)?.getBoundingClientRect().top ?? Infinity) <= 220) current = chapter.id;
      }
      setActiveChapter(current);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    const hash = window.location.hash.slice(1);
    const entryFrame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "instant" });
      update();
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(entryFrame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="narrative-page">
      <a className="narrative-skip" href="#narrative-main">本文へ移動</a>
      <header className="narrative-header">
        <a className="narrative-logo" href="/" aria-label="Tuliko ホーム"><img src="/assets/brand/tuliko-logo.png" alt="Tuliko" width="106" height="40" /></a>
        <nav className="narrative-nav" aria-label="メインナビゲーション">
          {navigation.map(item => <a key={item.href} href={item.href} aria-current={item.href === "/story/" ? "page" : undefined}>{item.label}</a>)}
        </nav>
        <a className="narrative-header-cta" href="/#consultation">導入相談 <StoryArrow /></a>
        <button ref={menuButton} className="narrative-menu-button" type="button" aria-expanded={menuOpen} aria-controls="narrative-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span>{menuOpen ? "閉じる" : "メニュー"}</span>{menuOpen ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
        </button>
      </header>
      <nav className="narrative-mobile-menu" id="narrative-mobile-menu" aria-label="モバイルナビゲーション" hidden={!menuOpen}>
        {navigation.map(item => <a key={item.href} href={item.href} aria-current={item.href === "/story/" ? "page" : undefined} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
        <a href="/#consultation">導入相談 <StoryArrow /></a>
      </nav>

      <main id="narrative-main">
        <section className="narrative-hero" id="founder" aria-labelledby="narrative-title">
          <div className="narrative-wrap narrative-hero-grid">
            <div className="narrative-hero-copy">
              <p className="narrative-kicker">ブランドストーリー <span>フィクション / 01 — 原点</span></p>
              <h1 id="narrative-title">静けさを、<br />あきらめない。</h1>
              <p className="narrative-hero-intro">働く場所を整えていた一人の設計者が、<br className="desktop-break" />「話す場所がない」という声に出会う。<br className="desktop-break" />Tuliko の想いをたどる、小さな物語。</p>
              <a className="narrative-pill" href="#problem">物語を読む <ArrowDown size={18} aria-hidden="true" /></a>
              <div className="narrative-fiction-note"><strong>創作ストーリー / フィクション</strong><p>人物・出来事はブランドの考え方を伝えるための創作です。実在の創業者や実際の沿革を紹介するものではありません。</p></div>
            </div>
            <figure className="narrative-founder-portrait">
              <img src="/assets/brand-story/founder-morikawa-fiction-v1.webp" alt="架空の創業者・森川直人。設計室の机で鉛筆を持つ人物の生成イメージ" fetchPriority="high" width="1536" height="1024" />
              <figcaption><div><span>この物語の主人公</span><strong>森川 直人<small>Naoto Morikawa</small></strong></div><span>架空の人物・AI生成画像</span></figcaption>
            </figure>
          </div>
          <div className="narrative-wrap narrative-origin"><p>家具ではなく、<br />そこで過ごす時間から。</p><div><p>物語の主人公・森川直人は、小さなオフィスのレイアウトを考える空間設計者。デスクの位置や通路の幅を整える一方で、図面には表れない困りごとがあると感じていた。</p><p>きれいに整ったオフィスでも、落ち着いて話せる場所がない。その違和感が、彼の仕事の向きを少しずつ変えていく。</p></div></div>
        </section>

        <nav className="narrative-chapter-nav" aria-label="物語の章">
          <div className="narrative-wrap">{chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} aria-current={activeChapter === chapter.id ? "location" : undefined}><span>{chapter.number}</span>{chapter.label}</a>)}</div>
        </nav>

        <section className="narrative-moment narrative-paper" id="problem" aria-labelledby="moment-title">
          <div className="narrative-wrap narrative-section-grid">
            <div className="narrative-copy">
              <p className="narrative-kicker">02 — きっかけ</p>
              <h2 id="moment-title">たった一本の電話に、<br />居場所がなかった。</h2>
              <p>あるオフィスを訪れた午後。打ち合わせの途中、担当者が電話を手に廊下へ出た。会議室は埋まり、自席では周囲の声が重なる。彼女は窓際で声を落とし、通話を終えると少し困ったように笑った。</p>
              <blockquote>「少し話したいだけなのに、<br />場所を探してしまうんです。」</blockquote>
              <p>森川が覚えていたのは、電話の内容ではない。誰も悪くないのに、誰かが遠慮しなければならない、その風景だった。</p>
              <p className="narrative-scene-note">創作シーン・台詞 / 実際の顧客の証言ではありません</p>
            </div>
            <figure className="narrative-editorial-image"><img src="/assets/brand-story/founder-corridor-fiction-v1.webp" alt="満室の会議室の外で電話をする女性。創作エピソードの生成イメージ" loading="lazy" width="1536" height="1024" /><figcaption>物語の一場面：オフィスの廊下 / AI生成画像</figcaption></figure>
          </div>
          <div className="narrative-wrap narrative-turning-point"><span>その日、問いが変わった。</span><p>部屋を増やすのではなく、<br /><strong>必要なときに選べる静けさを、足せないか。</strong></p></div>
        </section>

        <section className="narrative-choices" id="choices" aria-labelledby="choices-title">
          <div className="narrative-wrap">
            <div className="narrative-section-heading"><div><p className="narrative-kicker">03 — 試行錯誤</p><h2 id="choices-title">最初の答えは、<br />うまくいかなかった。</h2></div><p>小さく、静かで、居心地がいい。<br />その三つを同時にかなえる難しさに、<br />森川は、試作の机で向き合った。</p></div>
            <div className="narrative-workbench">
              <figure className="narrative-editorial-image"><img src="/assets/brand-story/founder-workshop-fiction-v1.webp" alt="架空の人物・森川が設計机で模型と内装材を検討する生成イメージ" loading="lazy" width="1536" height="1024" /><figcaption>試作の風景を描いた創作イメージ / 実際の開発記録ではありません</figcaption></figure>
              <ol className="narrative-decisions">{decisions.map((decision, index) => <li key={decision.title}><span className="narrative-step-number">0{index + 1}</span><div><h3>{decision.title}</h3><p>{decision.body}</p><strong>{decision.choice}</strong></div></li>)}</ol>
            </div>
          </div>
        </section>

        <section className="narrative-birth narrative-paper" id="birth" aria-labelledby="birth-title">
          <div className="narrative-wrap narrative-birth-grid">
            <figure className="narrative-product-hero"><img src="/assets/products/catalog-hq/spd01-grey-green.webp" alt="掲載製品 SPD01・灰緑色の一人用直線デスク仕様" loading="lazy" width="1000" height="1000" /><figcaption>現在の掲載製品：SPD01<br />創作ストーリー内の試作品ではありません</figcaption></figure>
            <div className="narrative-copy"><p className="narrative-kicker">04 — ブランドの誕生</p><h2 id="birth-title">小さな余白に、<br />Tuliko という名前を。</h2><p>完成を急ぐより、使う場面に立ち返る。その試行錯誤の先で、森川は自分たちの目指す空間に Tuliko という名を置いた。</p><p>それは、オフィスから離れるための箱ではない。一本の電話を終え、ひとつの考えをまとめ、また周囲とつながるための小さな場所だった。</p><blockquote>静けさは、特別な誰かではなく、<br />働く一人ひとりのために。</blockquote><p className="narrative-scene-note">命名の場面は創作です。実際の名称由来・創業年を示すものではありません。</p></div>
          </div>
          <div className="narrative-wrap narrative-story-path" aria-label="創作ストーリーの流れ"><span>物語の歩み<small>実際の企業年表ではありません</small></span><ol>{chapters.map(chapter => <li key={chapter.id}><a href={`#${chapter.id}`}><small>{chapter.number}</small>{chapter.label}</a></li>)}</ol></div>
        </section>

        <section className="narrative-today narrative-paper" id="today" aria-labelledby="today-title">
          <div className="narrative-wrap">
            <div className="narrative-section-heading"><div><p className="narrative-kicker">05 — これからも、大切にしたいこと</p><h2 id="today-title">変えたいのは、<br />広さよりも、過ごし方。</h2></div><p>この物語で伝えたいのは、<br />製品の前に、人と場所を見るという姿勢。<br />Tuliko が大切にしたい三つの視点です。</p></div>
            <div className="narrative-principles">{principles.map((principle, index) => <article key={principle.title}><span>0{index + 1}</span><h3>{principle.title}</h3><p>{principle.body}</p></article>)}</div>
            <div className="narrative-next"><span>物語から、あなたのオフィスへ。</span><a href="/business/">製品ラインアップを見る <StoryArrow /></a><a href="/cases/">配置と使い方を考える <StoryArrow /></a></div>
          </div>
        </section>

        <section className="narrative-close" aria-labelledby="close-title"><div className="narrative-wrap"><p className="narrative-kicker">あなたの場所から、はじめよう。</p><h2 id="close-title">そのオフィスには、<br />どんな静けさが必要ですか。</h2><p>通話のために。考えをまとめるために。<br />まずは、いま困っている場面をお聞かせください。</p><a className="narrative-pill narrative-pill--light" href="/#consultation">導入について相談する <StoryArrow /></a><details className="narrative-disclosure"><summary>このストーリーと画像について</summary><p>このページは、ブランド表現を検討するためのフィクションです。森川直人は架空の人物であり、経歴、会話、試作、命名のエピソードは創作です。人物・情景画像は AI で生成したもので、実在の創業者、社員、顧客、工場、過去の記録を示しません。掲載製品の性能や仕様を保証する内容ではありません。実際の会社情報・試験資料は<a href="/about/">会社情報ページ</a>でご確認ください。</p></details></div></section>
      </main>
      <footer className="narrative-footer"><div className="narrative-wrap"><a href="/" aria-label="Tuliko ホーム"><img src="/assets/brand/tuliko-logo.png" alt="Tuliko" width="94" height="36" /></a><span>ブランドストーリー・創作コンセプト</span><a href="#founder">ページの先頭へ <ArrowUpRight size={16} aria-hidden="true" /></a></div></footer>
    </div>
  );
}
