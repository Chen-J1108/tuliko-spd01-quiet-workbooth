import { type MouseEvent, useEffect, useState } from "react";
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
  {
    number: "01",
    title: "声が重なると、\n仕事の輪郭が薄くなる。",
    copy: "通話、オンライン会議、短い相談、深い集中。ひとつのオフィスに異なる仕事が同時に起きるからこそ、声と視線を置き直せる場所が必要になります。",
    image: "/assets/video/spd01-noise-to-quiet-poster.jpg",
    alt: "オープンオフィス内に設置された灰緑色の SPD01 静音ワークブースへ入る利用者",
    label: "オフィスでの利用シーン",
  },
  {
    number: "02",
    title: "閉じこめるためではなく、\n仕事に境界をつくるために。",
    copy: "Tuliko は、オフィスから人を切り離すのではなく、必要なときに集中と会話を選べる小さな空間を考えます。ガラスの見通し、扉、内装、デスク、照明を、ひとつの使い方として整えます。",
    image: "/assets/products/catalog-hq/spd01-grey-green.webp",
    alt: "灰緑色で直線デスクを備えた Tuliko SPD01 静音ワークブース",
    label: "SPD01 / 一人用・直線デスク",
  },
  {
    number: "03",
    title: "構造を、\n使う瞬間から考える。",
    copy: "入る。座る。話す。考える。そしてオフィスへ戻る。その一連の動きに対して、前面のガラス、扉、内装パネル、デスク、フロアマット、天井照明といった構成を見える情報として扱います。",
    image: "/assets/video/spd01-structure-v5-poster.webp",
    alt: "SPD01 のフレーム、ガラス、内装、デスクが見える構造確認映像の一場面",
    label: "SPD01 / 構造確認映像",
  },
  {
    number: "04",
    title: "余白を、\n空いた場所だけに任せない。",
    copy: "電話や集中作業のための一人用から、会話のためのミーティング仕様まで。用途、人数、内装の構成と配置条件を一緒に確かめ、既存のオフィスに必要な場を足していきます。",
    image: "/assets/scenes/scene-5.webp",
    alt: "オフィス空間に配置された二台の静音ワークブースの使用イメージ",
    label: "配置イメージ / 実際の導入事例ではありません",
  },
] as const;

const principles = [
  { number: "01", title: "音の境界", text: "音の振る舞いを、雰囲気ではなく構造と確認条件から扱う。" },
  { number: "02", title: "プライバシーの余白", text: "会話と視線に、必要な距離をつくりながら、オフィスとのつながりを残す。" },
  { number: "03", title: "空間の使い方", text: "利用人数、動線、搬入、電源、設置場所を、製品の前に確かめる。" },
] as const;

const peopleStories = [
  {
    role: "短い通話を始める人",
    title: "席を離れずに、\n声を整える。",
    text: "急なオンライン会議でも、周囲の作業を止めずに話せる場所を選ぶ。",
    image: "/assets/video/spd01-noise-to-quiet-poster.jpg",
    alt: "オフィス内の SPD01 に向かう女性",
  },
  {
    role: "集中を取り戻す人",
    title: "短い集中に、\n自分の境界をつくる。",
    text: "視線と声が交差する場所から少し離れ、目の前の作業へ戻る。",
    image: "/assets/video/spd01-focus-textfree-v1-poster.webp",
    alt: "SPD01 内でノートパソコンを操作する女性",
  },
  {
    role: "相談を始める二人",
    title: "会議室ほどではない\n会話のために。",
    text: "話す前に空室を探すのではなく、必要な会話の場所をオフィスに用意する。",
    image: "/assets/brand-story/lineage-2008-concept-v2.webp",
    alt: "二台の静音ワークブースを前に構成を確認する二人の利用イメージ",
  },
] as const;

const history = [
  {
    year: "2002",
    title: "家具と働き方を見つめる関連製造端の公開記録",
    text: "杭州のオフィス家具事業を起点とする公開発展記録。Tuliko 自身の創立年や沿革ではありません。",
    image: "/assets/brand-story/lineage-2002-concept-v1.webp",
    alt: "オフィス家具の設計基盤を表現した現代のコンセプトイメージ",
  },
  {
    year: "2019",
    title: "電話ブースシリーズの開発が公開記録に現れる",
    text: "デスクとチェアに加えて、声とプライバシーのための空間へ製品領域が広がる転換点です。",
    image: "/assets/brand-story/phone-booth-2019-concept-v1.webp",
    alt: "電話ブース開発への転換を表現した現代のコンセプトイメージ",
  },
  {
    year: "2020–21",
    title: "電話・会議・ワークポッドへ構成を広げる",
    text: "関連製造端の公開記録に基づくモジュラー音響空間の展開。これも Tuliko の沿革ではありません。",
    image: "/assets/brand-story/modular-2020-2021-concept-v1.webp",
    alt: "複数サイズのモジュラー音響ワークスペースを表現した現代のコンセプトイメージ",
  },
  {
    year: "2026.08",
    title: "Tuliko、日本のオフィスとの対話を始める",
    text: "ドメイン登録と製品サイトのブランド統一を起点にした日本市場向けのブランド始動です。日本法人、商標、全国サービス網の完成を意味しません。",
    image: null,
    alt: "",
  },
] as const;

const historySidebarNotes = [
  {
    year: "2002–2021",
    title: "関連製造端の公開記録",
    text: "製造と製品開発の背景であり、Tuliko 自身の沿革ではありません。",
  },
  {
    year: "2026.08",
    title: "Tuliko 日本市場向けブランド始動",
    text: "ドメイン登録と製品サイトのブランド統一を起点にした、現在の対話です。",
  },
] as const;

const products = [
  { sku: "SPD01", role: "一人で集中・通話", setup: "直線デスク", image: "/assets/products/catalog-hq/spd01-grey-green.webp", alt: "灰緑色の一人用直線デスク仕様 SPD01" },
  { sku: "SPD02", role: "一人で作業", setup: "L型デスク", image: "/assets/products/catalog-hq/spd02-white.webp", alt: "白色の一人用L型デスク仕様 SPD02" },
  { sku: "SPD03", role: "立位も含む作業", setup: "昇降デスク", image: "/assets/products/catalog-hq/spd03-gloss-grey.webp", alt: "光沢グレーの一人用昇降デスク仕様 SPD03" },
  { sku: "SPD07", role: "二人の会話", setup: "ミーティング", image: "/assets/products/catalog-hq/spd07-shadow-grey.webp", alt: "陰影グレーの二人用ミーティング仕様 SPD07" },
  { sku: "SPD12", role: "小さな打ち合わせ", setup: "ミーティング", image: "/assets/products/catalog-hq/spd12-grey-green.webp", alt: "灰緑色の中型ミーティング仕様 SPD12" },
  { sku: "SPD14", role: "チームでの会話", setup: "ミーティング", image: "/assets/products/catalog-hq/spd14-black.webp", alt: "黒色の大型ミーティング仕様 SPD14" },
] as const;

function routeChange(event: MouseEvent<HTMLAnchorElement>) {
  if (event.currentTarget.origin === window.location.origin && !event.currentTarget.target) {
    document.documentElement.classList.add("is-story-route-leaving");
  }
}

export function BrandNarrativePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "ブランドストーリー | Tuliko";
    document.documentElement.classList.remove("is-story-route-leaving");
    const previous = document.querySelector('meta[name="description"]')?.getAttribute("content");
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.append(description);
    }
    description.setAttribute("content", "Tulikoが、オフィスの騒がしさ、プライバシー、集中と会話のための場所に向き合う考え方をご紹介します。");
    return () => {
      if (previous) description?.setAttribute("content", previous);
    };
  }, []);

  return (
    <div className="narrative-page">
      <a className="narrative-skip" href="#narrative-main">本文へ移動</a>
      <header className="narrative-header">
        <a className="narrative-logo" href="/" aria-label="Tuliko ホーム" onClick={routeChange}>
          <img src="/assets/brand/tuliko-logo.png" alt="Tuliko" />
        </a>
        <nav className="narrative-nav" aria-label="メインナビゲーション">
          {navigation.map((item) => <a key={item.href} href={item.href} aria-current={item.href === "/story/" ? "page" : undefined} onClick={routeChange}>{item.label}</a>)}
        </nav>
        <a className="narrative-header-cta" href="/#consultation" onClick={routeChange}>導入相談 <ArrowUpRight size={16} weight="bold" aria-hidden="true" /></a>
        <button className="narrative-menu-button" type="button" aria-expanded={menuOpen} aria-controls="narrative-mobile-menu" onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}<span>メニュー</span>
        </button>
      </header>
      <div className={`narrative-mobile-menu ${menuOpen ? "is-open" : ""}`} id="narrative-mobile-menu" hidden={!menuOpen}>
        {navigation.map((item) => <a key={item.href} href={item.href} aria-current={item.href === "/story/" ? "page" : undefined} onClick={(event) => { setMenuOpen(false); routeChange(event); }}>{item.label}</a>)}
        <a href="/#consultation" onClick={(event) => { setMenuOpen(false); routeChange(event); }}>導入相談</a>
      </div>

      <main id="narrative-main">
        <section className="narrative-hero" aria-labelledby="narrative-title">
          <video className="narrative-hero-video" autoPlay muted loop playsInline preload="metadata" poster="/assets/video/spd01-noise-to-quiet-poster.jpg" aria-label="オープンオフィス内の SPD01 静音ワークブースの製品映像">
            <source src="/assets/video/spd01-noise-to-quiet.mp4" type="video/mp4" />
          </video>
          <div className="narrative-hero-shade" aria-hidden="true" />
          <div className="narrative-wrap narrative-hero-copy">
            <p className="narrative-kicker">TULIKO / BRAND STORY</p>
            <h1 id="narrative-title">静けさは、<br />働くための余白になる。</h1>
            <p>オフィスの中に、話すこと、考えること、ひとりで整えることのための場所を。Tuliko は、静音ワークブースを通じて、その選択肢をつくります。</p>
            <a className="narrative-link" href="#problem">なぜ、静音ブースなのか <ArrowDown size={17} weight="bold" aria-hidden="true" /></a>
          </div>
          <p className="narrative-hero-caption">SPD01 / オフィスでの利用シーン</p>
        </section>

        <section className="narrative-problem narrative-wrap" id="problem" aria-labelledby="problem-title">
          <p className="narrative-kicker">THE ROOM WE SHARE</p>
          <div>
            <h2 id="problem-title">オープンであることと、<br />無防備であることは違う。</h2>
            <p>声が届く。視線が交わる。短い会議の場所を探す。これらは日常の小さな摩擦ですが、集中と会話の質を少しずつ削っていきます。</p>
          </div>
          <ol className="narrative-problem-list">
            <li><span>01</span><strong>声が重なる</strong><p>通話と会話が、周囲の作業と同じ場所で起きる。</p></li>
            <li><span>02</span><strong>場所が足りない</strong><p>一人で整える時間にも、短い打ち合わせにも、空席を探す。</p></li>
            <li><span>03</span><strong>境界がない</strong><p>必要なプライバシーを、席替えや空き会議室だけに委ねる。</p></li>
          </ol>
        </section>

        <section className="narrative-people" aria-labelledby="people-title">
          <div className="narrative-wrap">
            <p className="narrative-kicker">PEOPLE IN THE FLOW OF WORK</p>
            <div className="narrative-people-heading"><h2 id="people-title">静けさが必要になる、<br />具体的な瞬間。</h2><p>誰かの声を消すためではなく、一人ひとりが仕事のリズムを取り戻すために。ここにいる人物は製品映像と使用イメージによる利用者像であり、顧客事例や社員紹介ではありません。</p></div>
            <div className="narrative-people-grid">
              {peopleStories.map((person) => <figure key={person.role} className="narrative-person-card"><img src={person.image} alt={person.alt} loading="lazy" decoding="async" /><figcaption><small>{person.role}</small><h3>{person.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h3><p>{person.text}</p></figcaption></figure>)}
            </div>
            <p className="narrative-people-caption">人物表現：製品映像内の演出および現代のコンセプトイメージ（生成）／実際の導入事例・顧客・社員を示すものではありません。</p>
          </div>
        </section>

        <section className="narrative-history" aria-labelledby="history-title">
          <div className="narrative-wrap">
            <p className="narrative-kicker">THE PATH TO A QUIETER ROOM</p>
            <div className="narrative-history-heading"><h2 id="history-title">製品の前にある、<br />問いの積み重ね。</h2><p>この年表は、関連製造端の公開記録と Tuliko のブランド始動を意図的に分けて示します。製造や製品開発の背景を、そのまま Tuliko の企業実績にはしません。</p></div>
            <div className="narrative-history-workbench">
              <ol className="narrative-history-list">
                {history.map((entry) => <li key={entry.year}><div className="narrative-history-meta"><span>{entry.year}</span><i aria-hidden="true" /></div><div className="narrative-history-copy"><h3>{entry.title}</h3><p>{entry.text}</p></div></li>)}
              </ol>
              <aside className="narrative-history-aside" aria-label="時間軸の要点">
                <figure><img src="/assets/brand-story/lineage-2008-concept-v2.webp" alt="二台の静音ワークブースを前に構成を確認する二人の利用イメージ" loading="lazy" decoding="async" /><figcaption>現代のコンセプトイメージ（生成）／当時の記録画像ではありません</figcaption></figure>
                <ol>
                  {historySidebarNotes.map((note) => <li key={note.year}><span>{note.year}</span><strong>{note.title}</strong><p>{note.text}</p></li>)}
                </ol>
              </aside>
            </div>
          </div>
        </section>

        <section className="narrative-chapter-intro narrative-wrap" aria-labelledby="chapters-title">
          <p className="narrative-kicker">A DIFFERENT KIND OF ROOM</p>
          <h2 id="chapters-title">必要なのは、<br />オフィスから離れることではない。</h2>
          <p>仕事の流れの中に、静けさを選べる境界をつくることです。</p>
        </section>

        <div className="narrative-chapters">
          {chapters.map((chapter, index) => (
            <section className={`narrative-chapter narrative-chapter--${index + 1}`} key={chapter.number} aria-labelledby={`chapter-${chapter.number}`}>
              <div className="narrative-wrap narrative-chapter-grid">
                <div className="narrative-chapter-copy">
                  <span className="narrative-chapter-number">{chapter.number}</span>
                  <h2 id={`chapter-${chapter.number}`}>{chapter.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
                  <p>{chapter.copy}</p>
                </div>
                <figure className="narrative-chapter-media">
                  <img src={chapter.image} alt={chapter.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" />
                  <figcaption>{chapter.label}</figcaption>
                </figure>
              </div>
            </section>
          ))}
        </div>

        <section className="narrative-principles" aria-labelledby="principles-title">
          <div className="narrative-wrap">
            <p className="narrative-kicker">THREE PRINCIPLES</p>
            <h2 id="principles-title">静けさを、<br />仕様の前に考える。</h2>
            <div className="narrative-principle-grid">
              {principles.map((principle) => <article key={principle.number}><span>{principle.number}</span><h3>{principle.title}</h3><p>{principle.text}</p></article>)}
            </div>
            <p className="narrative-disclosure">音響に関する性能値、適用対象、設置条件は、対象モデルと試験・導入条件を分けて確認します。</p>
          </div>
        </section>

        <section className="narrative-products narrative-wrap" aria-labelledby="products-title">
          <div className="narrative-products-heading"><p className="narrative-kicker">CHOOSE THE ROOM</p><h2 id="products-title">仕事の場面から、<br />選べる SPD シリーズへ。</h2><p>掲載中の仕様から、利用場面に近い構成を見つけてください。寸法、色、設置条件は製品ページと相談時に確認できます。</p></div>
          <div className="narrative-product-grid">
            {products.map((product) => <a href={`/business/?product=${product.sku}`} key={product.sku} className="narrative-product-card" onClick={routeChange}><img src={product.image} alt={product.alt} loading="lazy" decoding="async" /><span><strong>{product.sku}</strong><small>{product.role}</small><em>{product.setup}</em></span></a>)}
          </div>
          <a className="narrative-link narrative-products-link" href="/business/" onClick={routeChange}>すべての製品を見る <ArrowUpRight size={17} weight="bold" aria-hidden="true" /></a>
        </section>

        <section className="narrative-close" aria-labelledby="close-title">
          <div className="narrative-wrap narrative-close-grid">
            <div><p className="narrative-kicker">OUR PROMISE</p><h2 id="close-title">置く前に、<br />使われる場所を知る。</h2><p>製品を先に決めるのではなく、どんな会話に、どんな集中に、どんな動線に必要かを聞く。Tuliko は、その確認から導入を始めます。</p></div>
            <div className="narrative-close-actions"><a href="/business/" onClick={routeChange}>製品を比較する <ArrowUpRight size={17} weight="bold" aria-hidden="true" /></a><a className="is-light" href="/#consultation" onClick={routeChange}>導入について相談する <ArrowUpRight size={17} weight="bold" aria-hidden="true" /></a></div>
          </div>
        </section>
      </main>
      <footer className="narrative-footer narrative-wrap"><img src="/assets/brand/tuliko-logo.png" alt="Tuliko" /><span>働く空間に、集中と会話を守る静けさを。</span><a href="/" onClick={routeChange}>ホームへ戻る</a></footer>
    </div>
  );
}
