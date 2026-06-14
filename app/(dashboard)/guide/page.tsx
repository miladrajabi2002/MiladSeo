"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Languages,
  Lightbulb,
  ListChecks,
  Rocket,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";

type Lang = "fa" | "en";

function Section({
  icon,
  title,
  children,
  dir,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  dir: "rtl" | "ltr";
}) {
  return (
    <section dir={dir} className="rounded-2xl border border-border-base bg-bg-card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
          {icon}
        </span>
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
      </div>
      <div className="space-y-2.5 text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xs font-bold text-white">
        {n}
      </span>
      <p className="pt-0.5">{children}</p>
    </div>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent-green" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-text-primary">{children}</strong>;
}

// ---------------------------------------------------------------------------
// Persian guide
// ---------------------------------------------------------------------------
function GuideFa() {
  const dir = "rtl" as const;
  return (
    <div className="space-y-5">
      <Section dir={dir} icon={<BookOpen size={16} />} title="این داشبورد چیست؟">
        <p>
          یک ابزار خودمیزبان برای ردیابی رتبه‌ی کلمات کلیدی و تحلیل سئوی سایت‌هاست که روی
          <B> Google Search Console رایگان</B> سوار است. هر روز خودکار داده می‌گیرد، رتبه‌ها را
          ذخیره می‌کند، و با تب‌های تخصصی، چکر فنی، داده‌ی واقعی کاربران و یک
          <B> دستیار هوش مصنوعی</B> کمک می‌کند تصمیم بگیری چه کاری سئو را بهتر می‌کند.
        </p>
        <p>
          فلسفه‌ی آن ساده است: Search Console خام و محدود است؛ این داشبورد همان داده را به
          روند، هشدار، مقایسه و توصیه‌ی عملی تبدیل می‌کند.
        </p>
      </Section>

      <Section dir={dir} icon={<Settings size={16} />} title="۱) راه‌اندازی پروژه (نصب)">
        <p>اگر تازه می‌خواهی پروژه را بالا بیاوری:</p>
        <Step n={1}>
          فایل <code className="rounded bg-bg-secondary px-1">.env</code> را از روی
          <code className="rounded bg-bg-secondary px-1">.env.example</code> بساز و مقادیر لازم را پر کن:
          ایمیل/رمز ادمین، <code className="rounded bg-bg-secondary px-1">NEXTAUTH_SECRET</code> و
          اطلاعات OAuth گوگل (<code className="rounded bg-bg-secondary px-1">GOOGLE_CLIENT_ID/SECRET</code>).
        </Step>
        <Step n={2}>
          رمز ادمین را هش کن: <code className="rounded bg-bg-secondary px-1">make hash-password PASSWORD=…</code>
          و خروجی را در <code className="rounded bg-bg-secondary px-1">ADMIN_PASSWORD_HASH</code> بگذار.
        </Step>
        <Step n={3}>
          وابستگی‌ها و دیتابیس: <code className="rounded bg-bg-secondary px-1">make install</code> و سپس
          <code className="rounded bg-bg-secondary px-1">npx prisma migrate deploy</code> (یا در حالت توسعه
          <code className="rounded bg-bg-secondary px-1">migrate dev</code>). این مرحله ستون‌های دیتابیس مثل GA4 را می‌سازد.
        </Step>
        <Step n={4}>
          اجرا: <code className="rounded bg-bg-secondary px-1">make dev</code> برای لوکال، یا برای سرور
          راهنمای <B>docs/INSTALLATION.md</B> (PM2 + Nginx + SSL).
        </Step>
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-500">
          نکته: کلیدِ رایگان <B>PAGESPEED_API_KEY</B> (با Chrome UX Report API فعال) را در .env بگذار تا
          هم PageSpeed سهمیه‌ی اختصاصی بگیرد و هم تب «داده‌ی واقعی کاربران (CrUX)» کار کند.
        </p>
        <p>راه‌اندازی کامل گوگل: <B>docs/GOOGLE_SETUP.md</B></p>
      </Section>

      <Section dir={dir} icon={<Rocket size={16} />} title="۲) از کجا شروع کنم؟ (مسیر گام‌به‌گام)">
        <p>بعد از ورود، این مراحل را به ترتیب انجام بده:</p>
        <Step n={1}>
          در هدر روی <B>Connect Google</B> بزن و دسترسی‌های فقط‌خواندنی را تأیید کن (Search Console،
          Sheets، Drive و Analytics).
        </Step>
        <Step n={2}>
          روی <B>Add Project</B> بزن: نام، دامنه، property از Search Console (از منوی کشویی) و موقعیت
          مکانی را وارد کن.
        </Step>
        <Step n={3}>
          <B>Sync Now</B> را بزن و صبر کن. اولین sync ۳۰ روز داده را روزبه‌روز می‌گیرد (یکی‌دو دقیقه).
          برای تاریخچه‌ی بیشتر، از فلش کنار دکمه <B>Deep Sync</B> (۹۰/۱۸۰/۳۶۵ روز) را انتخاب کن.
        </Step>
        <Step n={4}>
          <B>Overview</B> را ببین تا تصویر کلی بگیری؛ بعد در <B>All Keywords</B> کلمات رتبه‌ی ۵–۲۰ را
          (بیشترین فرصت) پیدا کن و برایشان <B>گروه</B> بگذار.
        </Step>
        <Step n={5}>
          <B>Insights</B> → فرصت‌های CTR و Cannibalization؛ <B>Site Health</B> → ایندکس + سرعت + CrUX؛
          <B>On-Page</B> → چک صفحات مهم؛ <B>Analytics</B> → اتصال GA4.
        </Step>
        <Step n={6}>
          <B>AI Audit</B> → کلید Claude/OpenAI/OpenRouter را وصل کن و یک تحلیل کامل بگیر تا لیست کارِ
          اولویت‌بندی‌شده داشته باشی.
        </Step>
        <Step n={7}>
          هر تغییری دادی، در <B>Annotations</B> (تب Overview) با تاریخ ثبتش کن تا بعداً اثرش را روی
          نمودارها ببینی.
        </Step>
      </Section>

      <Section dir={dir} icon={<ListChecks size={16} />} title="۳) قابلیت‌ها و تب‌ها">
        <Bullets
          items={[
            <><B>Overview</B> — میانگین رتبه، Top 3/10/20، توزیع، امتیاز Visibility، مقایسه‌ی دوره‌ای و Annotations. با <B>انتخابگر بازه‌ی زمانی</B> (۷ روز تا ۱ سال + دلخواه).</>,
            <><B>All Keywords</B> — جدول کامل با جستجو، فیلتر (گروه/رتبه/حرکت)، مرتب‌سازی، نمودار روند، <B>حذف با Undo</B> و <B>AI Cluster</B> (خوشه‌بندی هوشمند کلمات).</>,
            <><B>Research</B> — تحقیق کلمه با Google Autocomplete (رایگان)، متناسب با کشور پروژه، با <B>افزودن سریع</B> (دکمه track) به لیست ردیابی.</>,
            <><B>Pages</B> — عملکرد هر URL: تعداد کلمات، بهترین/میانگین رتبه، کلیک و روند.</>,
            <><B>Insights</B> — نمودار کلیک/نمایش/CTR (با toggle متریک)، فرصت‌های CTR، <B>بازنویسی تایتل/متا با AI</B>، ویژگی‌های SERP و هم‌نوع‌خواری صفحات.</>,
            <><B>Analytics (GA4)</B> — session، کاربر، conversion، کانال‌ها و صفحات فرود واقعی.</>,
            <><B>Movers & Drops</B> — کلماتی که نسبت به دوره‌ی قبل صعود/افت کرده‌اند (با انتخاب بازه).</>,
            <><B>Competitors</B> 🆕 — افزودن دامنه‌ی رقیب و مقایسه‌ی پوزیشن SERP به‌صورت رودررو.</>,
            <><B>Mobile</B> — مقایسه‌ی رتبه‌ی موبایل و دسکتاپ با ستون GAP.</>,
            <><B>Site Health</B> — وضعیت ایندکس، PageSpeed و CrUX — همراه <B>نمودار روند تاریخی</B> هرکدام و <B>Inspect زنده‌ی URL</B>.</>,
            <><B>Sitemap</B> 🆕 — خواندن sitemap سایت و نمایش صفحات tracked/untracked.</>,
            <><B>On-Page</B> — چک تایتل/متا/H1/canonical/robots/Schema/ریدایرکت/sitemap و لینک‌های شکسته.</>,
            <><B>AI Audit</B> — ممیزی تخصصی کل سایت با امتیاز سلامت و توصیه‌های اولویت‌بندی‌شده.</>,
            <><B>Alerts</B> — هشدار خودکار برای هر جابجایی بیش از ۵ پله.</>,
            <><B>خروجی</B> — دکمه‌های <B>CSV</B>، <B>JSON</B> (export کامل) و <B>Report</B> (گزارش قابل چاپ / PDF) در هدر پروژه.</>,
          ]}
        />
      </Section>

      <Section dir={dir} icon={<Sparkles size={16} />} title="۴) دستیار هوش مصنوعی (AI)">
        <p>
          یک کلید از <B>Claude (Anthropic)</B>، <B>OpenAI</B> یا <B>OpenRouter</B> (برای DeepSeek، Llama،
          Gemini و…) بگیر. در تب AI Audit کلید را بگذار، <B>Load models</B> بزن و مدل را از لیست انتخاب کن.
          کلید فقط سمت سرور ذخیره می‌شود و دیگر نشان داده نمی‌شود.
        </p>
        <Bullets
          items={[
            <><B>تحلیل کلی (Master Audit):</B> همه‌ی گزارش‌ها (رتبه، ترافیک، CTR، CrUX، GA4، On-Page) را با هم تحلیل می‌کند و لیست کارِ اولویت‌بندی‌شده می‌دهد. دکمه‌ی میان‌بر <B>AI Audit</B> در هدر پروژه آن را مستقیم اجرا می‌کند.</>,
            <><B>AI Assist در تب‌ها:</B> در Overview، Insights، Site Health و On-Page یک پنل کمکی ظاهر می‌شود: «Analyze this tab» یا پرسش آزاد درباره‌ی دیتای همان تب.</>,
            <><B>AI Cluster (تب Keywords):</B> همه‌ی کلمات را بر اساس موضوع و نیّت جستجو خوشه‌بندی می‌کند.</>,
            <><B>بازنویسی تایتل/متا (تب Insights):</B> برای کلماتی که CTR ضعیف دارند، تایتل و متای جذاب‌تر پیشنهاد می‌دهد.</>,
          ]}
        />
        <p className="text-text-muted">هزینه را provider هوش مصنوعی حساب می‌کند؛ ممیزی‌ها کوتاه و ارزان‌اند.</p>
      </Section>

      <Section dir={dir} icon={<TrendingUp size={16} />} title="۵) بعد از تحلیل چه کار کنم؟">
        <Bullets
          items={[
            <>کلمه‌ی رتبه‌ی <B>۵ تا ۲۰</B> → محتوای آن صفحه را کامل‌تر کن و کلمه را در تایتل/H1 بیاور.</>,
            <><B>فرصت CTR</B> (نمایش زیاد، کلیک کم) → تایتل و متا دیسکریپشن را جذاب و دقیق بازنویسی کن.</>,
            <><B>Cannibalization</B> → دو صفحه را ادغام کن یا یکی را canonical کن.</>,
            <>کلمه‌ی <B>Dropped</B> → تغییرات اخیر، ایندکس و تازگی محتوای صفحه را بررسی کن.</>,
            <><B>CrUX قرمز</B> (LCP/INP/CLS) → تصاویر را بهینه کن، JS را کم کن، ابعاد تصویر را رزرو کن.</>,
            <><B>On-Page</B> ناقص → تایتل/متا را درست کن، یک H1 بگذار، Schema اضافه کن، لینک شکسته را رفع کن.</>,
            <><B>ایندکس غیر PASS</B> → robots/canonical را چک کن و درخواست ایندکس بده.</>,
          ]}
        />
        <p className="rounded-lg bg-accent-blue/10 px-3 py-2 text-accent-blue">
          قانون طلایی: بعد از هر تغییر یک Annotation با تاریخ امروز ثبت کن تا اثرش را بسنجی.
        </p>
      </Section>

      <Section dir={dir} icon={<Lightbulb size={16} />} title="۶) آموزش سئو (مرتبط با این داشبورد)">
        <p><B>رتبه (Position):</B> کمتر بهتر است؛ رتبه‌ی ۱ بالاترین نتیجه‌ی ارگانیک است. اعداد میانگین‌اند پس اعشار عادی است.</p>
        <p><B>کلیک، نمایش، CTR:</B> نمایش = چند بار سایتت دیده شده؛ کلیک = چند نفر زدند؛ CTR = نسبت این دو. CTR پایین در رتبه‌ی خوب یعنی تایتل/متا جذاب نیست.</p>
        <p><B>کلمات صفحه‌ی دوم (۱۱–۲۰):</B> بیشترین فرصت رشد را دارند؛ با کمی تقویت محتوا به صفحه‌ی اول می‌روند.</p>
        <p><B>On-Page پایه:</B> هر صفحه باید یک تایتل یکتا (۱۰–۶۵ کاراکتر)، متا دیسکریپشن (۵۰–۱۶۵)، دقیقاً یک H1، canonical درست و محتوای کافی (۳۰۰+ کلمه) داشته باشد.</p>
        <p><B>Core Web Vitals:</B> تجربه‌ی واقعی کاربر را گوگل در رتبه لحاظ می‌کند — LCP (سرعت بارگذاری)، INP (پاسخ‌دهی)، CLS (پایداری چیدمان).</p>
        <p><B>Schema (داده‌ی ساختاریافته):</B> به گوگل می‌گوید محتوا چیست و شانس نتایج غنی (rich result) را زیاد می‌کند.</p>
        <p><B>هم‌نوع‌خواری (Cannibalization):</B> وقتی دو صفحه سر یک کلمه رقابت می‌کنند، قدرت تقسیم می‌شود؛ یکی را اصلی کن.</p>
        <p><B>تأخیر داده‌ی GSC:</B> داده ۲–۳ روز عقب‌تر است؛ این عادی است و در همه‌ی ابزارهای مبتنی بر GSC وجود دارد.</p>
      </Section>

      <Section dir={dir} icon={<Wrench size={16} />} title="۷) رفع اشکال سریع">
        <Bullets
          items={[
            <>خطای «sufficient permission» → اکانت تو روی property باید Owner/Full باشد نه Restricted.</>,
            <>منوی property خالی → اول Google را وصل کن و سایت را در Search Console تأیید کن.</>,
            <>ستون ga4PropertyId وجود ندارد → <code className="rounded bg-bg-secondary px-1">npx prisma migrate deploy</code> را اجرا کن.</>,
            <>تب Analytics خالی → یک بار Google را قطع و دوباره وصل کن تا دسترسی Analytics داده شود.</>,
            <>CrUX داده ندارد → سایت جدید/کم‌ترافیک است یا کلید PageSpeed تنظیم نشده.</>,
            <>AI وصل نمی‌شود → کلید اشتباه/منقضی یا مدل روی اکانتت در دسترس نیست.</>,
          ]}
        />
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// English guide
// ---------------------------------------------------------------------------
function GuideEn() {
  const dir = "ltr" as const;
  return (
    <div className="space-y-5">
      <Section dir={dir} icon={<BookOpen size={16} />} title="What is this dashboard?">
        <p>
          A self-hosted keyword rank tracker and SEO analysis tool powered by the
          <B> free Google Search Console API</B>. It auto-syncs daily, stores rankings, and turns
          raw GSC data into trends, alerts, comparisons, technical checks, real-user field data and an
          <B> AI assistant</B> that tells you what to fix next.
        </p>
        <p>
          The idea is simple: Search Console is raw and limited; this dashboard turns the same data
          into trends, alerts and actionable advice.
        </p>
      </Section>

      <Section dir={dir} icon={<Settings size={16} />} title="1) Project setup (install)">
        <Step n={1}>
          Copy <code className="rounded bg-bg-secondary px-1">.env.example</code> to
          <code className="rounded bg-bg-secondary px-1">.env</code> and fill admin email/password,
          <code className="rounded bg-bg-secondary px-1">NEXTAUTH_SECRET</code> and Google OAuth
          (<code className="rounded bg-bg-secondary px-1">GOOGLE_CLIENT_ID/SECRET</code>).
        </Step>
        <Step n={2}>
          Hash the admin password: <code className="rounded bg-bg-secondary px-1">make hash-password PASSWORD=…</code>
          and paste it into <code className="rounded bg-bg-secondary px-1">ADMIN_PASSWORD_HASH</code>.
        </Step>
        <Step n={3}>
          Install + DB: <code className="rounded bg-bg-secondary px-1">make install</code> then
          <code className="rounded bg-bg-secondary px-1">npx prisma migrate deploy</code> (or
          <code className="rounded bg-bg-secondary px-1">migrate dev</code> in development). This creates
          DB columns such as GA4.
        </Step>
        <Step n={4}>
          Run: <code className="rounded bg-bg-secondary px-1">make dev</code> locally, or follow
          <B> docs/INSTALLATION.md</B> for production (PM2 + Nginx + SSL).
        </Step>
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-amber-500">
          Tip: set the free <B>PAGESPEED_API_KEY</B> (with the Chrome UX Report API enabled) in .env so
          PageSpeed gets a dedicated quota and the real-user CrUX panel works.
        </p>
        <p>Full Google setup: <B>docs/GOOGLE_SETUP.md</B></p>
      </Section>

      <Section dir={dir} icon={<Rocket size={16} />} title="2) Where do I start? (step by step)">
        <Step n={1}>Click <B>Connect Google</B> in the header and approve the read-only scopes.</Step>
        <Step n={2}>Click <B>Add Project</B>: name, domain, GSC property (from the dropdown), location.</Step>
        <Step n={3}>
          Click <B>Sync Now</B> and wait — the first sync pulls 30 days day-by-day. For more history,
          use the arrow beside the button for a <B>Deep Sync</B> (90/180/365 days).
        </Step>
        <Step n={4}>
          Review <B>Overview</B>, then in <B>All Keywords</B> find position 5–20 keywords (best
          opportunities) and assign <B>groups</B>.
        </Step>
        <Step n={5}>
          <B>Insights</B> → CTR opportunities + cannibalization; <B>Site Health</B> → index + speed +
          CrUX; <B>On-Page</B> → check key pages; <B>Analytics</B> → link GA4.
        </Step>
        <Step n={6}>
          <B>AI Audit</B> → connect a Claude/OpenAI/OpenRouter key and run a full audit for a
          prioritized to-do list.
        </Step>
        <Step n={7}>Log every change as a dated <B>Annotation</B> (Overview tab) to measure its effect.</Step>
      </Section>

      <Section dir={dir} icon={<ListChecks size={16} />} title="3) Features & tabs">
        <Bullets
          items={[
            <><B>Overview</B> — avg position, Top 3/10/20, distribution, Visibility score, period comparison, Annotations. With a <B>date-range selector</B> (7 days to 1 year + custom).</>,
            <><B>All Keywords</B> — full table with search, filters, sorting, trend chart, <B>delete with Undo</B>, adjustable <B>density</B>, and <B>AI Cluster</B> (smart topic grouping).</>,
            <><B>Research</B> — keyword research via Google Autocomplete (free), localized, with <B>one-click “track”</B> to add ideas to your list.</>,
            <><B>Pages</B> — per-URL performance: keyword count, best/avg position, clicks, trend.</>,
            <><B>Insights</B> — clicks/impressions/CTR chart (metric toggle), CTR opportunities, <B>AI title/meta rewrites</B>, SERP features, cannibalization.</>,
            <><B>Analytics (GA4)</B> — sessions, users, conversions, channels and top landing pages.</>,
            <><B>Movers & Drops</B> — keywords that rose/fell vs the previous period (range selectable).</>,
            <><B>Competitors</B> 🆕 — add rival domains and compare SERP positions head-to-head.</>,
            <><B>Mobile</B> — mobile vs desktop comparison with a GAP column.</>,
            <><B>Site Health</B> — index coverage, PageSpeed and CrUX — each with a <B>historical trend chart</B> plus <B>live URL inspect</B>.</>,
            <><B>Sitemap</B> 🆕 — parse the site's sitemap and show tracked vs untracked URLs.</>,
            <><B>On-Page</B> — title/meta/H1/canonical/robots/schema/redirects/sitemap and broken links.</>,
            <><B>AI Audit</B> — expert whole-site audit with health score and prioritized recommendations.</>,
            <><B>Alerts</B> — auto-alert for any move larger than 5 positions.</>,
            <><B>Exports</B> — <B>CSV</B>, full <B>JSON</B> export and a printable <B>Report</B> (Save as PDF) from the project header.</>,
          ]}
        />
      </Section>

      <Section dir={dir} icon={<Sparkles size={16} />} title="4) AI assistant">
        <p>
          Get a key from <B>Claude (Anthropic)</B>, <B>OpenAI</B> or <B>OpenRouter</B> (for DeepSeek,
          Llama, Gemini…). In the AI Audit tab paste the key, click <B>Load models</B> and pick one.
          The key is stored server-side only.
        </p>
        <Bullets
          items={[
            <><B>Master Audit:</B> analyzes all reports together (rankings, traffic, CTR, CrUX, GA4, on-page) into a prioritized to-do list. The <B>AI Audit</B> shortcut in the project header runs it directly.</>,
            <><B>AI Assist in tabs:</B> on Overview, Insights, Site Health and On-Page, an assist panel offers “Analyze this tab” or a free-text question about that tab's data.</>,
            <><B>AI Cluster (Keywords tab):</B> groups all keywords into topic clusters by search intent.</>,
            <><B>Title/meta rewrites (Insights tab):</B> suggests higher-CTR titles & descriptions for under-performing queries.</>,
          ]}
        />
      </Section>

      <Section dir={dir} icon={<TrendingUp size={16} />} title="5) What to do after analysis">
        <Bullets
          items={[
            <>Keyword at <B>position 5–20</B> → expand that page's content; put the keyword in title/H1.</>,
            <><B>CTR opportunity</B> (high impressions, low clicks) → rewrite the title & meta description.</>,
            <><B>Cannibalization</B> → merge the two pages or set one canonical.</>,
            <><B>Dropped</B> keyword → check recent changes, indexing and content freshness.</>,
            <><B>Poor CrUX</B> (LCP/INP/CLS) → optimize images, reduce JS, reserve image dimensions.</>,
            <>Weak <B>On-Page</B> → fix title/meta, single H1, add schema, fix broken links.</>,
            <>Index not PASS → check robots/canonical and request indexing.</>,
          ]}
        />
        <p className="rounded-lg bg-accent-blue/10 px-3 py-2 text-accent-blue">
          Golden rule: after any change add a dated Annotation so you can measure its effect.
        </p>
      </Section>

      <Section dir={dir} icon={<Lightbulb size={16} />} title="6) SEO basics (relevant here)">
        <p><B>Position:</B> lower is better; position 1 is the top organic result. Values are averages, so decimals are normal.</p>
        <p><B>Clicks, impressions, CTR:</B> impressions = how often you appeared; clicks = how many clicked; CTR = the ratio. A low CTR at a good position means the title/description isn't compelling.</p>
        <p><B>Page-2 keywords (11–20):</B> the highest-growth opportunity — a small content push moves them to page 1.</p>
        <p><B>On-page basics:</B> each page needs a unique title (10–65 chars), a meta description (50–165), exactly one H1, a correct canonical and enough content (300+ words).</p>
        <p><B>Core Web Vitals:</B> real user experience that Google factors into ranking — LCP (load), INP (responsiveness), CLS (layout stability).</p>
        <p><B>Schema (structured data):</B> tells Google what the content is and boosts rich-result chances.</p>
        <p><B>Cannibalization:</B> when two pages compete for one query, strength splits — pick one canonical page.</p>
        <p><B>GSC data delay:</B> data lags 2–3 days; this is normal for every GSC-based tool.</p>
      </Section>

      <Section dir={dir} icon={<Wrench size={16} />} title="7) Quick troubleshooting">
        <Bullets
          items={[
            <>“sufficient permission” error → your account must be Owner/Full on the property, not Restricted.</>,
            <>Empty property dropdown → connect Google first and verify the site in Search Console.</>,
            <>ga4PropertyId column missing → run <code className="rounded bg-bg-secondary px-1">npx prisma migrate deploy</code>.</>,
            <>Empty Analytics tab → disconnect and reconnect Google to grant the Analytics scope.</>,
            <>No CrUX data → site too new/low-traffic, or PAGESPEED_API_KEY not set.</>,
            <>AI won't connect → wrong/expired key or the model isn't available on your account.</>,
          ]}
        />
      </Section>
    </div>
  );
}

export default function GuidePage() {
  const [lang, setLang] = useState<Lang>("fa");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl"
    >
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={16} />
          {lang === "fa" ? "بازگشت به پروژه‌ها" : "Back to projects"}
        </Link>
        <button
          type="button"
          onClick={() => setLang((l) => (l === "fa" ? "en" : "fa"))}
          className="flex items-center gap-1.5 rounded-lg border border-border-base bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          <Languages size={14} />
          {lang === "fa" ? "English" : "فارسی"}
        </button>
      </div>

      <div className="mb-5 rounded-2xl bg-gradient-to-br from-accent-blue/15 to-violet-500/10 p-6 text-center">
        <h1 className="text-xl font-bold text-text-primary">
          {lang === "fa" ? "راهنما و آموزش کامل" : "Complete Guide & Tutorial"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {lang === "fa"
            ? "از نصب تا استفاده‌ی حرفه‌ای و آموزش سئو — هرچه برای شروع و ادامه لازم داری."
            : "From setup to professional use and SEO basics — everything you need to start and keep going."}
        </p>
      </div>

      {lang === "fa" ? <GuideFa /> : <GuideEn />}
    </motion.div>
  );
}
