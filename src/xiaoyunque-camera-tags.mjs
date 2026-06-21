export const XIAOYUNQUE_CAMERA_TAGS = Object.freeze([
  { category: '基础控制', tag: '固定镜头', intent: '建立冷静秩序' },
  { category: '基础控制', tag: '镜头上摇', intent: '展示高度威压' },
  { category: '基础控制', tag: '镜头下摇', intent: '从环境落到人' },
  { category: '基础控制', tag: '镜头左摇', intent: '横向展示空间' },
  { category: '基础控制', tag: '镜头右摇', intent: '引出画外信息' },
  { category: '基础控制', tag: '镜头上升', intent: '展开场景规模' },
  { category: '基础控制', tag: '镜头下降', intent: '从全局聚焦' },
  { category: '基础控制', tag: '镜头左移', intent: '制造空间视差' },
  { category: '基础控制', tag: '镜头右移', intent: '制造空间视差' },
  { category: '基础控制', tag: '镜头前推', intent: '强调情绪靠近' },
  { category: '基础控制', tag: '镜头后移', intent: '展示人物孤独' },
  { category: '基础控制', tag: '变焦推进', intent: '突出表情反应' },
  { category: '基础控制', tag: '变焦拉远', intent: '从局部到全貌' },
  { category: '人物跟拍', tag: '跟随拍摄', intent: '跟住人物行动' },
  { category: '人物跟拍', tag: '迎面跟拍', intent: '保留人物表情' },
  { category: '人物跟拍', tag: '侧面跟拍', intent: '强化行进节奏' },
  { category: '人物跟拍', tag: '手持拍摄', intent: '增加真实紧张' },
  { category: '人物跟拍', tag: '第一视角', intent: '进入角色视角' },
  { category: '提示转场', tag: '横滑揭示', intent: '从遮挡露主体' },
  { category: '提示转场', tag: '前景擦过', intent: '用遮挡完成切换' },
  { category: '提示转场', tag: '甩摇', intent: '快速切换信息' },
  { category: '提示转场', tag: '焦点转移', intent: '注意力换目标' },
  { category: '情绪强化', tag: '急速变焦', intent: '放大狗血反应' },
  { category: '情绪强化', tag: '希区柯克', intent: '现实崩塌瞬间' },
  { category: '情绪强化', tag: '环绕拍摄', intent: '强化人物气场' },
  { category: '情绪强化', tag: '盘旋抬升', intent: '高光登场时刻' },
  { category: '情绪强化', tag: '盘旋下降', intent: '巨物压迫登场' },
  { category: '空间航拍', tag: '穿越机运镜', intent: '高速掠过空间' },
  { category: '空间航拍', tag: '稳定器行进', intent: '平稳进入现场' },
  { category: '空间航拍', tag: '穿越镜头', intent: '穿过边界入场' },
  { category: '空间航拍', tag: '高空航拍', intent: '建立宏大世界' },
  { category: '空间航拍', tag: '俯冲下降', intent: '从高空压向目标' },
  { category: '空间航拍', tag: '拉开离场', intent: '人变小世界变大' }
])

export function uniqueXiaoyunqueCameraTags() {
  const seen = new Set()
  return XIAOYUNQUE_CAMERA_TAGS.filter((entry) => {
    if (seen.has(entry.tag)) return false
    seen.add(entry.tag)
    return true
  })
}

export function formatXiaoyunqueCameraTagLines() {
  const lines = []
  let currentCategory = ''
  for (const entry of XIAOYUNQUE_CAMERA_TAGS) {
    if (entry.category !== currentCategory) {
      currentCategory = entry.category
      lines.push(`### ${currentCategory}`)
    }
    lines.push(`- ${entry.tag}｜${entry.intent}`)
  }
  return lines
}
