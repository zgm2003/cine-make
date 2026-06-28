import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildSeedanceReferenceFeedPackage } from '../src/seedance-reference-feed-extractor.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

test('cine-make skill ships reusable Seedance production guidelines', async () => {
  const skill = await readFile(join(root, 'skills', 'cine-make', 'SKILL.md'), 'utf8')
  const outputContract = await readFile(join(root, 'skills', 'cine-make', 'references', 'output-contract.md'), 'utf8')
  const guidelinesPath = join(root, 'skills', 'cine-make', 'references', 'production-guidelines.md')

  assert.equal(existsSync(guidelinesPath), true)
  assert.match(skill, /production-guidelines\.md/u)

  const guidelines = await readFile(guidelinesPath, 'utf8')
  const combined = [outputContract, guidelines].join('\n')

  assert.match(combined, /成年成熟女修/u)
  assert.match(combined, /性感但克制/u)
  assert.match(combined, /内衬、里裙、安全短裤或不透明下摆/u)
  assert.match(combined, /禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡/u)
  assert.match(combined, /5 条逐条视频文本 -> 上传参考图 -> 音色 -> 统一要求/u)
  assert.match(combined, /资产名 = 图片N（人物参考\/场景参考\/道具参考\/界面参考\/群像参考）/u)
  assert.match(combined, /谁说话就以谁为单人主镜头/u)
  assert.match(combined, /场景资产必须贴合逐条视频文本的真实空间/u)
  assert.match(combined, /上传并参考上一集\/第 1 集生成图/u)
  assert.match(combined, /same named character or core prop/u)
  assert.match(combined, /沿用第 1 章生成图，不重新生成/u)
  assert.match(combined, /Do not create a fresh GPT-image-2 tri-view/u)
  assert.match(combined, /不要把每集硬压成固定 40 条/u)
  assert.match(combined, /转向上首王座\/主位\/讲台\/柜台/u)
  assert.match(combined, /众人身体和视线都朝王座方向/u)
  assert.match(combined, /背对王座沿中轴走向敞开的殿门/u)
  assert.match(combined, /掌心朝上/u)
  assert.match(combined, /五指自然弯曲不反折/u)
  assert.match(combined, /正面屏幕朝镜头/u)
  assert.match(combined, /不要背面摄像头/u)
})

test('female xianxia reference prompts add mature restrained styling safeguards', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: [
      '许悠然身穿旗袍从许府后院走出，是年轻但已经成年的女修。',
      '她低头看见练气液被人抢走，压住怒意看向王映凤。',
      '王映凤冷笑道：「练气液是我们许家的。」'
    ].join('\n'),
    style: '3D国漫，国风仙侠，古风写实材质',
    aspectRatio: '16:9',
    expandScript: false
  })

  const female = pack.assets.find((asset) => asset.kind === 'image' && asset.title.includes('许悠然'))

  assert.ok(female)
  assert.match(female.prompt, /成年成熟女修/u)
  assert.match(female.prompt, /高级好看、性感但克制/u)
  assert.match(female.prompt, /吸引力来自脸、发型、肩颈锁骨、腰线、衣料层次、剪裁和气质/u)
  assert.match(female.prompt, /内衬、里裙、安全短裤或不透明下摆/u)
  assert.match(female.prompt, /禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡/u)
  assert.match(female.prompt, /禁止幼态、低俗裸露、夜店风、泳装化、内衣化/u)
  assert.doesNotMatch(female.prompt, /单侧腿部线条必须清楚|不要厚重长裙挡死腿部线条/u)
  assert.match(female.prompt, /4K画质！$/u)
})

test('dedicated Douyin Xianjie female prompts use the same safeguards', () => {
  const pack = buildSeedanceReferenceFeedPackage({
    sourceText: [
      '林夜在鬼王宗宗门大殿绑定抖音系统。',
      '他带着天机一型手机前往姹女教，白清玄带女修迎接。',
      '白清玄笑着问他是不是想双修，随后众人学习拍摄短视频。'
    ].join('\n'),
    style: '3D国漫，国风仙侠，轻喜剧反差',
    aspectRatio: '16:9',
    expandScript: false
  })

  const baiQingxuan = pack.assets.find((asset) => asset.kind === 'image' && asset.title === '白清玄')

  assert.ok(baiQingxuan)
  assert.match(baiQingxuan.prompt, /成年成熟女修/u)
  assert.match(baiQingxuan.prompt, /高级好看、性感但克制/u)
  assert.match(baiQingxuan.prompt, /内衬、里裙、安全短裤或不透明下摆/u)
  assert.match(baiQingxuan.prompt, /禁止高开衩、整条腿暴露、同时露出双腿、低机位扫腿、腿部特写、胸臀腿特写、透明无遮挡/u)
  assert.doesNotMatch(baiQingxuan.prompt, /旗袍|JK|高跟鞋/u)
})
