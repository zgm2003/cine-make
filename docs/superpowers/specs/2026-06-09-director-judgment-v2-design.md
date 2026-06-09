# cine-make 草稿模式导演判断二次优化设计

## 背景

上一版已经把草稿交付拆成 `SCRIPT_BEATS`、`DIRECTOR_DECISION`、`ENVIRONMENT_BIBLES`、`ANCHOR_POLICY`、`Storyboard Version A / B`、`QUALITY_CHECK`、`AI_RISK_WARNINGS` 等层。方向正确，但内容仍偏模板化：Beat 还是一镜一个 Beat，Director Decision 只会泛泛说“可合并”，Director Cut 更像删镜头，AI 风险检查也没有抓住明显的镜头/文字/锚点冲突。

本次不继续增加大栏目，而是让现有层真正承担导演判断。

## 目标

1. `SCRIPT_BEATS` 改成真实叙事节拍，而不是 `Bxx -> Sxx` 的逐镜标注。
2. `DIRECTOR_DECISION` 输出 `keep / merge / delete / rewrite`，并给出具体理由、问题、合并目标或重写建议。
3. `Storyboard Version B: Director Cut` 不只是删镜头，而是允许重写节奏，保留重要冲突信息。
4. `ANCHOR_POLICY` 按镜头功能推导 primary/secondary anchors，避免用角色关键词硬套。
5. `AI_RISK_WARNINGS` 识别真实高风险：macro 承担复杂表演、wide 承担文字阅读、medium close-up 承担多人空间棋盘、visual priority 错配、台词过长等。
6. `KEYFRAME_PROMPTS` 进一步局部化：只写本镜必须出现的信息，不重复整段全局风格。
7. 新增小栏目 `TEXT_READABILITY_POLICY` 与 `DIALOGUE_POLICY`，作为草稿质检规则；它们服务现有输出，不扩成新的生产阶段。
8. `QUALITY_CHECK` 输出 `pass / warning / fail`，并列出具体 issues。

## 非目标

- 不改 Canvas foundation 包的左到右、人物/场景/风格基础节点策略。
- 不在 `visual` 出图模式输出大段导演判断层，避免交付膨胀。
- 不引入 LLM 调用或外部服务；先用确定性启发式提升可用性。
- 不重构整个 draft 生成器；本轮主要增强 `deliverable-writer` 和 Canvas storyboard metadata/prompt。

## 输出结构变化

草稿模式中保留已有栏目，并新增两个规则块：

```text
SCRIPT_BEATS
DIRECTOR_DECISION
TEXT_READABILITY_POLICY
DIALOGUE_POLICY
DIRECTOR_BIBLE
CHARACTER_BIBLE
SCENE_BIBLE
ENVIRONMENT_BIBLES
ART_DIRECTION
ANCHOR_POLICY
STORYBOARD：Shot Definition
Storyboard Version A: Full Coverage
Storyboard Version B: Director Cut
KEYFRAME_PROMPTS
MOTION_PROMPTS
QUALITY_CHECK
AI_RISK_WARNINGS
```

`visual` 模式仍保留精简出图交付，不输出这些分析层。

## 叙事节拍设计

新增内部 Beat 模型：

```js
{
  beat_id: 'B02',
  story_function: '异常出现',
  script_source: '林默惊醒，发现满手鲜血',
  audience_question: '血是谁的？',
  required_visual_info: ['林默惊醒', '满手鲜血'],
  emotional_pressure: 'high',
  shot_ids: ['S02'],
  recommended_shots: [
    'S02A medium close-up：林默惊醒',
    'S02B insert：血手'
  ],
  can_merge_with: ['B03']
}
```

Beat 由剧情功能聚合镜头，不再固定一镜一个 Beat。孤岛失忆/心理惊悚类剧本优先识别：

- 暴雨/孤岛/封闭空间建立
- 惊醒与血手异常
- 10 分钟记忆规则
- 嫌疑人结构
- 雷队施压 / 被杀信息
- 安娜安抚 / 失忆症线索
- 精神病院闪回
- 林默身份/查案线索
- 阿杰“凯撒”误导
- 倒计时归零 / 重置钩子

通用故事仍按开场、异常、规则揭示、关系建立、冲突、误导、真相靠近、反转/钩子聚合。

## 导演决策设计

每个镜头必须输出：

```yaml
shot_id: S07
linked_beat: B06
shot_purpose: 安娜建立“温柔但可疑”的角色功能
new_information: 安娜主动靠近林默，并通过热水杯形成控制感
problem: 这一镜和 S05 的人物介绍功能重复
decision: merge
merge_into: S05 or S10
reason: S05 已经能交代安娜位置，S10 有安娜台词和行为动机，S07 单独保留价值不足
rewrite_note: 将热水杯作为安抚/控制边界，合并到安娜台词镜头
```

`decision` 只允许：

- `keep`：独立保留
- `merge`：合并到相邻或同 Beat 镜头
- `delete`：删除不损失信息
- `rewrite`：镜头功能重要但镜头类型/构图不适合，需要重写

## Director Cut 设计

Director Cut 使用 Beat 和 Decision 重新组织，而不是从 A 版机械删镜头。孤岛碎忆第一集的理想节奏约 12 镜：

```text
S01 暴雨客厅，闪电照出封闭空间
S02 林默惊醒，血手入画
S03 手机倒计时 + 内心独白压缩
S04 手臂刻字特写，可读
S05 拉开，三人位置建立
S06 雷队堵门质问：刚刚有人死了
S07 安娜递水安抚，但不让观众完全信任她
S08 阿杰角落特写，畏缩中有诡异眼神
S09 闪回：警徽、解剖刀、精神病院
S10 林默说：我是来查案的
S11 阿杰抛出凯撒
S12 手机归零，林默重置
```

当原镜头存在问题时，Director Cut 行可以带 `rewrite_from`：

```yaml
director_cut_shot: DC04
rewrite_from: S04
function: 10分钟记忆规则揭示
shot_design: tight insert / 85mm close-up，手臂文字占画面 60%+
```

## 锚点策略设计

per-shot anchor 先看镜头功能，再看角色/道具关键词。优先级：

1. 关键文字/屏幕类信息
2. 镜头叙事功能
3. 人物关系变化
4. 关键道具
5. 角色局部表演

示例：

```yaml
S05:
  primary_anchor: 四人空间棋盘
  secondary_anchors: [雷队堵门, 阿杰背光角落]

S07:
  primary_anchor: 热水杯作为“安抚/控制”的边界
  secondary_anchors: [安娜手部动作, 林默警惕眼神]

S13:
  primary_anchor: 阿杰嘴角冷笑
  secondary_anchors: [众人视线转向阿杰]

S15:
  primary_anchor: 手机 00:00:00
  secondary_anchors: [林默血手, 屏幕冷光]
```

## 文本可读性规则

新增 `TEXT_READABILITY_POLICY`：

```yaml
applies_to:
  - carved_text
  - phone_screen
  - photo_back
  - wall_blood_text
  - label_text
rules:
  - 文字必须是 primary anchor 才要求可读
  - 可读文字镜头必须使用 close-up / insert
  - 文字区域占画面至少 40%-60%
  - 禁止 wide shot 承担关键文字阅读
  - 不要在同一镜要求两段以上可读文字
```

质量检查必须能标出：

- wide shot + 手臂刻字可读 = fail
- macro insert + 惊醒/身体动作 = fail
- 多人空间棋盘 + medium close-up = warning/fail

## 台词压缩规则

新增 `DIALOGUE_POLICY`：

```yaml
preserve_full_script: true
generate_visual_cut_version: true
rules:
  - 单镜台词超过 12-16 个中文字符，需要压缩成字幕/旁白/画面信息
  - 解释型台词优先转成道具或表情
  - 冲突型台词保留关键词
  - 每集结尾钩子台词必须保留
```

分镜区使用短台词。例如：

- 雷队：`停电五分钟，老张死了。你手上的血怎么解释？`
- 阿杰：`凯撒就在这间屋子里。`

## 镜头密度控制器

新增内部密度估算输出：

```yaml
SHOT_DENSITY_CONTROLLER:
  duration: 46s
  target_shots:
    minimum: 10
    ideal: 12
    maximum: 14
  average_shot_duration: 3-4s
  exceptions:
    - key_text_insert: 2s
    - final_hook: 4s
    - multi_character_reveal: 4s
```

它主要影响 Director Cut 的推荐，不强行改原始 Full Coverage。

## Keyframe Prompt 局部化

Keyframe Prompt 保留静态图规则，但减少全局风格重复。每条只包含：

- `single cinematic keyframe`
- 画幅
- 本镜镜头/构图
- 本镜 primary/secondary anchors
- 本镜人物位置和环境状态
- 本镜负面约束

不重复完整 `style` 字符串，不重复整段心理惊悚全局说明。

## 质量检查设计

`QUALITY_CHECK` 改为结构化状态：

```yaml
text_readability:
  status: fail
  issues:
    - S04 uses wide environmental shot for readable arm carving
shot_efficiency:
  status: warning
  issues:
    - S05-S08 all introduce suspects; consider compressing
anchor_policy:
  status: warning
  issues:
    - S07 primary anchor mismatched
motion_prompt:
  status: pass
director_cut:
  status: warning
  issues:
    - Director Cut should rewrite conflict beats instead of deleting them
```

## Canvas 影响

`canvas-storyboard-pack` 的 keyframe metadata 应同步更聪明的字段：

- `linkedBeat` 使用真实 Beat id
- `shotFunction` 使用真实镜头功能
- `audienceTakeaway` 使用具体观众收获
- `anchorPolicy` 使用功能优先锚点
- Keyframe prompt 使用局部化静态提示词

不改变节点数量和连接策略。

## 测试要求

新增/更新测试必须覆盖：

1. SCRIPT_BEATS 不是一镜一个 Beat，至少出现 `recommended_shots`、`can_merge_with`、`script_source`。
2. DIRECTOR_DECISION 包含 `decision: keep|merge|delete|rewrite`，并对 S07/S08/S13/S14 给出不同具体判断。
3. AI_RISK_WARNINGS 对 macro 惊醒、wide 文字、medium close-up 四人关系、阿杰 visual priority 错配输出结构化高风险。
4. ANCHOR_POLICY 中 S05/S07/S13/S15 的 primary anchors 符合镜头功能。
5. Keyframe Prompt 不重复完整全局风格句，且文字镜头使用 close-up/insert 局部提示。
6. QUALITY_CHECK 有 `status: fail|warning|pass`。
7. Canvas storyboard metadata 使用真实 Beat 和功能优先 anchor。

