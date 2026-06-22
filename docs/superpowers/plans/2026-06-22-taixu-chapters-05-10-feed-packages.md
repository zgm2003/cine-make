# Taixu Chapters 05-10 Feed Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce chapter-specific ChatGPT-ready Seedance all-reference feed packages for 太虚至尊 chapters 5 through 10.

**Architecture:** This is an artifact-generation pass, not a compiler change. Each chapter gets one isolated run directory under `runs/` containing only a `seedance-all-reference-feed.md` and a `README.md`, with the feed structure matching chapter 4 and the original-fidelity rules from the Cine Make skill.

**Tech Stack:** Markdown artifacts, PowerShell file inspection, `rg` / `Select-String` verification, Git commits per chapter.

---

## File Structure

- Create: `runs/taixu-ep05-fake-dragon-20260622-1100/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep05-fake-dragon-20260622-1100/README.md`
- Create: `runs/taixu-ep06-deadly-alignment-20260622-1110/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep06-deadly-alignment-20260622-1110/README.md`
- Create: `runs/taixu-ep07-fathers-relic-20260622-1120/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep07-fathers-relic-20260622-1120/README.md`
- Create: `runs/taixu-ep08-soul-master-20260622-1130/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep08-soul-master-20260622-1130/README.md`
- Create: `runs/taixu-ep09-nine-grade-fails-20260622-1140/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep09-nine-grade-fails-20260622-1140/README.md`
- Create: `runs/taixu-ep10-true-dragon-20260622-1150/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep10-true-dragon-20260622-1150/README.md`

The source scripts remain unchanged:

- `E:/太虚古蒂/taixuzhizun/剧本资产/第五章剧本.txt`
- `E:/太虚古蒂/taixuzhizun/剧本资产/第六章剧本.txt`
- `E:/太虚古蒂/taixuzhizun/剧本资产/第七章剧本.txt`
- `E:/太虚古蒂/taixuzhizun/剧本资产/第八章剧本.txt`
- `E:/太虚古蒂/taixuzhizun/剧本资产/第九章剧本.txt`
- `E:/太虚古蒂/taixuzhizun/剧本资产/第十章剧本`

### Task 1: Chapter 5 Feed Package

**Files:**
- Create: `runs/taixu-ep05-fake-dragon-20260622-1100/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep05-fake-dragon-20260622-1100/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第五章剧本.txt`

- [ ] **Step 1: Read chapter 5 and existing chapter 4 feed**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第五章剧本.txt' -Encoding UTF8
Get-Content -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep04-fatal-misunderstanding-20260622-0040\seedance-all-reference-feed.md' -Encoding UTF8 -TotalCount 220
```

Expected: chapter 5 title is `第5章 假龙天子`; chapter 4 feed shows the approved structure and Xiaoyunque tag library.

- [ ] **Step 2: Create the chapter 5 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep05-fake-dragon-20260622-1100'
```

Expected: directory exists and is empty before writing the two markdown files.

- [ ] **Step 3: Write chapter 5 feed**

Create `seedance-all-reference-feed.md` with these required sections in order:

```markdown
# Seedance 全能参考投喂包｜太虚至尊 第五章｜假龙天子

## 已生成参考资产上传清单
## GPT-image-2 参考图生成提示词（新增/追溯）
## 参考资产绑定
## 全局负面约束
## 原著守则和镜头语言规则
## 小云雀运镜标签库
## 第01段｜01-05｜无极灵根只存在神话｜约15秒
## 第02段｜06-10｜江凡密室获得两本功法｜约15秒
## 第03段｜11-15｜江凡开门被误认废物｜约15秒
## 第04段｜16-20｜许怡宁追问九品真相｜约15秒
## 第05段｜21-25｜安慰被误解为讽刺｜约15秒
## 第06段｜26-30｜塔主恭喜许正言｜约15秒
## 第07段｜31-35｜城主与老怪物示好｜约15秒
## 第08段｜36-40｜王映凤自夸押中真龙｜约15秒
## 第09段｜41-45｜许家飞黄腾达幻觉｜约15秒
## 第10段｜46-50｜陆争万众期待中出门｜约15秒
## 第11段｜51-55｜许正言不敢托大｜约15秒
## 第12段｜56-60｜陆争膨胀俯视全场｜约15秒
## 第13段｜61-65｜章末质问江凡不服｜约15秒
## 底部备注栏可复制
```

The feed must include exact source dialogue such as `无极灵根。`, `江凡？你不服？`, `陆争检测出九品灵根了。`, and `安心修炼，静待未来。`.

- [ ] **Step 4: Write chapter 5 README**

Create `README.md` with title, files list, original-fidelity notes for chapter 5, and a reminder that no images or videos were generated.

- [ ] **Step 5: Verify chapter 5 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep05-fake-dragon-20260622-1100' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep05-fake-dragon-20260622-1100\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '江凡？你不服？|陆争检测出九品灵根了。|安心修炼，静待未来。|不要字幕、不要配乐'
```

Expected: only `seedance-all-reference-feed.md` and `README.md`; all selected chapter 5 anchors appear.

- [ ] **Step 6: Commit chapter 5**

Run:

```powershell
git add runs/taixu-ep05-fake-dragon-20260622-1100
git commit -m "feat: add taixu chapter 5 feed package"
```

Expected: commit includes only the chapter 5 run directory.

### Task 2: Chapter 6 Feed Package

**Files:**
- Create: `runs/taixu-ep06-deadly-alignment-20260622-1110/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep06-deadly-alignment-20260622-1110/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第六章剧本.txt`

- [ ] **Step 1: Read chapter 6**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第六章剧本.txt' -Encoding UTF8
```

Expected: chapter title is `第6章 致命的站队`.

- [ ] **Step 2: Create the chapter 6 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep06-deadly-alignment-20260622-1110'
```

- [ ] **Step 3: Write chapter 6 feed**

Create the same required feed sections as chapter 5. Use segment beats: `你配？`, Lu Zheng asks to marry Xu Youran, Jiang Fan challenges Lu Zheng, three-day breakthrough wager, Qin Changsheng gifts ten bottles, Qin family bans Jiang Fan, Qin family misreads the ten-year-old soul master clue.

- [ ] **Step 4: Write chapter 6 README**

Create README with chapter title, files, original-fidelity notes, and no-image/no-video reminder.

- [ ] **Step 5: Verify chapter 6 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep06-deadly-alignment-20260622-1110' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep06-deadly-alignment-20260622-1110\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '你配？|我愿与陆争比一场！|禁止对江凡售卖练气液|翻不起大浪'
```

Expected: only two markdown files; all anchors appear.

- [ ] **Step 6: Commit chapter 6**

Run:

```powershell
git add runs/taixu-ep06-deadly-alignment-20260622-1110
git commit -m "feat: add taixu chapter 6 feed package"
```

### Task 3: Chapter 7 Feed Package

**Files:**
- Create: `runs/taixu-ep07-fathers-relic-20260622-1120/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep07-fathers-relic-20260622-1120/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第七章剧本.txt`

- [ ] **Step 1: Read chapter 7**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第七章剧本.txt' -Encoding UTF8
```

Expected: chapter title is `第7章 父亲遗物`.

- [ ] **Step 2: Create the chapter 7 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep07-fathers-relic-20260622-1120'
```

- [ ] **Step 3: Write chapter 7 feed**

Create the same required feed sections. Segment beats: Qingfeng True Scripture comprehension, overnight breakthrough to Qi Refining 2, cultivation liquid need, Wang Yingfeng destroys Xu Youran's resource, Xu Youran comforts and leaves for Yunwu Mountain, Jiang Fan worships his father, black wooden box is dug out and opened.

- [ ] **Step 4: Write chapter 7 README**

Create README with chapter title, files, original-fidelity notes, and no-image/no-video reminder.

- [ ] **Step 5: Verify chapter 7 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep07-fathers-relic-20260622-1120' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep07-fathers-relic-20260622-1120\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '练气二层|求你不要抢走|我自己会想办法|随着木匣被打开'
```

Expected: only two markdown files; all anchors appear.

- [ ] **Step 6: Commit chapter 7**

Run:

```powershell
git add runs/taixu-ep07-fathers-relic-20260622-1120
git commit -m "feat: add taixu chapter 7 feed package"
```

### Task 4: Chapter 8 Feed Package

**Files:**
- Create: `runs/taixu-ep08-soul-master-20260622-1130/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep08-soul-master-20260622-1130/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第八章剧本.txt`

- [ ] **Step 1: Read chapter 8**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第八章剧本.txt' -Encoding UTF8
```

Expected: chapter title is `第8章 魂师`.

- [ ] **Step 2: Create the chapter 8 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep08-soul-master-20260622-1130'
```

- [ ] **Step 3: Write chapter 8 feed**

Create the same required feed sections. Segment beats: middle-grade cultivation liquid, father's letter, soul master exposition, Taiyi Soul Art, Qi Refining 3 breakthrough, disguised visit to Treasure Pavilion, exchange for eleven material sets, request for tomorrow's exhibition meeting, Lu Zheng and Qin Changsheng encounter Jiang Fan outside.

- [ ] **Step 4: Write chapter 8 README**

Create README with chapter title, files, original-fidelity notes, and no-image/no-video reminder.

- [ ] **Step 5: Verify chapter 8 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep08-soul-master-20260622-1130' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep08-soul-master-20260622-1130\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '中品练气液|二星魂师|太乙魂术|阁下，难道是一位……魂师？'
```

Expected: only two markdown files; all anchors appear.

- [ ] **Step 6: Commit chapter 8**

Run:

```powershell
git add runs/taixu-ep08-soul-master-20260622-1130
git commit -m "feat: add taixu chapter 8 feed package"
```

### Task 5: Chapter 9 Feed Package

**Files:**
- Create: `runs/taixu-ep09-nine-grade-fails-20260622-1140/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep09-nine-grade-fails-20260622-1140/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第九章剧本.txt`

- [ ] **Step 1: Read chapter 9**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第九章剧本.txt' -Encoding UTF8
```

Expected: chapter title is `第9章 九品灵根不灵`.

- [ ] **Step 2: Create the chapter 9 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep09-nine-grade-fails-20260622-1140'
```

- [ ] **Step 3: Write chapter 9 feed**

Create the same required feed sections. Segment beats: Qin and Lu mock Jiang Fan, Chen Siling values the soul master, Xu Youran missing, Yunwu Mountain cliff threat, Jiang Fan rescue, Blood Bat Palace token, cave overnight refining, seven high-grade and one supreme-grade bottle, Jiang Fan reaches Qi Refining 4, Lu Zheng fails despite ten bottles.

- [ ] **Step 4: Write chapter 9 README**

Create README with chapter title, files, original-fidelity notes, and no-image/no-video reminder.

- [ ] **Step 5: Verify chapter 9 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep09-nine-grade-fails-20260622-1140' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep09-nine-grade-fails-20260622-1140\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '血蝠宫令牌|七瓶是上品练气液，一瓶是极品|练气四层|我都喝光了，怎幺还没突破？'
```

Expected: only two markdown files; all anchors appear.

- [ ] **Step 6: Commit chapter 9**

Run:

```powershell
git add runs/taixu-ep09-nine-grade-fails-20260622-1140
git commit -m "feat: add taixu chapter 9 feed package"
```

### Task 6: Chapter 10 Feed Package

**Files:**
- Create: `runs/taixu-ep10-true-dragon-20260622-1150/seedance-all-reference-feed.md`
- Create: `runs/taixu-ep10-true-dragon-20260622-1150/README.md`
- Source: `E:/太虚古蒂/taixuzhizun/剧本资产/第十章剧本`

- [ ] **Step 1: Read chapter 10**

Run:

```powershell
Get-Content -LiteralPath 'E:\太虚古蒂\taixuzhizun\剧本资产\第十章剧本' -Encoding UTF8
```

Expected: chapter title is `第10章 谁才是真龙`.

- [ ] **Step 2: Create the chapter 10 run directory**

Run:

```powershell
New-Item -ItemType Directory -Force -Path 'E:\太虚古蒂\cine-make\runs\taixu-ep10-true-dragon-20260622-1150'
```

- [ ] **Step 3: Write chapter 10 feed**

Create the same required feed sections. Segment beats: Jiang Fan and Xu Youran return at dawn, Xu Zhengyan's conflicted scolding, clan hall pressure, Wang Yingfeng restates stakes, Lu Zheng reveals only Qi Refining 5 peak, clan members rationalize, Jiang Fan mocks "就这？", Jiang Fan raises fist and spiritual energy shocks the hall.

- [ ] **Step 4: Write chapter 10 README**

Create README with chapter title, files, original-fidelity notes, and no-image/no-video reminder.

- [ ] **Step 5: Verify chapter 10 package**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep10-true-dragon-20260622-1150' -Force | Select-Object Name
Select-String -LiteralPath 'E:\太虚古蒂\cine-make\runs\taixu-ep10-true-dragon-20260622-1150\seedance-all-reference-feed.md' -Encoding UTF8 -Pattern '现在，以后，皆如此！|还行。|就这？|一缕精纯的灵气，震动了空气'
```

Expected: only two markdown files; all anchors appear.

- [ ] **Step 6: Commit chapter 10**

Run:

```powershell
git add runs/taixu-ep10-true-dragon-20260622-1150
git commit -m "feat: add taixu chapter 10 feed package"
```

### Task 7: Final Cross-Chapter Audit

**Files:**
- Inspect: all six chapter run directories

- [ ] **Step 1: Verify exact file counts**

Run:

```powershell
$dirs = @(
  'taixu-ep05-fake-dragon-20260622-1100',
  'taixu-ep06-deadly-alignment-20260622-1110',
  'taixu-ep07-fathers-relic-20260622-1120',
  'taixu-ep08-soul-master-20260622-1130',
  'taixu-ep09-nine-grade-fails-20260622-1140',
  'taixu-ep10-true-dragon-20260622-1150'
)
foreach ($dir in $dirs) {
  $files = Get-ChildItem -LiteralPath "E:\太虚古蒂\cine-make\runs\$dir" -File
  "$dir => $($files.Count) files: $($files.Name -join ', ')"
}
```

Expected: every directory reports exactly two files: `seedance-all-reference-feed.md, README.md`.

- [ ] **Step 2: Verify no forbidden artifacts**

Run:

```powershell
Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs' -Recurse -Force |
  Where-Object { $_.FullName -match 'taixu-ep0[5-9]|taixu-ep10' -and $_.Name -match 'canvas|manifest|projects|prompt-pack|storyboard|xlsx|deliverable|mp4|png|jpg' } |
  Select-Object FullName
```

Expected: no output.

- [ ] **Step 3: Verify common required feed sections**

Run:

```powershell
$feeds = Get-ChildItem -LiteralPath 'E:\太虚古蒂\cine-make\runs' -Recurse -Filter 'seedance-all-reference-feed.md' |
  Where-Object { $_.FullName -match 'taixu-ep0[5-9]|taixu-ep10' }
foreach ($feed in $feeds) {
  $content = Get-Content -LiteralPath $feed.FullName -Encoding UTF8 -Raw
  $required = @('已生成参考资产上传清单','GPT-image-2 参考图生成提示词','参考资产绑定','小云雀运镜标签库','底部备注栏可复制')
  foreach ($item in $required) {
    if ($content -notmatch [regex]::Escape($item)) { "MISSING $item in $($feed.FullName)" }
  }
}
```

Expected: no `MISSING` lines.

- [ ] **Step 4: Commit final audit note if verification fixes were needed**

If no fixes were needed, do not create a commit. If a feed had to be corrected during audit, commit only the corrected feed files with:

```powershell
git add runs/taixu-ep05-fake-dragon-20260622-1100 runs/taixu-ep06-deadly-alignment-20260622-1110 runs/taixu-ep07-fathers-relic-20260622-1120 runs/taixu-ep08-soul-master-20260622-1130 runs/taixu-ep09-nine-grade-fails-20260622-1140 runs/taixu-ep10-true-dragon-20260622-1150
git commit -m "fix: polish taixu chapter feed packages"
```
