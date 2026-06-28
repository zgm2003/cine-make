export const FEMALE_XIANXIA_PROMPT_SAFEGUARD = [
  '女性角色生成约束：按成年成熟女修处理，国漫仙侠，高级好看、性感但克制，吸引力来自脸、发型、肩颈锁骨、腰线、衣料层次、剪裁和气质，不靠露腿卖点。',
  '裙装、旗袍、JK、舞服必须有完整衣料结构：内衬、里裙、安全短裤或不透明下摆要明确呈现；可以小开衩或走动时露出少量腿部轮廓，但禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡。',
  '薄纱只能作为外层装饰，不能替代遮挡。禁止幼态、低俗裸露、夜店风、泳装化、内衣化。'
].join('')

const FEMALE_NAME_CUES = /白清玄|许悠然|许怡宁|王映凤/u
const FEMALE_ROLE_CUES = /女修|女子|女人|女性|师姐|师妹|圣女|仙子|阴后|女帝|女主|教主夫人/u
const FEMALE_CLOTHING_CUES = /旗袍|JK|舞服|裙|纱衣|长裙|里裙|高跟鞋/u
const XIANXIA_STYLE_CUES = /仙侠|国漫|古风|修仙|女修|宗门|教主|圣地/u

function hasCue(text, pattern) {
  return pattern.test(String(text ?? ''))
}

function characterHasFemaleCue(name, text) {
  const character = String(name ?? '').trim()
  if (!character) return false
  if (hasCue(character, FEMALE_NAME_CUES)) return true

  const escaped = character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const localCue = new RegExp(`${escaped}.{0,28}(?:女修|女子|女人|女性|旗袍|JK|舞服|裙|纱衣|长裙|阴后|圣女|仙子)|(?:女修|女子|女人|女性|阴后|圣女|仙子).{0,28}${escaped}`, 'u')
  return localCue.test(String(text ?? ''))
}

export function shouldApplyFemaleXianxiaSafeguard({ name, sourceText, style, details }) {
  const combined = [sourceText, details].filter(Boolean).join('\n')
  if (!hasCue([style, combined].join('\n'), XIANXIA_STYLE_CUES)) return false
  if (characterHasFemaleCue(name, combined)) return true
  return hasCue(combined, FEMALE_NAME_CUES) || (hasCue(combined, FEMALE_ROLE_CUES) && hasCue(combined, FEMALE_CLOTHING_CUES))
}

export function appendFemaleXianxiaSafeguard(details, context = {}) {
  const text = String(details ?? '').trim()
  if (!shouldApplyFemaleXianxiaSafeguard({ ...context, details: text })) return text
  if (text.includes('成年成熟女修')) return text
  return [text, FEMALE_XIANXIA_PROMPT_SAFEGUARD].filter(Boolean).join(' ')
}
