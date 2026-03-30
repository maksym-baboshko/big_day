# Deep Technical Audit Prompt

Готовий repo-specific промпт для глибокого технічного аудиту `diandmax`.

Він заточений під `Pragmatic Elite` підхід: орієнтир на зрілі практики сильних frontend-команд без зайвого enterprise-overhead, який не окупиться для цього етапу проєкту.

## Як використовувати

1. Скопіюй промпт з блоку нижче.
2. Встав його у свого агента.
3. Дай агенту повний доступ до репозиторію та, за можливості, до веб-пошуку.
4. Попроси не зупинятися на загальних порадах, а дійти до decision-complete результату.

## Готовий промпт

```md
Ти виступаєш як Staff+ Frontend Engineer / Principal Engineer, якому доручили провести глибокий технічний аудит репозиторію `diandmax` і підготувати decision-complete план доведення проєкту до максимально зрілого, сильного, професійного рівня.

Відповідай повністю українською мовою.

Твоя задача: не просто знайти проблеми, а:
- глибоко дослідити репозиторій;
- порівняти його з практиками сильних frontend-команд і великих компаній;
- відокремити реально потрібні покращення від передчасного overengineering;
- сформувати чіткий `Audit + Roadmap + PR Plan`, який можна одразу перетворювати на backlog і implementation batches.

## Контекст проєкту

Це frontend-only rewrite wedding-проєкту `diandmax` у mock-first фазі.

Поточний scope:
- `/` і `/en` рендерять invitation homepage;
- `/invite/[slug]` рендерить typed personalized invites з mock guest fixtures;
- `/live` рендерить live projector з typed mock feed data;
- `/live?state=populated|empty|error` є canonical demo/local state switch;
- RSVP зараз відправляється у local mock service через `localStorage`;
- Storybook покриває reusable UI і design-system surfaces;
- Chromatic підключений через GitHub Actions.

Поточний стек:
- Next.js App Router;
- Next.js 16.2.1;
- React 19.2.4;
- TypeScript strict;
- Tailwind CSS v4 + CSS variables;
- `next-intl`;
- `motion/react`;
- `react-hook-form` + `zod`;
- custom reusable primitives + design-system direction;
- Vitest 4;
- Playwright;
- Storybook 10;
- Chromatic;
- Biome;
- GitHub Actions.

Архітектурний напрям:
- FSD-hybrid;
- dependency direction: `app → widgets → features → entities → shared`.

Поточні важливі seams, які не можна ламати:
- `GuestRepository`;
- `ActivityFeedSource`;
- `RsvpSubmissionService`.

Поточні жорсткі межі фази:
- без API routes;
- без database access;
- без Supabase;
- без auth;
- без email sending;
- без realtime transport;
- без production backend mutations;
- без повернення backend/runtime layer у цій фазі.

Будь-які рекомендації мають поважати ці межі. Якщо ти вважаєш, що щось із backend-напряму треба запланувати, винось це лише як future-phase note, а не як поточну вимогу.

## Поточний health snapshot

Нижче наведений стартовий snapshot стану repo на момент постановки задачі. Не довіряй йому сліпо: перевір фактичний стан самостійно і явно відміть, що підтвердилось, а що змінилось.

Стартовий snapshot:
- `pnpm typecheck` проходить;
- `pnpm lint` проходить;
- `pnpm test:coverage` проходить;
- є 72 unit tests;
- coverage: `80.76 statements / 73.61 branches / 68.62 functions / 83.56 lines`;
- є 28 Storybook stories;
- є 5 e2e specs;
- `TODO/FIXME` майже відсутні;
- suppressions майже відсутні;
- worktree чистий;
- немає `CODEOWNERS`;
- немає `CONTRIBUTING`;
- немає ADR / decision log;
- немає dependency automation типу Renovate / Dependabot;
- немає явного perf-budget tooling.

Є відомий environment caveat:
- sandbox-specific `EPERM` / port-binding / listen failures під час `pnpm build` або `pnpm test:storybook` не треба автоматично трактувати як product bug без додаткового підтвердження.

## Обов'язковий спосіб роботи

1. Спочатку глибоко досліди репозиторій.
2. Не видавай шаблонний “best practices” список без evidence.
3. Кожен висновок прив’язуй до реального evidence:
   - файли;
   - конфіги;
   - workflows;
   - test topology;
   - exports;
   - boundaries;
   - hotspots;
   - coverage gaps;
   - missing governance artifacts.
4. Якщо робиш зовнішні висновки про практики сильних команд, підкріплюй їх primary sources або офіційними джерелами.
5. Якщо щось не вдалося перевірити через sandbox / environment limitation, так і напиши.
6. Не рекомендуй “enterprise for enterprise’s sake”.
7. Для кожної рекомендації пояснюй:
   - чому це важливо;
   - який реальний ризик або upside;
   - чому це доречно або недоречно саме зараз для цього repo.

## Обов'язкові напрями аудиту

Проведи аудит мінімум по цих напрямах:

1. Архітектура і boundaries
- відповідність `app → widgets → features → entities → shared`;
- заборонені або ризиковані імпорти;
- правильність layer ownership;
- чи не тече domain logic у `shared`;
- чи не накопичується page-specific markup у public reusable surfaces;
- наскільки готова архітектура до подальшого росту без втрати ясності.

2. Структура кодової бази і модульна гігієна
- folder/module structure;
- naming consistency;
- export hygiene;
- public API surface;
- barrel usage;
- predictable entrypoints;
- readability and discoverability.

3. Компоненти і design system
- якість reusable UI primitives;
- consistency між canonical surfaces;
- чи не роздуваються компоненти;
- чи правильно обрані public vs local abstractions;
- чи немає premature extraction або навпаки missed extraction;
- чи вистачає design-system guardrails;
- чи є чіткі component API rules.

4. React / Next.js correctness
- client/server boundaries;
- hydration-sensitive areas;
- route/layout correctness;
- metadata / SEO / social sharing setup;
- i18n correctness;
- navigation patterns;
- runtime assumptions;
- mock-first correctness для цієї фази.

5. TypeScript / contracts / validation
- strictness discipline;
- domain contracts;
- zod/schema usage;
- runtime validation seams;
- typed mocks;
- ризики розсинхронізації між contracts і UI.

6. Testing strategy
- unit tests;
- story-driven tests;
- e2e;
- visual regression;
- coverage quality vs coverage numbers;
- missing test layers;
- deterministic testing;
- weakest unprotected flows;
- чи відповідає тестова стратегія App Router реаліям.

7. Accessibility and UX quality
- базова accessibility зрілість;
- Storybook/a11y readiness;
- semantic correctness;
- keyboard/focus behavior;
- reduced motion considerations;
- UX consistency.

8. CI/CD and quality gates
- workflow layering;
- branch protection readiness;
- required checks strategy;
- visual review workflow;
- release hygiene;
- reviewer ergonomics;
- failure isolation;
- opportunities for automation.

9. Performance and operational quality
- perf budget readiness;
- image/font/media discipline;
- page weight risks;
- unnecessary motion/paint complexity;
- lack of measurable budgets;
- practical monitoring opportunities.

10. Security / configuration / governance
- security headers;
- env handling;
- repository governance;
- ownership model;
- docs for contributors;
- missing process artifacts that реально підвищують якість.

11. Maintainability and scalability
- complexity hotspots;
- change cost;
- onboarding cost;
- long-term refactor risks;
- чи витримає repo наступний етап росту.

## Complexity hotspots, які треба перевірити окремо

Обов'язково окремо проаналізуй ці файли як potential complexity hotspots:
- `src/widgets/activity-feed/FeedEmptyState.tsx`
- `src/features/rsvp/components/RsvpFormSections.tsx`
- `src/widgets/splash/Splash.tsx`
- `src/widgets/navbar/HeaderFrame.tsx`

Подивись на:
- розмір;
- cognitive load;
- composition quality;
- testability;
- extraction opportunities;
- risk of regressions;
- readability for future maintainers.

## Benchmarking requirement

Зроби не лише локальний аудит repo, а й зовнішній benchmark.

Порівняй репозиторій з практиками сильних frontend-команд, використовуючи переважно офіційні або primary sources.

Мінімальний пул джерел, який треба врахувати:
- Next.js testing guidance:
  `https://nextjs.org/docs/app/guides/testing/vitest`
- Storybook visual testing:
  `https://storybook.js.org/docs/writing-tests/visual-testing`
- Storybook accessibility testing:
  `https://storybook.js.org/docs/writing-tests/accessibility-testing`
- GitHub CODEOWNERS docs:
  `https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners`
- web.dev performance budgets:
  `https://web.dev/articles/your-first-performance-budget`
- GitHub design-system accessibility annotations:
  `https://github.blog/engineering/user-experience/design-system-annotations-part-2-advanced-methods-of-annotating-components/`
- Airbnb JavaScript Style Guide:
  `https://github.com/airbnb/javascript`

За потреби додай ще релевантні primary sources, але не засмічуй аудит слабкими або другорядними статтями без необхідності.

## Важливий фільтр проти overengineering

У кожній категорії чітко розділяй:
- що вже добре й треба зберегти;
- що реально не вистачає до mature frontend repo;
- що сильні команди роблять і чому;
- що з цього доцільно саме нам зараз;
- що поки зарано.

Не рекомендуй наступне без дуже сильної причини:
- мікрофронтенди;
- передчасний монорепо-оверфреймворк;
- складну release machinery без реальної потреби;
- backend re-entry у цій фазі;
- важкі process layers, які створюють більше тертя, ніж цінності.

## Формат фінальної відповіді

Побудуй відповідь строго в цій структурі:

### 1. Executive Summary
- 5-10 головних висновків про стан проєкту.

### 2. Scorecard
- оцінка зрілості по ключових категоріях;
- бажано у форматі таблиці:
  `категорія / оцінка / коротке пояснення`.

### 3. Strengths to Preserve
- що вже зроблено сильно;
- що не можна зламати “покращеннями”.

### 4. Findings
Для кожного finding дай:
- `ID`;
- `Severity` (`Critical`, `High`, `Medium`, `Low`);
- `Category`;
- `Problem`;
- `Why it matters`;
- `Evidence`;
- `Recommendation`;
- `Priority now vs later`.

### 5. Benchmark vs Strong Teams
- що роблять сильні frontend-команди або великі компанії;
- чому вони це роблять;
- які практики релевантні саме цьому repo;
- які практики зараз були б передчасними.

### 6. Roadmap
Побудуй roadmap хвилями, наприклад:
- `Wave 1: Quick wins`;
- `Wave 2: Structural quality`;
- `Wave 3: Scaling and governance`.

Для кожної хвилі дай:
- ціль;
- expected outcome;
- dependencies;
- exit criteria.

### 7. PR Plan
Перетвори roadmap на конкретні PR/batch-и.

Для кожного batch/PR дай:
- `PR name`;
- `Goal`;
- `Scope`;
- `Main changes`;
- `Acceptance criteria`;
- `Verification`;
- `Dependencies`;
- `Risk level`;
- `Recommended order`.

`Roadmap` і `PR Plan` мають бути обидва.
`Roadmap` не замінює `PR Plan`.
`PR Plan` має бути implementation-ready.

### 8. Standards to Adopt
Сформулюй конкретні стандарти для цього repo:
- naming rules;
- component boundaries;
- extraction rules;
- test expectations;
- story rules;
- CI rules;
- docs rules;
- reviewer policy;
- definition of done.

### 9. What Not to Do Yet
- список речей, які виглядають “enterprise”, але зараз будуть передчасними;
- поясни чому саме.

### 10. Next Actions
- що робити одразу після аудиту;
- які 3-5 кроків мають дати найбільший quality uplift.

## Додаткові вимоги до якості відповіді

- Не обмежуйся коротким оглядом: це має бути справді глибокий аудит.
- Не ховай найважливіші висновки в кінці.
- Не пиши загальні слова без evidence.
- Не пиши “було б добре покращити тести” без конкретики: які саме, де саме, чому саме.
- Якщо помітиш, що repo вже має сильні рішення, прямо це визнай.
- Якщо якась проблема виглядає серйозно, але для цього масштабу не є top priority, чесно це напиши.
- Якщо бачиш можливість запропонувати guardrails, automation, docs artifacts або reviewer checklists, запропонуй їх.
- Якщо є конфлікт між “ідеально” і “доречно зараз”, обирай доречність і пояснюй компроміс.

Фінальна ціль: видати такий аудит, після якого команда матиме не просто перелік проблем, а чітку, розумну, пріоритезовану систему покращень для доведення цього проєкту до дуже сильного професійного рівня.
```
