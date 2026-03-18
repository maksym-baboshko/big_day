# Wheel of Fortune Frozen Spec

Status: frozen for implementation  
Date: 2026-03-18  
Scope: wheel gameplay, content contract, leaderboard, live feed, and the required database model.

## 1. Fixed Product Decisions

### Identity and player model

- One device creates one player profile.
- Editing the player name updates the existing profile instead of creating a new one.
- Clearing cookies or switching devices creates a brand new player.
- Players who have not finished onboarding must not appear in leaderboards.
- Duplicate visible names are allowed; the UI should disambiguate them with avatar and an auto suffix such as `Anna #2`.

### Session and round model

- A player can have one active round per game at the same time.
- Wheel must block a new spin while a wheel round is still open.
- Reloading the page must restore the same open wheel round.
- The challenge overlay cannot be dismissed without a resolution.
- There is no separate `abandoned` status for wheel rounds for now. Open rounds simply stay open until resolved.
- Wheel must have a long-lived `game_session` per player and per game, with many child rounds inside it.

### Core wheel behavior

- Wheel animation starts immediately on tap. It does not need to wait for the server before spinning visually.
- Category randomness is equal across all wheel categories.
- Task randomness is equal within the eligible task pool.
- Categories may repeat for the same player if the task is different.
- If the chosen category has no eligible tasks for the player, the server silently falls back to another category.
- `completed`, `promised`, and `skipped` are final decisions with no undo step.

### No-repeat and cycle behavior

- No-repeat is enforced per player and per game, not globally across players.
- `completed`, `promised`, and `skipped` all consume the assigned task for the current cycle.
- Wheel now has 9 categories and 180 tasks total.
- Each full cycle contains all 180 tasks.
- After a player completes all 180 tasks, the session starts a new cycle with repeats enabled.
- In every new cycle, the most recent 20 tasks from the previous play history are softly deprioritized and pushed to the back of the selection order.
- The “recent 20 to the back” rule applies in every future cycle, not only the second cycle.

### Timed task contract

- Timed tasks start only after an explicit player action.
- Timed tasks do not continue counting down while the page is closed.
- If the page closes during a timed task, the timer resumes later from approximately the same remaining time.
- Timed tasks auto-resolve when time hits zero on an open page.
- Auto-timeout is modeled as a special form of `skipped`, not a new top-level resolution value.
- Auto-timeout has a softer XP penalty than a manual skip.
- Skip is allowed at any point during a timed round.
- All timed tasks allow early completion.
- Timed tasks use multiple durations; they are not fixed to a single time value.

### Promise and deferred task contract

- `Promise` is allowed only for explicitly marked deferred tasks.
- Promise grants XP immediately.
- Promise is a final resolution for the round.
- Deferred tasks may target either the current evening or the following days, up to one week later.
- The CTA text can stay as `Обіцяю виконати` / `I promise`.

### Text input contract

- Text input tasks require a meaningful answer, not just any non-empty string.
- Minimum answer length is 10 characters.
- Maximum answer length is 300 characters.
- Submitted text answers are immutable.
- All text-input tasks must be designed as public-feed-safe by default.
- There is no profanity or content moderation layer for text-input answers in the first version.

## 2. Final Category Set

Note: the user did not provide a custom reordered 1-9 sequence, only “01..09”. The order below freezes the current wheel order after removing the old first category.

| Order | Slug | Display Name (uk) | Role |
| --- | --- | --- | --- |
| 01 | improvisation | Імпровізація | Short creative or social improvisation tasks. |
| 02 | truth-or-dare | Правда чи дія | Soft truth-or-dare prompts with friendly action energy. |
| 03 | kind-speech | Доброслів | Warm spoken or written good words for people in the room. |
| 04 | fact-check | Фактчек | Facts, guesses, and playful verification about the bride and groom. |
| 05 | joyful-dilemma | Весела дилема | Kind, funny, wedding-adjacent dilemmas. |
| 06 | similarity-test | Тест на схожість | “How would the groom react vs. how would the bride react?” comparisons. |
| 07 | challenge-accepted | Виклик прийнято! | Short live challenges inside the hall. |
| 08 | genius-or-not | Геніально чи ні | Advice, takes, and playful judgment calls. |
| 09 | in-their-style | В їх стилі | Imagine what the newlyweds would choose, say, or call “their style.” |

### Draft legend descriptions for approval

- `Імпровізація`: Швидкі творчі або соціальні експромти, де важлива щирість і легкий гумор.
- `Правда чи дія`: М’які питання й доброзичливі дії без крінжу та незручних тем.
- `Доброслів`: Короткі добрі слова вголос або в повідомленні для людей поруч.
- `Фактчек`: Здогадки, спостереження й маленькі перевірки того, що правда про молодят.
- `Весела дилема`: Кумедні вибори між двома симпатичними варіантами.
- `Тест на схожість`: Вгадай, хто з молодят як би відповів або вчинив у цій ситуації.
- `Виклик прийнято!`: Швидкі дії в залі, які додають руху, але не створюють хаосу.
- `Геніально чи ні`: Поради, гарячі погляди й іронічні оцінки, чи це блискуча ідея для шлюбу і життя.
- `В їх стилі`: Уяви, що обрали б молодята, що назвали б “у їх стилі”, а що точно ні.

## 3. Content Rules

### Tone

- Warm and phone-first.
- More humor than the previous content direction, but still balanced.
- Use direct imperative phrasing.
- Let some categories be more playful and bolder than others.
- Avoid cringe, forced sentimentality, and artificial “host energy”.

### Hard bans

- Alcohol.
- Kissing prompts.
- Shouting.
- Politics.
- Dancing.
- Explicit relationship or intimate questions.
- Appearance-based prompts.
- Conflict mining.

### Allowed but bounded

- Jokes about marriage.
- Jokes about everyday domestic life.
- Approaching other guests, including people the player does not know yet.
- Phone-based tasks: sending a message, taking a photo, taking a video.
- Soft physical contact: handshake, high-five, hug.
- Adult-friendly humor in moderation.
- Judgment or opinion tasks about the bride and groom are allowed, but they should stay playful rather than cruel.

### Hall safety boundaries

- Do not send people outside the hall.
- Do not require running.
- Do not require shouting.
- Do not involve children in tasks.

### Language and culture

- Do not use explicit Christian or prayer-like wording.
- Do not frame tasks as spiritual exercises.
- Mobile content should remain fully bilingual.
- Projector UI stays Ukrainian, while event cards may use the player’s language.

## 4. Task-Type Distribution

### Global content target for 180 tasks

- 72 `confirm`
- 72 `text_input`
- 18 `timer`
- 18 `deferred`

This preserves the requested 8 / 8 / 2 / 2 ratio as a global content target rather than a per-category requirement.

### Category-level constraints

Categories without `timer` tasks:

- `Доброслів`
- `Фактчек`
- `Весела дилема`
- `Тест на схожість`
- `Геніально чи ні`
- `В їх стилі`

Categories without `deferred` tasks:

- `Фактчек`
- `Весела дилема`
- `Тест на схожість`
- `Геніально чи ні`
- `В їх стилі`

Operational consequence:

- Extra timed and deferred capacity must be redistributed into:
  - `Імпровізація`
  - `Правда чи дія`
  - `Доброслів`
  - `Виклик прийнято!`

### Difficulty mix

- Keep a balanced `gentle / warm / bold` mix across the full content set.
- Not every single category must hit a mathematically perfect split.

## 5. Category Matrix

| Category | Core mechanic | Humor level | About the couple | Task type bias | Feed/public constraints | Example subtypes |
| --- | --- | --- | --- | --- | --- | --- |
| `Імпровізація` | Creative or social improvisation | Medium-high | Sometimes | confirm, text, timer, deferred | Public-safe by design | micro-scene, caption, instant invention, mini social prompt |
| `Правда чи дія` | Friendly honesty + light action | Medium | Sometimes | confirm, text, timer, deferred | No taboo honesty topics | soft truth, choose-and-do, quick confessional, playful dare |
| `Доброслів` | Spoken or written kindness | Medium-low | Not couple-only | confirm, text, deferred | Public and warm | compliment, blessing-like wish without religion, message, gratitude |
| `Фактчек` | Facts or guesses about newlyweds | Medium | Yes, always | confirm, text | Public-safe | who is more likely, what is true, guess the habit, verify with someone |
| `Весела дилема` | Two good options, playful choice | Medium-high | Mixed | confirm, text | Short and punchy | A or B, impossible choice, wedding dilemma, situational choice |
| `Тест на схожість` | Compare groom vs bride reactions | Medium-high | Yes, always | confirm, text | Public-safe | who would, how each would respond, similar/different calls |
| `Виклик прийнято!` | Live action in the room | High | Sometimes | confirm, text, timer, deferred | Hall-safe only | find someone, complete a micro mission, timed mini-action |
| `Геніально чи ні` | Advice and playful judgment | Medium-high | Mixed | confirm, text | Should stay witty, not mean | hot take, advice, genius-or-not verdict, “would this work?” |
| `В їх стилі` | Imagine the newlyweds’ taste or answer | High | Yes, always | confirm, text | Must explicitly signal “newlyweds” | what would they choose, what is in their style, how they would answer |

### Content generation flags

Every task in the source matrix should be tagged with:

- `feed_safe`
- `requires_other_guest`
- `phone_allowed`
- `public_speaking`
- `physical_contact_level`
- `couple_centric`

Most tasks should be one short prompt with no details block. Details are only for the minority of tasks that genuinely need extra setup.

## 6. Sample Review Set

These are sample prompts only. They are not the final 180-task pack.

### 01. Імпровізація

1. Назви фільм про це весілля так, ніби він щойно вийшов у прокат.
2. Придумай підпис до фото молодят, у якому трохи пафосу і трохи правди.
3. За 60 секунд знайди людину, яка допоможе тобі придумати нову “сімейну традицію” для наречених.
4. Напиши одним реченням, як би ти описав атмосферу цього вечора людині, яка тут не була.
5. Обіцяй до кінця вечора придумати для молодят найкумеднішу, але добру назву їхнього майбутнього сімейного чату.

### 02. Правда чи дія

1. Скажи чесно: що на цьому весіллі виглядає найзатишніше саме зараз?
2. За 90 секунд знайди гостя, чий стиль тобі сьогодні реально сподобався, і скажи це йому вголос.
3. Напиши коротко: яка риса найбільше рятує будь-який шлюб від побутового хаосу?
4. Скажи, що було б складніше: тиждень без кави чи тиждень без сарказму в шлюбі?
5. Обіцяй упродовж вечора знайти момент і сказати молодятам одну чесну, добру фразу без кліше.

### 03. Доброслів

1. Скажи комусь поруч короткий комплімент, який звучить не як “для галочки”.
2. Напиши одним реченням, за що сьогодні можна подякувати будь-кому в цій залі.
3. Знайди людину, яка сидить не за твоїм столом, і скажи їй щось добре та конкретне.
4. Напиши повідомлення комусь із гостей зі словами: “Радий, що ти сьогодні тут”.
5. Обіцяй упродовж тижня написати молодятам коротке, але дуже людяне побажання без штампів.

### 04. Фактчек

1. Як ти думаєш, хто з молодят частіше сказав би: “Давай ще трохи подумаємо”?
2. Напиши коротко: що, на твою думку, у молодят більш “спільне”, ніж здається з першого погляду?
3. Як ти думаєш, хто з них швидше згадає про список справ у суботу зранку?
4. Що більш у стилі молодят: спонтанний план чи гарно продуманий вечір?
5. Напиши свою здогадку: що в них сильніше працює разом — гумор чи організація?

### 05. Весела дилема

1. Що страшніше для сімейного життя: один дуже впертий плед чи п’ять дуже впертих декоративних подушок?
2. Обери: ідеально спланований вечір чи вечір, який раптом став легендою.
3. Напиши коротко, що геніальніше для дому: список на холодильнику чи фраза “я точно не забуду”.
4. Що смішніше у шлюбі: сперечатись про маршрут чи про температуру в кімнаті?
5. Обери один варіант для молодят: затишний хаос чи організований затишок.

### 06. Тест на схожість

1. Хто з молодят швидше сказав би: “Я вже все придумав” — і ще нічого не відкрив?
2. Напиши коротко: у якій дрібниці молодята, на твою думку, найбільш схожі?
3. Хто швидше запропонував би “давай ще одне фото, але вже нормальне”?
4. Як би, на твою думку, наречений і наречена по-різному реагували на раптову зміну плану?
5. У чому вони, на твою думку, найприємніше не схожі одне на одного?

### 07. Виклик прийнято!

1. За 150 секунд знайди двох гостей з різних столів і дізнайся, що їм сьогодні сподобалось найбільше.
2. Зроби одне добре фото вечора так, ніби його захочеться переслати ще трьом людям.
3. Напиши коротко, яку одну фразу ведучий точно не почує від тебе сьогодні.
4. За 150 секунд знайди гостя, який знайомий з молодятами найдовше, і дізнайся від нього один факт.
5. Обіцяй до кінця вечора познайомитися з людиною, з якою ти б сам не заговорив першим.

### 08. Геніально чи ні

1. Напиши свій вердикт: окремі ковдри в шлюбі — геніально чи ні?
2. Що мудріше для миру в домі: одразу говорити чи спершу з’їсти щось солодке?
3. Напиши коротку пораду, яка звучить трохи смішно, але насправді дуже практична.
4. Що геніальніше для сімейного життя: спільний календар чи спільне відчуття “та якось буде”?
5. Дай одну пораду гостям цього весілля, яку вони, можливо, не просили, але переживуть.

### 09. В їх стилі

1. Що, на твою думку, молодята назвали б “ідеальним спонтанним планом”?
2. Напиши коротко: як би молодята відповіли на питання “що для вас домашній затишок”?
3. Що більше в стилі молодят: тихий вечір удвох чи компанія, яка затрималась довше, ніж планувала?
4. Як ти думаєш, що молодята обрали б швидше: красиву ідею чи практичну геніальність?
5. Назви одну річ, про яку молодята могли б сказати: “Оце дуже в нашому стилі”.

## 7. Leaderboard Contract

### Core rules

- Support one global leaderboard across all games.
- Support one per-game leaderboard on the mobile page of each specific game.
- Sort only by total XP.
- Tie-breaker: the player who reached the XP total earlier ranks higher.
- Total XP cannot go below 0.
- Show only `display name + avatar + XP`.
- On mobile, include “my rank plus nearby players”.
- Do not show additional breakdown stats in the first version.
- Do not store periodic leaderboard snapshots.
- Do not freeze the leaderboard at the end of the event.
- Leaderboards are intentionally not scoped by `event_id`.

### Name and avatar history

- The live leaderboard always uses the current canonical player record.
- Feed and activity history use frozen name/avatar snapshots from the moment of the event.

## 8. Live Feed Contract

### Public feed event list

Only these events should appear in the public projector feed:

- `player.joined`
- `wheel.round.promised`
- `xp.awarded`

Negative events such as `skip`, `timed_out`, or XP penalties stay out of the public feed.

### Feed card rules

`player.joined`

- Show name, avatar, and welcome text.
- Keep a snapshot of the displayed name and avatar.

`xp.awarded`

- Show only player name and positive XP delta.
- Do not show the task text here.

`wheel.round.promised`

- Show the full task prompt.
- Show the full text-input answer if the task had one.
- Keep prompt snapshots in both `uk` and `en`.
- Keep the answer text snapshot immutable.

### Feed behavior

- Feed is global across all games.
- Feed is strictly chronological.
- Projector split-screen shows feed as the visually dominant column.
- Split-screen also shows a compact `Top 10` leaderboard.
- Show 5 recent events on the projector at once.
- Feed history is append-only and permanent for replay and analytics.
- Hero events fully replace the split-screen for 5 seconds.
- Hero event types:
  - `wheel.round.promised`
  - `leaderboard.new_first_place`

### Realtime transport

- Target realtime mechanism: WebSocket.
- Projector UI chrome stays Ukrainian.
- Event cards may render in the player’s own language.

## 9. Final Database Model

This section replaces the earlier draft assumptions. The database should support the frozen behavior above instead of the current transitional implementation.

### `player_profiles`

Keep:

- `id`
- `display_name`
- `display_name_normalized`
- `avatar_key`
- `locale`
- `onboarding_completed`
- timestamps

### `game_sessions`

Add a real session layer.

Recommended fields:

- `id uuid primary key`
- `player_id uuid not null references player_profiles(id)`
- `game_slug text not null references game_definitions(slug)`
- `status text not null default 'active'`
- `current_cycle integer not null default 1`
- `total_rounds integer not null default 0`
- `resolved_rounds integer not null default 0`
- `last_round_started_at timestamptz`
- `last_round_resolved_at timestamptz`
- `metadata jsonb not null default '{}'::jsonb`
- timestamps

Constraint:

- unique `(player_id, game_slug)`

Purpose:

- one long-lived player/game container that survives many rounds and cycles.

### `game_rounds`

Refine the shared round table so it can support paused timers and skip reasons.

Recommended fields:

- `id uuid primary key`
- `session_id uuid not null references game_sessions(id)`
- `player_id uuid not null references player_profiles(id)`
- `game_slug text not null references game_definitions(slug)`
- `status text not null`
- `started_at timestamptz not null`
- `resolved_at timestamptz`
- `resolution text`
- `resolution_reason text`
- `response_payload jsonb not null default '{}'::jsonb`
- `metadata jsonb not null default '{}'::jsonb`

Wheel timer fields:

- `timer_status text not null default 'none'`
- `timer_duration_seconds integer`
- `timer_remaining_seconds integer`
- `timer_last_started_at timestamptz`
- `timer_last_paused_at timestamptz`
- `timer_last_sync_at timestamptz`

Recommended status semantics:

- `open`
- `resolved`

Recommended resolution semantics:

- `completed`
- `promised`
- `skipped`

Recommended resolution reasons:

- `manual_skip`
- `timed_out`
- `not_applicable`

Reason:

- `timed_out` should stay a special flavor of skipped, not a separate top-level resolution.

### `xp_transactions`

Keep append-only.

Add or clarify:

- `event_snapshot jsonb not null default '{}'::jsonb`
- unique guard so one round cannot create the same XP outcome twice

Business rule:

- apply floor-at-zero logic when calculating totals

### `activity_events`

Keep append-only and never mutate historical rows.

Recommended payload split:

- `event_type`
- `visibility`
- `payload`
- `snapshot_name`
- `snapshot_avatar_key`
- `snapshot_prompt_i18n`
- `snapshot_answer_text`
- `snapshot_xp_delta`

Or store the same snapshot values inside one `payload` JSON document if that is easier to evolve.

Important rule:

- History must keep the original name/avatar/prompt/answer view from the moment of the event.

### `wheel_categories`

Now 9 active rows instead of 10.

Recommended columns:

- `slug`
- `sort_order`
- `weight`
- `title_i18n`
- `description_i18n`
- `is_active`

### `wheel_tasks`

Store only operational flags in DB. Policy still comes from code and content matrix.

Required columns:

- `category_id`
- `task_key`
- `interaction_type`
- `response_mode`
- `execution_mode`
- `allow_promise`
- `allow_early_completion`
- `difficulty`
- `prompt_i18n`
- `details_i18n`
- `timer_seconds`
- `base_xp`
- `promise_xp`
- `skip_penalty_xp`
- `timeout_penalty_xp`
- `feed_safe`
- `requires_other_guest`
- `phone_allowed`
- `public_speaking`
- `physical_contact_level`
- `metadata`

Key content decision:

- DB stores the task mechanics and operational flags.
- The generation matrix and allowed/forbidden patterns remain defined in code and documentation, not hidden inside database policy rules.

### `wheel_round_assignments`

Keep as the wheel-specific extension of a shared round.

Recommended extra fields:

- `cycle_number integer not null`
- `selection_rank integer`

### `wheel_player_task_history`

This table must change because tasks can return in later cycles.

Recommended fields:

- `session_id uuid not null references game_sessions(id)`
- `player_id uuid not null references player_profiles(id)`
- `task_id uuid not null references wheel_tasks(id)`
- `round_id uuid not null references game_rounds(id)`
- `cycle_number integer not null`
- `assigned_at timestamptz not null`

Constraint:

- unique `(session_id, task_id, cycle_number)`

Purpose:

- enforce no-repeat inside one cycle
- preserve full history across cycles
- support “last 20 tasks to the back” logic

### Derived views

Required views:

- `leaderboard_global_view`
- `leaderboard_game_view`
- `live_feed_view`

`leaderboard_global_view`

- total XP
- rank
- tie-break by earliest time reaching the current XP total

`leaderboard_game_view`

- same ranking logic, filtered by `game_slug`

`live_feed_view`

- only public events
- hero-event marker
- snapshot-safe payload for projector rendering

## 10. Implementation Consequences

The current transitional runtime is not the final design anymore. To align the app with this frozen spec, the next implementation slice must do the following:

1. Add `game_sessions` as a first-class table and route every round through it.
2. Rework wheel timer handling away from pure deadline logic into pause/resume timer state persisted on the round.
3. Replace the 10-category / 200-task assumptions with 9 categories / 180 tasks.
4. Rename category slugs and UI labels to the frozen category list.
5. Add `timeout_penalty_xp` and `resolution_reason` support.
6. Rebuild task history around cycle numbers.
7. Add leaderboard views for both global and per-game mobile ranking.
8. Add feed snapshots that preserve old names, avatars, prompts, and answers.
9. Build the projector around the three allowed feed event families and hero-event mode.

## 11. Next Content Step

The next content step is not full generation yet.

It should be:

1. Approve the 9 category descriptions.
2. Approve the category matrix.
3. Review these 45 sample prompts.
4. Then generate the final 180-task pack from the frozen matrix.
