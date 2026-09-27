# Module map — where each module lives and what it is for

36 modules, one job each. Where two modules sounded alike, the label now
says what each is for, and each links to the other. Routes do not change.

## Groups (sidebar, overview tiles and drawer, in this order)

| Group | Modules (slug → label) | The question it answers |
|---|---|---|
| 🏠 Start here | overview → Overview · news → News · alerts → Alerts & warnings · weather → Weather & rain | "What is happening in my district today?" |
| 🙋 You can help | responsibility → What you can do · citizen-corner → Helplines & your rights · file-rti → Ask the government (RTI) · rti → RTI replies tracker | "What can I do, and who do I call?" |
| 👥 Who runs it | leadership → Leaders & officers · elections → Elections · gram-panchayat → Village councils · courts → Courts · police → Police & safety | "Who is in charge, and are they doing their job?" |
| 💰 Money & projects | finance → Budget · infrastructure → Projects being built · tenders → Govt contracts (tenders) · industries → Local industries | "Where does the money go?" |
| 🤲 Help for you | schemes → Govt schemes · housing → Housing schemes · services → How to get certificates · offices → Govt offices near you · exams → Exams & jobs | "What can I get, and how do I apply?" |
| 🚰 Daily needs | jjm → Tap water (JJM) · water → Dams & rivers · power → Power cuts · transport → Buses & trains · health → Hospitals & health · schools → Schools | "Do I have water, power, a bus, a doctor, a school?" |
| 🌾 Farming | crops → Crop prices · farm → Farm & soil advice | "What will my crop fetch, and how do I grow it better?" |
| 📚 Know your district | population → People (census) · map → Map · famous-personalities → Famous people · contributors → Supporters | "What is my district like?" |
| 🔍 Check our work | data-sources → Where our data comes from · update-log → What changed and when | "Can I trust this?" |

## Pairs that used to be confusing

| Pair | Now |
|---|---|
| Offices & Services vs Services Guide | **Govt offices near you** (where and when it is open) vs **How to get certificates** (steps and documents). Each links to the other. |
| Water & Dams vs Water Supply (JJM) | **Dams & rivers** (storage, canals) vs **Tap water (JJM)** (home connections). |
| My Responsibility vs Citizen Corner | **What you can do** (actions, changing with the news) vs **Helplines & your rights** (numbers to call, rights). |
| Gov. Schemes vs Housing Schemes | Both are in *Help for you*. Housing links to Schemes for everything else. |
| Crop Prices vs Farm Advisory (same 🌾) | Crop prices 🌾, Farm & soil advice 🚜. |
| Elections vs Overview (same 📊) | Elections 🗳️. |
| Gov. Schemes vs Services Guide (same 📋) | Schemes 📋, certificates 🧾. |
| File RTI vs RTI Tracker | Both are in *You can help*, next to each other; each links to the other. |
| News vs Alerts | News = what the papers say. Alerts = official warnings to act on. |

Labels, descriptions and group names live in `moduleNames`,
`moduleDescriptions` and `moduleGroups` (en/kn/hi); `SIDEBAR_MODULES` in
`src/lib/constants/sidebar-modules.ts` holds the order and the group.
