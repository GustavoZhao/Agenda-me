# Speechaholic — Toastmasters Agenda Builder

Speechaholic is a web-based agenda builder for Toastmasters clubs. It helps meeting organizers prepare sessions, roles, timing, club information, and a polished agenda that can be printed, shared, or exported as a mobile-friendly PNG.

Speechaholic 是一款面向 Toastmasters 俱乐部的在线会议议程制作工具，可用于安排会议环节、角色与时间，管理俱乐部资料，并生成适合打印、分享或导出为手机长图的正式 Agenda。

## Try it online / 在线试用

You do not need to deploy the project yourself. Visit [speechaholic.online](https://speechaholic.online) to try the live version.

如果不想自行部署，可直接访问已上线的 [speechaholic.online](https://speechaholic.online) 试用。

## Features / 主要功能

- **Agenda templates / 议程模板** — Standard 3-Speech Meeting, BRICS+ Book Club, and Speechathon templates can generate a complete session structure automatically.
- **Smart Import / 智能导入** — Paste a meeting role announcement to extract dates, times, themes, and meeting roles. The meeting SAA remains separate from the club officer SAA.
- **Automatic timing / 自动计时** — Start times and green, yellow, and red timing thresholds are calculated from each session's duration.
- **Flexible meeting information / 灵活的会议信息** — Configure online meetings using Zoom, Microsoft Teams, Tencent Meeting, or another platform, including meeting ID and passcode; in-person meetings can include an address.
- **Club profiles / 俱乐部资料** — Signed-in users can save club identity, meeting details, officers, mentors, sponsors, advisors, membership information, and contact details.
- **Roster management / 会员名册** — Import an official Toastmasters roster CSV or add members manually. Supported fields include Customer ID, Name, Credentials, Email, Status, Current Position, and Pathways Enrolled.
- **Save and share / 保存与分享** — Registered users can save agendas and share permanent agenda links.
- **Print and export / 打印与导出** — Print a finished agenda or export it as a long PNG optimized for mobile reading.
- **Responsive interface / 响应式界面** — Supports desktop and mobile layouts, as well as light and dark themes.
- **Local fonts / 本地字体** — Uses Geist and Montserrat for English content, with Alibaba PuHuiTi available for Chinese text.

## Basic usage / 基本使用方法

### English

1. Open the editor and choose a meeting template, or build the session list manually.
2. Enter the meeting title, date, start time, meeting SAA, meeting format, and access details.
3. Use Smart Import if you already have a role announcement, then review the extracted information before applying it.
4. Add presenters, speech titles, evaluators, role-takers, durations, and timing settings.
5. Switch to **Preview** to review the final agenda.
6. Use **Print** for a printable version or **Export** to download a mobile-friendly PNG.
7. You can use the editor without signing in. Create an account to save club information, maintain rosters, save agendas, and share permanent links.

### 中文

1. 打开编辑器，选择会议模板，或手动建立会议环节。
2. 填写会议标题、日期、开始时间、Meeting SAA、会议形式及参会信息。
3. 如果已有角色招募或报名文本，可使用“智能导入”，检查识别结果后再应用。
4. 填写演讲者、演讲题目、点评人、会议角色、环节时长及计时设置。
5. 切换到 **Preview** 检查最终版 Agenda。
6. 使用 **Print** 打印，或使用 **Export** 下载适合手机阅读的 PNG 长图。
7. 未登录时也可以使用编辑器；注册账户后可以保存俱乐部资料、管理会员名册、保存 Agenda，并生成长期有效的分享链接。

## Technology / 技术栈

- Next.js 16 and React 19
- TypeScript and Tailwind CSS
- NextAuth
- Prisma ORM
- PostgreSQL (Neon is recommended for production)
- Vitest

## Local development / 本地开发

### Requirements / 环境要求

- Node.js 20.9 or later
- pnpm
- PostgreSQL 16 (for a fully offline local database)

Install the project dependencies:

安装项目依赖：

```bash
pnpm install
```

### Fully offline setup on macOS / macOS 完全离线配置

The local environment uses its own PostgreSQL database and does not need access to the production Neon database.

本地环境使用独立的 PostgreSQL 数据库，无需连接生产环境中的 Neon 数据库。

1. Install and start PostgreSQL 16:

   安装并启动 PostgreSQL 16：

   ```bash
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. Create the local database role and database:

   创建本地数据库账户和数据库：

   ```bash
   "$(brew --prefix postgresql@16)/bin/createuser" agenda_local
   "$(brew --prefix postgresql@16)/bin/psql" postgres -c "ALTER ROLE agenda_local WITH PASSWORD 'agenda_local_password'"
   "$(brew --prefix postgresql@16)/bin/createdb" --owner=agenda_local agenda_local
   ```

3. Create the local environment file:

   创建本地环境变量文件：

   ```bash
   cp .env.local.example .env.local
   ```

4. Initialize the database and create the local administrator:

   初始化数据库并创建本地管理员：

   ```bash
   pnpm local:setup
   ```

5. Start the local app:

   启动本地项目：

   ```bash
   pnpm dev:local
   ```

Open [http://localhost:3000](http://localhost:3000). The default local administrator details are defined in `.env.local`; change them before running `pnpm local:setup` if desired.

访问 [http://localhost:3000](http://localhost:3000)。本地管理员账户信息由 `.env.local` 定义；如需修改，请在运行 `pnpm local:setup` 前完成。

> The local seed script accepts only `localhost`, `127.0.0.1`, or `::1` database addresses. It will refuse to create the local administrator in a remote production database.
>
> 本地初始化脚本只接受 `localhost`、`127.0.0.1` 或 `::1` 数据库地址，因此不会误将本地管理员创建到远程生产数据库中。

## Environment variables / 环境变量

Create `.env.local` for local development. Configure the same production variables in your hosting provider instead of committing them to Git.

本地开发请创建 `.env.local`；生产环境应在托管平台中配置相同变量，切勿将密钥提交到 Git。

| Variable | Required | Purpose / 用途 |
| --- | --- | --- |
| `DATABASE_URL` | Yes / 是 | PostgreSQL connection URL / PostgreSQL 连接地址 |
| `NEXTAUTH_URL` | Yes / 是 | Full application URL, such as `http://localhost:3000` / 应用完整网址 |
| `NEXTAUTH_SECRET` | Yes / 是 | Secret used to sign authentication data / 身份验证签名密钥 |
| `GOOGLE_CLIENT_ID` | Optional / 可选 | Enables Google sign-in / 启用 Google 登录 |
| `GOOGLE_CLIENT_SECRET` | Optional / 可选 | Google OAuth secret / Google OAuth 密钥 |
| `GITHUB_ID` | Optional / 可选 | Enables GitHub sign-in / 启用 GitHub 登录 |
| `GITHUB_SECRET` | Optional / 可选 | GitHub OAuth secret / GitHub OAuth 密钥 |
| `LOCAL_ADMIN_EMAIL` | Local only / 仅本地 | Offline administrator email / 离线管理员邮箱 |
| `LOCAL_ADMIN_PASSWORD` | Local only / 仅本地 | Offline administrator password / 离线管理员密码 |
| `LOCAL_ADMIN_NAME` | Local only / 仅本地 | Offline administrator display name / 离线管理员昵称 |

Generate a strong authentication secret with:

可使用以下命令生成安全的认证密钥：

```bash
openssl rand -base64 32
```

Email-and-password registration is built in. A credentials password must contain at least six characters, including both letters and numbers. Google and GitHub buttons appear automatically when their OAuth variables are configured.

项目内置邮箱和密码注册。密码至少需要六个字符，并同时包含字母和数字。配置对应 OAuth 环境变量后，Google 和 GitHub 登录按钮会自动显示。

## Self-deployment with Vercel and Neon / 使用 Vercel 与 Neon 自行部署

### 1. Create a PostgreSQL database / 创建 PostgreSQL 数据库

Create a project on [Neon](https://neon.tech), then copy its PostgreSQL connection string. A different PostgreSQL provider can also be used.

在 [Neon](https://neon.tech) 创建项目并复制 PostgreSQL 连接字符串，也可以使用其他 PostgreSQL 服务。

### 2. Import the repository into Vercel / 将代码导入 Vercel

Push or fork this repository to your own Git provider, create a new project on [Vercel](https://vercel.com), and import the repository. Vercel should detect Next.js automatically.

将项目推送或 Fork 到自己的 Git 仓库，然后在 [Vercel](https://vercel.com) 创建项目并导入。Vercel 会自动识别 Next.js。

### 3. Configure production variables / 配置生产环境变量

Add these variables in **Vercel → Project Settings → Environment Variables**:

在 **Vercel → Project Settings → Environment Variables** 中添加：

```text
DATABASE_URL=your-postgresql-connection-url
NEXTAUTH_URL=https://your-domain.example
NEXTAUTH_SECRET=your-random-secret
```

Add Google or GitHub OAuth variables only if those sign-in methods are needed. When configuring an OAuth application, use these callback URLs:

仅在需要 Google 或 GitHub 登录时添加对应变量。配置 OAuth 应用时使用以下回调地址：

```text
https://your-domain.example/api/auth/callback/google
https://your-domain.example/api/auth/callback/github
```

### 4. Initialize the production schema / 初始化生产数据库结构

From a trusted local terminal, run the schema synchronization once using the production database URL:

在可信的本地终端中，使用生产数据库地址执行一次结构同步：

```bash
DATABASE_URL='your-postgresql-connection-url' pnpm prisma:push
```

For a production workflow with versioned database changes, use Prisma migrations instead:

如需在生产环境中使用可追踪版本的数据库变更，请改用 Prisma migration：

```bash
pnpm prisma:migrate
```

### 5. Deploy and add a domain / 部署并绑定域名

Deploy the project from Vercel. If you add a custom domain later, update `NEXTAUTH_URL` to the final HTTPS address and update the OAuth callback URLs accordingly, then redeploy.

在 Vercel 中部署项目。之后如绑定自定义域名，请将 `NEXTAUTH_URL` 更新为最终 HTTPS 地址，同时更新 OAuth 回调地址并重新部署。

## Useful commands / 常用命令

| Command | Description / 说明 |
| --- | --- |
| `pnpm dev` | Start the standard development server / 启动常规开发服务器 |
| `pnpm dev:local` | Start with the offline local environment / 使用离线本地环境启动 |
| `pnpm build` | Generate Prisma Client and create a production build / 生成 Prisma Client 并构建生产版本 |
| `pnpm start` | Start the production build / 启动生产版本 |
| `pnpm typecheck` | Run TypeScript checks / 执行 TypeScript 检查 |
| `pnpm lint` | Run ESLint / 执行 ESLint |
| `pnpm test` | Run automated tests once / 执行一次自动化测试 |
| `pnpm test:watch` | Run tests in watch mode / 以监听模式运行测试 |
| `pnpm prisma:generate` | Generate Prisma Client / 生成 Prisma Client |
| `pnpm prisma:push` | Synchronize the schema without a migration / 直接同步数据库结构 |
| `pnpm prisma:migrate` | Create a development migration / 创建开发数据库迁移 |
| `pnpm local:setup` | Prepare and seed the offline local database / 初始化离线本地数据库 |

## Security notes / 安全提示

- Never commit `.env`, `.env.local`, database credentials, OAuth secrets, or production administrator credentials.
- Keep local and production databases separate.
- Use a unique, strong `NEXTAUTH_SECRET` in production.
- Review imported roster data before sharing an agenda publicly.

- 不要将 `.env`、`.env.local`、数据库凭据、OAuth 密钥或生产管理员信息提交到 Git。
- 本地数据库与生产数据库应保持分离。
- 生产环境必须使用独立且足够安全的 `NEXTAUTH_SECRET`。
- 公开分享 Agenda 前，请检查其中是否包含不应公开的会员资料。
